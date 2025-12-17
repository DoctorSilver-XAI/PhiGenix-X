import {
  insertNexusMessage,
  touchNexusSession,
  upsertNexusSession
} from '../data/supabase.js';
import { sendNexusMessage } from '../data/nexus-api.js';

function makeId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const listeners = new Set();

const initialState = {
  sessionId: null,
  messages: [],
  status: 'idle',
  error: null,
  diagnostics: {
    sendCount: 0,
    averageNetworkMs: 0,
    lastNetworkMs: 0
  },
  pendingMessageIds: []
};

const state = structuredClone(initialState);
const pendingMessages = new Map();

function notify() {
  listeners.forEach((fn) => {
    try { fn(state); } catch (err) { console.error('[nexusStore] listener', err); }
  });
}

export function getNexusState() {
  return state;
}

export function subscribeNexus(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function hydrateSession({ sessionId, messages }) {
  state.sessionId = sessionId || null;
  state.messages = Array.isArray(messages) ? messages.slice() : [];
  state.status = state.sessionId ? 'ready' : 'idle';
  state.error = null;
  notify();
}

export async function startSession(context = {}) {
  if (state.sessionId) return state.sessionId;

  state.status = 'starting';
  state.error = null;
  notify();

  const sessionId = makeId();
  const sessionPayload = {
    id: sessionId,
    pharmacy_id: context?.pharmacyId || null,
    device_id: context?.deviceId || null,
    title: context?.title || null,
    profile: context?.profile || null,
    status: 'active',
    last_message_at: new Date().toISOString()
  };

  try {
    await upsertNexusSession(sessionPayload);
  } catch (error) {
    console.error('[nexusStore] upsert session failed', error);
    state.status = 'error';
    state.error = error?.message || 'Impossible de créer la session';
    notify();
    throw error;
  }

  state.sessionId = sessionId;
  state.status = 'ready';
  notify();
  return sessionId;
}

function appendMessage(message) {
  state.messages.push(message);
  notify();
}

export async function sendUserMessage(content, options = {}) {
  if (!content?.trim()) return;

  if (!state.sessionId) {
    await startSession(options.context || {});
  }

  const userMsg = {
    id: makeId(),
    role: 'user',
    content,
    components: [],
    actions: [],
    metadata: {},
    created_at: new Date().toISOString()
  };

  appendMessage(userMsg);
  state.status = 'loading';
  state.error = null;
  notify();

  insertNexusMessage({
    ...userMsg,
    session_id: state.sessionId
  }).catch((error) => {
    console.warn('[nexusStore] unable to persist user message', error);
  });

  if (state.sessionId) {
    touchNexusSession(state.sessionId).catch((err) => {
      console.warn('[nexusStore] touch session failed', err);
    });
  }

  const pendingId = pushPendingAssistantMessage();

  try {
    const started = performance.now();
    const response = await sendNexusMessage({
      sessionId: state.sessionId,
      message: content,
      context: options.context || {}
    });
    const duration = Math.round(performance.now() - started);
    updateDiagnostics(duration);

    if (response?.session?.id && response.session.id !== state.sessionId) {
      state.sessionId = response.session.id;
    }

    const assistantPayload = normaliseAssistantPayload(response) || null;
    const assistantMsg = {
      id: assistantPayload?.id || makeId(),
      role: assistantPayload?.role || 'assistant',
      content: assistantPayload?.content || '',
      components: assistantPayload?.components || [],
      actions: assistantPayload?.actions || [],
      metadata: {
        ...(assistantPayload?.metadata || {}),
        performance: {
          elapsedMs: duration,
          averageMs: state.diagnostics.averageNetworkMs
        }
      },
      created_at: new Date().toISOString(),
      raw_payload: response || null
    };

    resolvePendingAssistantMessage(pendingId, assistantMsg);
    state.status = 'ready';
    notify();

    insertNexusMessage({
      ...assistantMsg,
      session_id: state.sessionId,
      raw_payload: response
    }).catch((error) => {
      console.warn('[nexusStore] unable to persist assistant message', error);
    });

    return assistantMsg;
  } catch (error) {
    console.error('[nexusStore] send message error', error);
    resolvePendingAssistantMessage(pendingId, {
      content: error?.message || 'PhiNexus indisponible pour le moment.',
      metadata: {
        pending: false,
        error: true,
        performance: {
          elapsedMs: Math.round(performance.now() - started)
        }
      }
    });
    state.status = 'error';
    state.error = error?.message || 'Erreur PhiNexus';
    notify();
    throw error;
  }
}

function normaliseAssistantPayload(response) {
  if (!response) return null;
  if (response.message) return response.message;

  if (Array.isArray(response)) {
    const first = response[0];
    if (first && typeof first === 'object') {
      const content = first.output || first.content || JSON.stringify(first);
      return { id: makeId(), role: 'assistant', content };
    }
    if (typeof response[0] === 'string') {
      return { id: makeId(), role: 'assistant', content: response.join('\n') };
    }
  }

  if (typeof response === 'string') {
    return { id: makeId(), role: 'assistant', content: response };
  }

  if (response.output) {
    return { id: makeId(), role: 'assistant', content: response.output };
  }

  if (response.data && typeof response.data === 'string') {
    return { id: makeId(), role: 'assistant', content: response.data };
  }

  return {
    id: makeId(),
    role: 'assistant',
    content: 'Réponse PhiNexus reçue (format non reconnu).',
    metadata: { raw: response }
  };
}

export function resetNexus() {
  Object.assign(state, structuredClone(initialState));
  pendingMessages.clear();
  notify();
}

function updateDiagnostics(duration) {
  const diag = state.diagnostics;
  const total = diag.averageNetworkMs * diag.sendCount + duration;
  diag.sendCount += 1;
  diag.lastNetworkMs = duration;
  diag.averageNetworkMs = Math.round(total / diag.sendCount);
}

export function pushPendingAssistantMessage(label = 'PhiNexus réfléchit…') {
  const id = makeId();
  const placeholder = {
    id,
    role: 'assistant',
    content: label,
    components: [],
    actions: [],
    metadata: { pending: true },
    pending: true,
    created_at: new Date().toISOString()
  };
  pendingMessages.set(id, placeholder);
  state.pendingMessageIds.push(id);
  appendMessage(placeholder);
  return id;
}

export function resolvePendingAssistantMessage(id, payload = {}) {
  const index = state.messages.findIndex((msg) => msg.id === id);
  if (index === -1) return;
  const base = state.messages[index];
  const next = {
    ...base,
    ...payload,
    id: payload.id || base.id,
    pending: false,
    metadata: { ...base.metadata, pending: false, ...(payload.metadata || {}) }
  };
  state.messages[index] = next;
  pendingMessages.delete(id);
  state.pendingMessageIds = state.pendingMessageIds.filter((pid) => pid !== id);
  notify();
}

export function clearPendingAssistantMessages() {
  if (!state.pendingMessageIds.length) return;
  state.messages = state.messages.filter((msg) => !msg.pending);
  state.pendingMessageIds = [];
  pendingMessages.clear();
  notify();
}

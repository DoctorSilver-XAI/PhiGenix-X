// Simple state manager for the renderer (tab + data)
const listeners = new Set();

const state = {
  currentTab: 'assistant',
  vision: {
    payload: null,
    error: null,
    status: 'idle' // idle | loading | ready | error
  }
};

export function getState() {
  return state;
}

export function setState(mutator) {
  const prev = JSON.stringify(state);
  mutator(state);
  const next = JSON.stringify(state);
  if (prev === next) return;
  listeners.forEach((fn) => {
    try { fn(state); } catch (err) { console.error('[store] listener error', err); }
  });
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function setTab(tabId) {
  setState((draft) => {
    draft.currentTab = tabId;
  });
}

export function setVisionStatus(status) {
  setState((draft) => {
    draft.vision.status = status;
  });
}

export function setVisionPayload(payload) {
  setState((draft) => {
    draft.vision.payload = payload;
    draft.vision.status = 'ready';
    draft.vision.error = null;
  });
}

export function setVisionError(error) {
  setState((draft) => {
    draft.vision.error = error;
    draft.vision.status = 'error';
  });
}

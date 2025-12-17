// Supabase data layer for PhiGenix renderer
const DEFAULT_SUPABASE = {
  url: 'https://jdtyotueihlnlxsmayie.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkdHlvdHVlaWhsbmx4c21heWllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2Njk5MTksImV4cCI6MjA2MzI0NTkxOX0.FIbF2Wg8UxZOvlcQyeJE2IgK0HwScdoYIe3-bahH-eI'
};

const envConfig = window.pgx?.env ?? {};
const SUPABASE_URL = envConfig.supabaseUrl || DEFAULT_SUPABASE.url || '';
const SUPABASE_KEY = envConfig.supabaseAnonKey || DEFAULT_SUPABASE.anonKey || '';

const supabaseLib = window.supabase;
let supabase = null;

if (SUPABASE_URL && SUPABASE_KEY && supabaseLib?.createClient) {
  try {
    supabase = supabaseLib.createClient(SUPABASE_URL, SUPABASE_KEY);
  } catch (error) {
    console.error('❌ Création du client Supabase impossible:', error);
  }
} else if (!supabaseLib?.createClient) {
  console.error('❌ Library Supabase indisponible : vérifie le chargement de vendor/supabase.js');
} else {
  console.warn('⚠️ Supabase: aucune configuration. Définis PGX_SUPABASE_URL / PGX_SUPABASE_ANON_KEY pour override.');
}

let realtimeChannel = null;
let retryTimer = null;
const INITIAL_RETRY_DELAY = 2000;
const MAX_RETRY_DELAY = 30000;
let retryDelay = INITIAL_RETRY_DELAY;

function clearRetryTimer() {
  if (!retryTimer) return;
  clearTimeout(retryTimer);
  retryTimer = null;
}

async function cleanupRealtime() {
  clearRetryTimer();
  if (!realtimeChannel) return;
  try { await realtimeChannel.unsubscribe(); } catch {}
  try { supabase?.removeChannel?.(realtimeChannel); } catch {}
  realtimeChannel = null;
}

function scheduleRetry(retryFn) {
  if (!supabase || retryTimer) return;
  const delay = retryDelay;
  retryDelay = Math.min(retryDelay * 2, MAX_RETRY_DELAY);
  console.warn(`⚠️ Reconnexion Realtime dans ${delay} ms…`);
  retryTimer = setTimeout(() => {
    retryTimer = null;
    retryFn?.();
  }, delay);
}

export function hasClient() {
  return Boolean(supabase);
}

export async function fetchLatestPayload() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('bar_feed')
      .select('payload')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    return data && data[0]?.payload ? data[0].payload : null;
  } catch (err) {
    console.error('❌ Exception fetch bar_feed:', err);
    throw err;
  }
}

export async function listenRealtime(onInsert, onError) {
  if (!supabase) return () => {};
  await cleanupRealtime();
  retryDelay = INITIAL_RETRY_DELAY;

  realtimeChannel = supabase
    .channel('pgx_bar_feed')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'bar_feed' },
      (payload) => {
        try {
          const data = payload.new?.payload;
          if (data) onInsert?.(data);
        } catch (err) {
          console.error('❌ Erreur traitement INSERT:', err);
        }
      }
    );

  const subscription = realtimeChannel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      retryDelay = INITIAL_RETRY_DELAY;
    }
    if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
      onError?.(new Error(`Realtime status: ${status}`));
      scheduleRetry(async () => {
        try {
          await listenRealtime(onInsert, onError);
        } catch (err) {
          console.error('❌ Retry failed:', err);
        }
      });
    }
  });

  return async () => {
    try { subscription?.unsubscribe?.(); } catch {}
    await cleanupRealtime();
  };
}

export async function disposeRealtime() {
  await cleanupRealtime();
}

export function isSupabaseReady() {
  return Boolean(supabase);
}

export async function upsertNexusSession(session) {
  if (!supabase) throw new Error('Supabase client indisponible');
  const { data, error } = await supabase
    .from('nexus_sessions')
    .upsert(session, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function insertNexusMessage(message) {
  if (!supabase) throw new Error('Supabase client indisponible');
  const { data, error } = await supabase
    .from('nexus_messages')
    .insert(message)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function touchNexusSession(sessionId, patch = {}) {
  if (!supabase) throw new Error('Supabase client indisponible');
  const { data, error } = await supabase
    .from('nexus_sessions')
    .update({ ...patch, last_message_at: new Date().toISOString() })
    .eq('id', sessionId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

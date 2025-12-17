// preload.js — PhiGenix Bar (pont sécurisé Renderer ⇄ Main)
// Objectifs :
// - Exposer une API minimale et sûre dans window.pgx (contextIsolation ON)
// - Permettre au renderer d'appeler : toggle(), resize(h), lire la plateforme,
//   et récupérer d'éventuelles variables d'environnement utiles (Supabase, IDs).
// - Aucun accès Node direct dans le renderer (pas de nodeIntegration).

const { contextBridge, ipcRenderer } = require('electron');

// ---------- Utils sûrs ----------
const safeNumber = (v, def = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};

// Récupération optionnelle d'ENV (si définies par le main process)
// Nommer les variables ENV avec un préfixe explicite pour éviter les surprises.
const env = {
  supabaseUrl:  process.env.PGX_SUPABASE_URL  || null,
  supabaseAnonKey: process.env.PGX_SUPABASE_ANON_KEY || null,
  pharmacyId:   process.env.PGX_PHARMACY_ID   || null,
  deviceId:     process.env.PGX_DEVICE_ID     || null,
};

// ---------- API exposée ----------
contextBridge.exposeInMainWorld('pgx', {
  // Afficher/masquer la barre (utilisé par le fallback clavier dans renderer)
  toggle: () => {
    try { ipcRenderer.send('pgx:toggle'); } catch {}
  },

  // Demander au main process de redimensionner la fenêtre (hauteur pixels)
  resize: (height) => {
    try {
      const h = safeNumber(height, 0);
      if (h > 0) ipcRenderer.send('pgx:resize', { height: h });
    } catch {}
  },

  // Plateforme (pour afficher l’étiquette de raccourci correcte côté UI)
  platform: process.platform || 'unknown',

  // Variables d’environnement optionnelles (lecture seule)
  env,

  // Canal simple pour logs côté main (facultatif)
  log: (message) => {
    try { ipcRenderer.send('pgx:log', String(message ?? '')); } catch {}
  },

  // Réception d’événements optionnels depuis le main (si utilisés plus tard)
  on: (channel, fn) => {
    const allowed = new Set(['pgx:notify', 'pgx:error', 'pgx:payload']);
    if (!allowed.has(channel)) return () => {};
    const handler = (_, data) => { try { fn?.(data); } catch {} };
    ipcRenderer.on(channel, handler);
    return () => ipcRenderer.removeListener(channel, handler);
  },

  nexus: {
    send: async (payload) => {
      try {
        return await ipcRenderer.invoke('phinexus:send', payload);
      } catch (error) {
        return { ok: false, error: error?.message || String(error) };
      }
    },
    status: async () => {
      try {
        return await ipcRenderer.invoke('phinexus:status');
      } catch (error) {
        return { configured: false, error: error?.message || String(error) };
      }
    },
    setEndpoint: async (endpoint, options = {}) => {
      try {
        return await ipcRenderer.invoke('phinexus:setEndpoint', {
          endpoint,
          timeoutMs: options.timeoutMs
        });
      } catch (error) {
        return { configured: false, error: error?.message || String(error) };
      }
    }
  }
});

// Aucune écoute clavier ici :
// - le GLOBAL SHORTCUT est géré dans main.js (CmdOrCtrl+Shift+P)
// - le FALLBACK clavier Windows (Ctrl+Shift+P) est géré dans renderer.js
//   qui appelle pgx.toggle() exposé par ce preload.
// => Ceci suffit pour activer le raccourci Windows sans affaiblir la sécurité.

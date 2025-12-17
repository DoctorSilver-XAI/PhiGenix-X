// main.js — PhiGenix Bar (Electron main process)
// Objet : version réécrite **non-destructive**, avec patch d’alignement en haut de l’écran
//         et occupation de **toute la largeur** de l’écran. Le reste est minimal et stable.
//
// ✅ Points clés
// - Fenêtre ancrée en haut de l’écran (bord supérieur **de l’écran**, pas seulement workArea)
// - Largeur = largeur totale de l’écran cible
// - Hauteur contrôlée par IPC (pgx:resize) + valeur par défaut configurable
// - Raccourci global Cmd/Ctrl + Shift + P pour toggle
// - IPC : pgx:toggle, pgx:resize, pgx:log (+ canaux d’extension non-intrusifs)
// - Gestion DPI / multi‑écrans (ré‑ancrage sur changement de métriques)
//
// ⚠️ Remarque : on privilégie l’ancrage à **display.bounds** (bord d’écran absolu).
// Si vous préférez respecter la zone de travail (sans recouvrir une barre système),
// basculez ANCHOR_TO_SCREEN_BOUNDS à false pour utiliser display.workArea.

const {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  screen,
  net
} = require('electron');
const path = require('path');
const fs = require('fs');

// -------------------------------
// Paramètres
// -------------------------------
const IS_DEV = !app.isPackaged;

// Hauteur par défaut (peut être ajustée via IPC pgx:resize)
const DEFAULT_BAR_HEIGHT = Number(process.env.PGX_BAR_HEIGHT || 260);

// Endpoint PhiNexus (webhook n8n ou orchestrateur futur)
let nexusEndpoint = process.env.PGX_NEXUS_ENDPOINT || '';
let nexusTimeoutMs = Number(process.env.PGX_NEXUS_TIMEOUT || 15000);
let configFilePath = null;

// Choix d’ancrage : true => bord de l’écran (display.bounds) ; false => zone utile (workArea)
const ANCHOR_TO_SCREEN_BOUNDS = true;

// Empêche le déplacement manuel et garantit l’ancrage
const LOCK_POSITION = false;               // autorise le déplacement manuel
const DISABLE_USER_RESIZE = false;         // autorise le redimensionnement manuel

// -------------------------------
// State
// -------------------------------
/** @type {BrowserWindow|null} */
let mainWindow = null;
/** Hauteur courante de la barre */
let currentBarHeight = DEFAULT_BAR_HEIGHT;

// -------------------------------
// Utils
// -------------------------------
/** Clamp numérique simple */
function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

const SAMPLE_NEXUS_RESPONSE = {
  session: {
    id: 'demo-session',
    title: 'Exemple PhiNexus',
    context: {}
  },
  message: {
    id: 'demo-message',
    role: 'assistant',
    content: 'PhiNexus n’est pas encore configuré. Utilisez l’icône ⚙ dans l’onglet pour renseigner l’URL du webhook.',
    components: [
      {
        type: 'suggestions',
        items: [
          { label: 'Configurer PhiNexus', prompt: 'Comment connecter PhiNexus à notre n8n ?' },
          { label: 'Documentation', prompt: 'Où trouver la spec PhiNexus ?' }
        ]
      }
    ],
    actions: [],
    metadata: {
      sources: [],
      processing: { elapsed_ms: 0, agents: [] },
      confidence: 0
    }
  }
};

function getConfigFilePath() {
  if (!configFilePath) {
    try {
      configFilePath = path.join(app.getPath('userData'), 'phigenix-config.json');
    } catch (err) {
      console.warn('[pgx] Impossible de déterminer le dossier de configuration:', err);
      configFilePath = null;
    }
  }
  return configFilePath;
}

function loadNexusConfig() {
  try {
    const file = getConfigFilePath();
    if (!file || !fs.existsSync(file)) return;
    const raw = fs.readFileSync(file, 'utf-8');
    const data = JSON.parse(raw);
    if (typeof data.nexusEndpoint === 'string') {
      nexusEndpoint = data.nexusEndpoint;
    }
    if (Number.isFinite(Number(data.nexusTimeoutMs))) {
      nexusTimeoutMs = Number(data.nexusTimeoutMs);
    }
  } catch (err) {
    console.warn('[pgx] Charge config PhiNexus impossible:', err);
  }
}

function saveNexusConfig() {
  try {
    const file = getConfigFilePath();
    if (!file) return;
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const payload = {
      nexusEndpoint,
      nexusTimeoutMs
    };
    fs.writeFileSync(file, JSON.stringify(payload, null, 2), 'utf-8');
  } catch (err) {
    console.error('[pgx] Sauvegarde config PhiNexus impossible:', err);
  }
}

function requestPhiNexus(payload) {
  return new Promise((resolve, reject) => {
    if (!nexusEndpoint) {
      resolve(SAMPLE_NEXUS_RESPONSE);
      return;
    }

    let finished = false;
    const request = net.request({ method: 'POST', url: nexusEndpoint });
    const timeout = setTimeout(() => {
      if (finished) return;
      finished = true;
      try { request.abort(); } catch {}
      reject(new Error('PhiNexus request timeout'));
    }, nexusTimeoutMs);

    request.setHeader('Content-Type', 'application/json');
    request.on('error', (error) => {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);
      reject(error);
    });

    request.on('response', (response) => {
      let raw = '';
      response.on('data', (chunk) => { raw += chunk.toString(); });
      response.on('end', () => {
        if (finished) return;
        finished = true;
        clearTimeout(timeout);

        if (response.statusCode >= 200 && response.statusCode < 300) {
          if (!raw) {
            resolve(null);
            return;
          }
          try {
            resolve(JSON.parse(raw));
          } catch (err) {
            reject(new Error('PhiNexus: réponse JSON invalide'));
          }
        } else {
          const message = raw || `PhiNexus HTTP ${response.statusCode}`;
          reject(new Error(message));
        }
      });
    });

    try {
      request.write(JSON.stringify(payload || {}));
    } catch (err) {
      clearTimeout(timeout);
      reject(err);
      return;
    }

    request.end();
  });
}

/**
 * Sélectionne le bon écran d’ancrage.
 * - Au démarrage : écran principal
 * - Ensuite : écran contenant la fenêtre
 */
function pickDisplay() {
  try {
    if (mainWindow) {
      const winBounds = mainWindow.getBounds();
      return screen.getDisplayMatching(winBounds) || screen.getPrimaryDisplay();
    }
    return screen.getPrimaryDisplay();
  } catch {
    return screen.getPrimaryDisplay();
  }
}

/**
 * Calcule les bounds de la barre ancrée en haut et sur toute la largeur.
 * @param {number} desiredHeight - hauteur souhaitée (sera clampée)
 * @param {Electron.Display} [display] - écran cible
 * @returns {{x:number,y:number,width:number,height:number}}
 */
function computeBarBounds(desiredHeight, display = pickDisplay()) {
  const box = ANCHOR_TO_SCREEN_BOUNDS ? display.bounds : display.workArea;
  const height = clamp(Math.round(desiredHeight || DEFAULT_BAR_HEIGHT), 1, box.height);
  return { x: box.x, y: box.y, width: box.width, height };
}

/** Applique les bounds calculés en restant ancré en haut */
function snapToTop(height = currentBarHeight) {
  if (!mainWindow) return;
  const bounds = computeBarBounds(height, pickDisplay());
  try {
    mainWindow.setPosition(bounds.x, bounds.y);
    mainWindow.setContentSize(bounds.width, bounds.height);
  } catch (err) {
    console.error('[pgx] snapToTop error:', err);
    mainWindow.setBounds(bounds);
  }
}

/** Toggle visibilité (raccourci global + IPC) */
function toggleBar() {
  if (!mainWindow) return;
  if (mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    mainWindow.showInactive ? mainWindow.showInactive() : mainWindow.show();
    mainWindow.focus();
  }
}

/** Enregistre/désenregistre les raccourcis globaux */
function registerShortcuts() {
  try {
    globalShortcut.register('CommandOrControl+Shift+P', toggleBar);
  } catch (err) {
    console.error('[pgx] Échec enregistrement raccourci global:', err);
  }
}
function unregisterShortcuts() {
  try { globalShortcut.unregisterAll(); } catch {}
}

// -------------------------------
// Création de la fenêtre
// -------------------------------
function createWindow() {
  const initialBounds = computeBarBounds(DEFAULT_BAR_HEIGHT, screen.getPrimaryDisplay());

  mainWindow = new BrowserWindow({
    ...initialBounds,

    show: false,                 // montré après ready-to-show pour éviter les "flash"
    frame: false,                // barre personnalisée (UI custom)
    transparent: false,          // si vous utilisez la transparence : true + backgroundColor: '#00000000'
    backgroundColor: '#0b1220',  // cohérent avec le fond de l’app
    resizable: true,
    movable: true,
    fullscreenable: false,
    maximizable: false,
    minimizable: true,
    autoHideMenuBar: true,
    useContentSize: true,        // évite les décalages liés au cadre Windows
    hasShadow: false,

    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      devTools: IS_DEV
    }
  });

  // Charge l’UI
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // DPI / Scaling : réaligne à l’ouverture
  mainWindow.once('ready-to-show', () => {
    snapToTop(DEFAULT_BAR_HEIGHT);
    mainWindow.show();
  });

  // Sécurité & UX : fermer = cacher sur macOS (optionnel)
  mainWindow.on('close', (e) => {
    if (process.platform === 'darwin' && !app.isQuiting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  // Verrou de déplacement si demandé
  if (LOCK_POSITION) {
    // Si l’utilisateur tente quand même un move/resize, on ré‑ancre
    mainWindow.on('move', () => snapToTop());
    mainWindow.on('resize', () => snapToTop(mainWindow.getBounds().height));
  }

  // Re‑ancrage sur changement d’affichage / DPI
  const resnap = () => snapToTop(currentBarHeight);
  screen.on('display-metrics-changed', resnap);
  screen.on('display-added', resnap);
  screen.on('display-removed', resnap);
}

// -------------------------------
// IPC (exposées via preload en window.pgx.*)
// -------------------------------
function registerIpc() {
  // Toggle visibilité
  ipcMain.on('pgx:toggle', () => toggleBar());

  // Resize vertical (garde l’ancrage haut et la largeur écran)
  ipcMain.on('pgx:resize', (_evt, payload) => {
    try {
      const nextH = Number(payload?.height ?? payload) || currentBarHeight;
      currentBarHeight = clamp(nextH, 1, pickDisplay().bounds.height);
      if (!mainWindow) return;
      snapToTop(currentBarHeight);
    } catch (err) {
      console.error('[pgx] resize error:', err);
    }
  });

  // Logger simple
  ipcMain.on('pgx:log', (_evt, message) => {
    try { console.log('[pgx]', message); } catch {}
  });

  // Optionnel : re-ancrage forcé (si jamais utile côté renderer)
  ipcMain.on('pgx:reanchor', () => snapToTop(currentBarHeight));

  ipcMain.removeHandler('phinexus:send');
  ipcMain.removeHandler('phinexus:status');

  ipcMain.handle('phinexus:send', async (_evt, payload) => {
    try {
      const response = await requestPhiNexus(payload);
      return { ok: true, data: response };
    } catch (err) {
      console.error('[pgx] PhiNexus error:', err);
      return { ok: false, error: err?.message || String(err) };
    }
  });

  ipcMain.handle('phinexus:status', async () => ({
    configured: Boolean(nexusEndpoint),
    endpoint: nexusEndpoint
  }));

  ipcMain.handle('phinexus:setEndpoint', async (_evt, payload = {}) => {
    nexusEndpoint = String(payload?.endpoint || '').trim();
    if (payload?.timeoutMs) {
      const parsed = Number(payload.timeoutMs);
      if (Number.isFinite(parsed) && parsed > 0) {
        nexusTimeoutMs = parsed;
      }
    }
    saveNexusConfig();
    return {
      configured: Boolean(nexusEndpoint),
      endpoint: nexusEndpoint
    };
  });
}

// -------------------------------
// Cycle de vie application
// -------------------------------
function ready() {
  // Windows : modèle d’application (notifications, JumpList, etc.)
  if (process.platform === 'win32') {
    try { app.setAppUserModelId('com.phigenix.bar'); } catch {}
  }

  loadNexusConfig();

  createWindow();
  registerIpc();
  registerShortcuts();

  // macOS : recréer la fenêtre au clic sur l’icône du dock
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else if (mainWindow) {
      mainWindow.show();
    }
  });
}

// Instance unique (évite plusieurs barres)
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
  app.whenReady().then(ready);
}

// Sortie propre
app.on('before-quit', () => { app.isQuiting = true; });
app.on('will-quit', () => unregisterShortcuts());

app.on('window-all-closed', () => {
  // Sur Windows/Linux, quitter quand toutes les fenêtres sont fermées
  if (process.platform !== 'darwin') app.quit();
});

import { getState, subscribe, setVisionStatus, setVisionPayload, setVisionError } from './state/store.js';
import { hasClient, fetchLatestPayload, listenRealtime, disposeRealtime } from './data/supabase.js';
import { renderVision, getBarRoot } from './ui/vision.js';
import { refreshTabs } from './ui/tabs.js';

let unsubscribeRealtime = null;
let lastSentHeight = 0;
const EXTRA_MARGIN = 0;

const barRoot = getBarRoot();

function debounce(fn, ms = 80) {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

async function requestResize() {
  if (!barRoot || !window.pgx?.resize) return;

  await new Promise((resolve) => {
    if (typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(() => resolve());
    } else {
      resolve();
    }
  });

  const screenHeight = Math.max(window.innerHeight || 0, window.screen?.availHeight || 0);
  const target = Math.ceil(screenHeight || DEFAULT_BAR_HEIGHT);

  if (Math.abs(target - lastSentHeight) <= 1) return;
  lastSentHeight = target;
  window.pgx.resize(target);
}

const ro = new ResizeObserver(debounce(requestResize, 60));
if (barRoot) ro.observe(barRoot);

function renderApp(state) {
  if (state.vision.status === 'ready' && state.vision.payload) {
    renderVision(state.vision.payload);
  } else if (state.vision.status === 'error') {
    renderVision({
      advice_oral: state.vision.error?.message || 'Erreur chargement flux',
      advice_points: [],
      dci: [],
      recommandations: [],
      produits: [],
      pourquoi: [],
      badges: []
    });
  } else {
    renderVision(null);
  }
  void requestResize();
}

async function boot() {
  if (!hasClient()) {
    console.warn('⚠️ Supabase inactif – seules les données locales (Alt+T) sont disponibles.');
    renderVision(null);
    return;
  }

  setVisionStatus('loading');
  try {
    const payload = await fetchLatestPayload();
    if (payload) {
      setVisionPayload(payload);
    } else {
      setVisionStatus('ready');
      renderVision(null);
    }
  } catch (err) {
    console.error('❌ Erreur boot renderer:', err);
    setVisionError(err);
  }

  unsubscribeRealtime = await listenRealtime(
    (payload) => setVisionPayload(payload),
    (error) => setVisionError(error)
  );

  window.addEventListener('beforeunload', () => {
    unsubscribeRealtime?.();
    void disposeRealtime();
  });
}

export function initApp() {
  subscribe((state) => {
    renderApp(state);
    refreshTabs();
  });

  renderApp(getState());
  refreshTabs();
  window.addEventListener('load', () => { void requestResize(); });
  boot();
}

// Dev preview Alt+T
const SAMPLE = {
  advice_oral: 'Respecter la prescription : paracétamol pour la douleur, phloroglucinol pour les spasmes, racecadotril pour la diarrhée.',
  advice_points: [
    'Ne pas associer un autre paracétamol ; respecter ≥6 h entre prises.',
    'Hydrater régulièrement (ORS) ; consulter si aggravation.',
    'Surveiller la fièvre ; réévaluer sous 48 h.'
  ],
  dci: ['DOLIPRANE 1000MG', 'PHLOROGLUCINOL 1', 'RACECADOTRIL 100', 'VOGALÈNE 15MG GE'],
  recommandations: [
    'Paracétamol : max 60 mg/kg/j (adulte max 3 g/j).',
    'Phloroglucinol : selon ordonnance ; prudence grossesse.',
    'Racecadotril : respecter posologie et durée ; stop si sang.',
    'Vogalène : utiliser si nausées importantes ; somnolence possible.'
  ],
  produits: ['Solution de réhydratation orale', 'Sachets de probiotiques', 'Thermomètre frontal'],
  pourquoi: [
    'Prévenir la déshydratation liée aux diarrhées.',
    'Aider à restaurer la flore après gastroentérite.',
    'Suivre l’évolution de la fièvre à domicile.'
  ],
  badges: [
    { label: 'Ordonnance 2 lignes' },
    { label: 'Alerte hépatique si alcool/IR', type: 'warn' },
    { label: 'CTA: Fiche posologie' }
  ]
};

window.addEventListener('keydown', (e) => {
  if (e.altKey && e.key.toLowerCase() === 't') {
    setVisionPayload(SAMPLE);
  }
});

window.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && (e.key === 'p' || e.key === 'P')) {
    try { window.pgx?.toggle?.(); } catch {}
    e.preventDefault();
  }
});

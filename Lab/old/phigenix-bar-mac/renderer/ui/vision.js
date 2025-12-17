// Dom references for Vision tab
const els = {
  adviceOral: document.getElementById('advice_oral'),
  advicePoints: document.getElementById('advice_points'),
  dci: document.getElementById('col_dci'),
  recMed: document.getElementById('col_rec_med'),
  cs: document.getElementById('col_cs'),
  csRec: document.getElementById('col_cs_rec'),
  badges: document.getElementById('badges'),
  barRoot: document.querySelector('.bar')
};

const clear = (el) => el && (el.innerHTML = '');
const row = (text) => {
  const r = document.createElement('div');
  r.className = 'row';
  const d = document.createElement('div'); d.className = 'dot';
  const s = document.createElement('div'); s.textContent = String(text ?? '—');
  r.append(d, s);
  return r;
};
const badge = (label, warn = false) => {
  const b = document.createElement('span');
  b.className = 'badge' + (warn ? ' warn' : '');
  b.textContent = label;
  return b;
};

export function renderVision(payload) {
  if (!payload) {
    renderEmpty();
    return;
  }

  clear(els.adviceOral);
  els.adviceOral.textContent = payload?.advice_oral || '—';

  clear(els.advicePoints);
  (payload?.advice_points ?? []).forEach((t) => {
    const li = document.createElement('li');
    li.textContent = t;
    els.advicePoints.appendChild(li);
  });

  clear(els.dci);
  (payload?.dci ?? []).forEach((t) => els.dci.appendChild(row(t)));

  clear(els.recMed);
  (payload?.recommandations ?? []).forEach((t) => els.recMed.appendChild(row(t)));

  clear(els.cs);
  (payload?.produits ?? []).forEach((t) => els.cs.appendChild(row(t)));

  clear(els.csRec);
  (payload?.pourquoi ?? []).forEach((t) => els.csRec.appendChild(row(t)));

  clear(els.badges);
  const bs = payload?.badges ?? [];
  if (bs.length) {
    bs.forEach((b) => els.badges.appendChild(badge(b.label ?? String(b), b.type === 'warn')));
  } else {
    els.badges.appendChild(document.createElement('span')).textContent = '—';
  }
}

export function renderEmpty() {
  renderVision({
    advice_oral: '—',
    advice_points: [],
    dci: [],
    recommandations: [],
    produits: [],
    pourquoi: [],
    badges: []
  });
}

export function getBarRoot() {
  return els.barRoot;
}

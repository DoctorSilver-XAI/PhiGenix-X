import { getState, setTab } from '../state/store.js';

const tabButtons = Array.from(document.querySelectorAll('.pgx-tab'));
const panels = Array.from(document.querySelectorAll('[data-tab-panel]'));

function updateTabs() {
  const { currentTab } = getState();
  tabButtons.forEach((btn) => {
    const isActive = btn.dataset.tab === currentTab;
    btn.classList.toggle('is-active', isActive);
    btn.setAttribute('aria-selected', String(isActive));
    btn.setAttribute('tabindex', isActive ? '0' : '-1');
  });
  panels.forEach((panel) => {
    const isActive = panel.dataset.tabPanel === currentTab;
    panel.hidden = !isActive;
    panel.setAttribute('aria-hidden', String(!isActive));
  });
}

export function initTabs() {
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.disabled || btn.getAttribute('aria-disabled') === 'true') return;
      setTab(btn.dataset.tab);
      updateTabs();
    });
    btn.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        btn.click();
      }
    });
  });

  updateTabs();
}

export function refreshTabs() {
  updateTabs();
}

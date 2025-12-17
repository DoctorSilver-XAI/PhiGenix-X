import { subscribeNexus, getNexusState, sendUserMessage, startSession, resetNexus } from '../state/nexusStore.js';
import { getNexusStatus, setNexusEndpoint } from '../data/nexus-api.js';

function formatMs(ms) {
  if (!ms || Number.isNaN(ms)) return '';
  if (ms < 1000) return '<1 s';
  return `${(ms / 1000).toFixed(1)} s`;
}

const selectors = {
  container: document.querySelector('[data-tab-panel="assistant"]'),
  status: document.getElementById('nexus_status'),
  scroll: document.getElementById('nexus_scroll'),
  messages: document.getElementById('nexus_messages'),
  composer: document.getElementById('nexus_composer'),
  input: document.getElementById('nexus_input'),
  settingsBtn: document.getElementById('nexus_settings_btn'),
  settingsModal: document.getElementById('nexus_settings'),
  settingsForm: document.getElementById('nexus_settings_form'),
  endpointInput: document.getElementById('nexus_endpoint_input'),
  settingsCloseButtons: document.querySelectorAll('[data-close-settings]')
};

let currentEndpoint = '';
let keydownRegistered = false;

function renderMessage(message) {
  const wrapper = document.createElement('div');
  wrapper.className = `nexus-message ${message.role}${message.pending ? ' pending' : ''}`;

  const avatar = document.createElement('div');
  avatar.className = 'nexus-avatar';
  avatar.textContent = message.role === 'assistant' ? 'Φ' : 'VS';
  wrapper.appendChild(avatar);

  const bubble = document.createElement('div');
  bubble.className = 'nexus-bubble';

  const text = document.createElement('div');
  text.className = 'content';
  text.textContent = message.content || '';
  bubble.appendChild(text);

  if (message.components?.length) {
    const zone = document.createElement('div');
    zone.className = 'nexus-components';
    message.components.forEach((component) => {
      zone.appendChild(renderComponent(component));
    });
    bubble.appendChild(zone);
  }

  if (message.actions?.length) {
    const zone = document.createElement('div');
    zone.className = 'nexus-suggestions';
    message.actions.forEach((action) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = action.label || 'Action';
      btn.addEventListener('click', () => handleAction(action));
      zone.appendChild(btn);
    });
    bubble.appendChild(zone);
  }

  const elapsed = message.metadata?.performance?.elapsedMs;
  if (elapsed) {
    const meta = document.createElement('div');
    meta.className = 'nexus-meta';
    meta.textContent = `Réponse en ${formatMs(elapsed)}`;
    bubble.appendChild(meta);
  }

  wrapper.appendChild(bubble);
  return wrapper;
}

function renderComponent(component) {
  const card = document.createElement('div');
  card.className = 'nexus-component';
  switch (component?.type) {
    case 'text':
      {
        const body = document.createElement('div');
        body.textContent = component.body || '';
        card.appendChild(body);
      }
      break;
    case 'productList':
      {
        const title = document.createElement('h3');
        title.textContent = component.title || 'Produits recommandés';
        card.appendChild(title);
        (component.items || []).forEach((item) => {
          const block = document.createElement('div');
          block.className = 'nexus-product';
          const name = document.createElement('strong');
          name.textContent = item.name || item.label || 'Produit';
          block.appendChild(name);
          if (item.posology) {
            const poso = document.createElement('div');
            poso.textContent = item.posology;
            block.appendChild(poso);
          }
          if (item.reason) {
            const reason = document.createElement('div');
            reason.className = 'reason';
            reason.textContent = item.reason;
            block.appendChild(reason);
          }
          if (item.cta) {
            const btn = document.createElement('button');
            btn.className = 'cta';
            btn.type = 'button';
            btn.textContent = item.cta.label || 'Voir';
            btn.addEventListener('click', () => handleAction(item.cta));
            block.appendChild(btn);
          }
          card.appendChild(block);
        });
      }
      break;
    case 'alert':
      {
        card.classList.add('alert');
        if (component.level === 'danger') card.classList.add('danger');
        if (component.title) {
          const title = document.createElement('h3');
          title.textContent = component.title;
          card.appendChild(title);
        }
        const desc = document.createElement('div');
        desc.textContent = component.description || '';
        card.appendChild(desc);
      }
      break;
    case 'badgeList':
      {
        card.classList.add('nexus-badge-list');
        card.innerHTML = '';
        (component.items || []).forEach((item) => {
          const badge = document.createElement('span');
          badge.className = 'nexus-badge';
          badge.textContent = item.label || item;
          card.appendChild(badge);
        });
      }
      break;
    case 'suggestions':
      {
        card.innerHTML = '';
        card.classList.add('nexus-suggestions');
        (component.items || []).forEach((item) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.textContent = item.label || 'Suggestion';
          btn.addEventListener('click', () => insertPrompt(item.prompt || item.label));
          card.appendChild(btn);
        });
      }
      break;
    default:
      card.textContent = `Composant ${component?.type || 'inconnu'} non supporté`;
  }
  return card;
}

function handleAction(action) {
  const prompt = action?.payload?.command ? `${action.payload.command} ${action.payload.args ? JSON.stringify(action.payload.args) : ''}` : action?.payload?.prompt;
  if (prompt) {
    insertPrompt(prompt);
  }
}

function insertPrompt(text) {
  if (!selectors.input) return;
  selectors.input.value = text;
  selectors.input.focus();
  selectors.input.dispatchEvent(new Event('input'));
}

function scrollBottom() {
  if (!selectors.scroll) return;
  selectors.scroll.scrollTop = selectors.scroll.scrollHeight;
}

function openSettings() {
  if (!selectors.settingsModal) return;
  if (selectors.endpointInput) {
    selectors.endpointInput.value = currentEndpoint;
  }
  selectors.settingsModal.hidden = false;
  setTimeout(() => {
    selectors.endpointInput?.focus();
  }, 0);
}

function closeSettings() {
  if (!selectors.settingsModal) return;
  selectors.settingsModal.hidden = true;
}

function render(state) {
  if (!selectors.messages || !selectors.scroll) return;

  const { scrollTop, clientHeight, scrollHeight } = selectors.scroll;
  const stickToBottom = scrollTop + clientHeight >= scrollHeight - 80;

  selectors.messages.innerHTML = '';
  state.messages.forEach((msg) => {
    selectors.messages.appendChild(renderMessage(msg));
  });

  if (selectors.status) {
    if (state.status === 'loading') {
      selectors.status.textContent = 'PhiNexus réfléchit…';
    } else if (state.status === 'error') {
      selectors.status.textContent = state.error || 'PhiNexus indisponible';
    } else {
      const diag = state.diagnostics || {};
      const info = diag.lastNetworkMs ? ` · ${formatMs(diag.lastNetworkMs)}` : '';
      selectors.status.textContent = `PhiNexus prêt${info}`;
    }
  }

  if (selectors.composer) {
    const sendButton = selectors.composer.querySelector('.nexus-send');
    if (sendButton) {
      const loading = state.status === 'loading';
      sendButton.disabled = loading;
      sendButton.classList.toggle('is-loading', loading);
      sendButton.textContent = loading ? 'Envoi…' : 'Envoyer';
    }
  }

  if (stickToBottom) {
    scrollBottom();
  }
}

function autoResizeTextarea() {
  if (!selectors.input) return;
  selectors.input.style.height = 'auto';
  selectors.input.style.height = `${Math.min(selectors.input.scrollHeight, 140)}px`;
}

export function initNexusUI(context = {}) {
  if (!selectors.container) return;

  subscribeNexus(render);
  render(getNexusState());

  startSession(context).catch(() => {});

  if (selectors.settingsBtn) {
    selectors.settingsBtn.addEventListener('click', openSettings);
  }

  selectors.settingsCloseButtons?.forEach((btn) => {
    btn.addEventListener('click', closeSettings);
  });

  if (selectors.settingsModal) {
    selectors.settingsModal.addEventListener('click', (event) => {
      if (event.target === selectors.settingsModal) {
        closeSettings();
      }
    });
  }

  if (selectors.composer) {
    selectors.composer.addEventListener('submit', async (event) => {
      event.preventDefault();
      const value = selectors.input?.value?.trim();
      if (!value) return;
      selectors.input.value = '';
      autoResizeTextarea();
      try {
        await sendUserMessage(value, { context });
      } catch {}
    });
  }

  if (selectors.input) {
    selectors.input.addEventListener('input', autoResizeTextarea);
    selectors.input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        selectors.composer?.requestSubmit?.();
      }
    });
  }

  if (selectors.settingsForm) {
    selectors.settingsForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const endpoint = selectors.endpointInput?.value?.trim() || '';
      const result = await setNexusEndpoint(endpoint);
      if (result?.error) {
        if (selectors.status) {
          selectors.status.textContent = `Erreur configuration : ${result.error}`;
        }
        return;
      }
      currentEndpoint = result?.endpoint || '';
      if (selectors.status) {
        selectors.status.textContent = result?.configured ? 'PhiNexus connecté' : 'Endpoint non configuré';
      }
      closeSettings();
    });
  }

  getNexusStatus().then((status) => {
    if (!selectors.status) return;
    selectors.status.textContent = status?.configured ? 'PhiNexus connecté' : 'Endpoint non configuré';
    currentEndpoint = status?.endpoint || '';
    if (selectors.endpointInput) {
      selectors.endpointInput.value = currentEndpoint;
    }
  }).catch(() => {
    if (selectors.status) selectors.status.textContent = 'Statut indisponible';
  });

  if (!keydownRegistered) {
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeSettings();
      }
    });
    keydownRegistered = true;
  }
}

export function teardownNexusUI() {
  resetNexus();
  if (selectors.messages) selectors.messages.innerHTML = '';
}

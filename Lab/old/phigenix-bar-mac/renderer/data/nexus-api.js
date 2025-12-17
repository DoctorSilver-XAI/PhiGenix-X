// PhiNexus API bridge — utilise l'IPC exposée dans preload

function ensureBridge() {
  if (!window.pgx?.nexus?.send) {
    throw new Error('Bridge PhiNexus indisponible.');
  }
}

/**
 * Envoie un message au backend PhiNexus.
 * @param {{ sessionId?: string, message: string, context?: object }} payload
 * @returns {Promise<any>} Réponse JSON normalisée ou erreur encapsulée
 */
export async function sendNexusMessage(payload) {
  ensureBridge();
  const request = {
    ...payload,
    timestamp: Date.now()
  };

  const result = await window.pgx.nexus.send(request);
  if (!result) throw new Error('Réponse vide de PhiNexus');
  if (result.ok === false) {
    throw new Error(result.error || 'Erreur PhiNexus inconnue');
  }
  return result.data;
}

export async function getNexusStatus() {
  if (!window.pgx?.nexus?.status) return { configured: false };
  try {
    return await window.pgx.nexus.status();
  } catch {
    return { configured: false };
  }
}

export async function setNexusEndpoint(endpoint, options = {}) {
  if (!window.pgx?.nexus?.setEndpoint) return { configured: false };
  try {
    return await window.pgx.nexus.setEndpoint(endpoint, options);
  } catch (error) {
    return { configured: false, error: error?.message || String(error) };
  }
}

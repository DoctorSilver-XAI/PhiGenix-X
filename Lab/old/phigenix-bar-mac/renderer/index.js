// Entry point for renderer process
import { initApp } from './app.js';
import { initTabs } from './ui/tabs.js';
import { initNexusUI } from './ui/nexus.js';

initTabs();
initApp();

initNexusUI({
  pharmacyId: window.pgx?.env?.pharmacyId || null,
  deviceId: window.pgx?.env?.deviceId || null
});

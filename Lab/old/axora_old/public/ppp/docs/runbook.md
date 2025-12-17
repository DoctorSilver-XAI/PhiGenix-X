# Runbook
- **Lancer en local (serveur statique)** : `node local-server.js` (ouvre http://localhost:4173). Nécessite Node. Alternative : double-clic `launch-mac.command` / `launch-windows.bat`.
- **Mode Electron** : `npm install` (première fois) puis `npm start` pour ouvrir la fenêtre desktop. Build : `npm run build:mac|win|linux` (electron-builder requis).
- **Remplir un exemple** : bouton “📄 Remplir l'exemple” → charge `exemples/exemple_DP_VK.PNG`, notes préremplies, met “Vignaud Karl”, ajuste la tranche d’âge et la date si vide.
- **Assistant IA** : ouvrir le panneau, uploader une capture DP ou saisir des notes, régler la tranche d’âge, cliquer “Finaliser le PPP”. Le loader simule la progression; la réponse IA remplit les colonnes.
- **Impression** : bouton “🖨️ Imprimer le PPP” → applique `css/print.css` (A4 paysage).
- **Tranches d’âge** : gérées dans `js/utils/age.js` (source unique pour le select et la détection).
- **Dépannage rapide** :
  - L’exemple ne charge pas → vérifier la présence de `exemples/exemple_DP_VK.PNG`.
  - Rien ne se génère → vérifier `OPENAI_CONFIG.API_KEY` + connectivité réseau + console navigateur.

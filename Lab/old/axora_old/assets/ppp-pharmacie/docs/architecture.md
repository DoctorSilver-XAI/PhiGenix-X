# Architecture rapide
- **Entrée HTML** : `index.html` contient toute la structure (header identité, select pharmacien/âge, boutons actions, zones saisie, grille PPP). Aucune build step.
- **CSS** : `css/variables.css` (tokens), `css/components.css` (UI), `css/layout.css` (grilles/responsive), `css/prompt.css` (panneau prompt), `css/print.css` (A4 paysage).
- **JavaScript (modules ES)** :
  - `js/main.js` : glue UI (toggle assistant, impression, synchro pharmacien, date, génération IA, remplissage exemple, détection tranche d’âge).
  - `js/components/pppGenerator.js` : rend les lignes éditables, applique le thème par tranche d’âge, gère boutons remplir/effacer.
  - `js/components/imageUpload.js` : upload/preview en base64.
  - `js/components/notesInput.js` : textarea notes (paste en texte brut).
  - `js/components/promptManager.js` : panneau d’édition du prompt (localStorage).
  - `js/components/exampleLoader.js` : charge l’exemple DP + notes + patient (chemin `exemples/exemple_DP_VK.PNG`).
  - `js/utils/age.js` : source unique des tranches d’âge, population du select, détection dans le texte.
  - `js/api/openai.js` : appel OpenAI (chat completions) avec prompt actif.
  - `js/data/templates.js` : contenus d’exemple par tranche d’âge.
  - `js/data/prompts.js` : prompt système JSON-only.
  - `js/config.js` : `DEFAULT_AGE_RANGE`, thème couleurs, config OpenAI.
- **Serveurs** : `local-server.js` (HTTP statique Node), `electron/main.js` (fenêtre desktop) + `electron/preload.js` (placeholder).
- **Ressources** : dossiers `assets/` (logos), `exemples/` (fichiers de démonstration).

# Flux principal
1) DOMContentLoaded -> `main.js` peuple le select d’âge (`populateAgeSelect`), masque l’assistant, fixe la date si vide.
2) Initialisation : `initPPPGenerator` (thème + editables), `initPromptUI`, puis instanciation lazy de l’upload/notes.
3) Actions utilisateur :
   - Bouton assistant : ouvre/ferme + init upload/notes.
   - Bouton exemple : `exampleLoader.loadVKExample()` (image + notes + nom + tranche d’âge + date).
   - Saisie notes : `detectAgeBucket` ajuste le select d’âge.
   - Bouton générer : construit la requête OpenAI (image base64 + notes + tranche d’âge), injecte la réponse via `fillFromAI`.
   - Bouton imprimer : `window.print()` (CSS print).
4) Rendu : thèmes et templates s’appliquent selon la valeur du select d’âge (via évènement `change`).

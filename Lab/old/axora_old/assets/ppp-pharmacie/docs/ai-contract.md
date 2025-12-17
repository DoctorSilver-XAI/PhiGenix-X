# Contrat IA
- **Clé OpenAI** : renseigner `OPENAI_CONFIG.API_KEY` dans `js/config.js` (client-side). Pour une clé sensible, passer par un backend ou l’injecter via Electron (process.env) et ne pas committer.
- **Modèle/config** : `OPENAI_CONFIG.MODEL` (par défaut `gpt-4o`), `MAX_TOKENS` 2000.
- **Prompt actif** : récupéré via `getActivePrompt()` (prompt système `js/data/prompts.js` + éventuel override localStorage depuis le panneau “Paramètres IA”).
- **Messages envoyés** :
  - `role: system` → prompt actif (détaille format JSON, contraintes cliniques).
  - `role: user` → texte `Tranche d'âge: X\nNotes d'entretien: Y` + éventuelle image DP en base64 (content type `image_url`).
- **Réponse attendue** : JSON strict sans balises ni markdown, format :
```json
{
  "insights": ["..."],
  "priorities": ["..."],
  "freins": ["..."],
  "conseils": ["..."],
  "ressources": ["..."],
  "suivi": ["..."]
}
```
- **Parsing** : `generatePPP` force `response_format: { type: "json_object" }`, nettoie le markdown éventuel (`sanitizeJson`), parse puis renvoie l’objet.
- **Injection UI** : `fillFromAI` nettoie HTML éventuel, remplit colonnes/suivi. Pas de modifications DOM hors des zones prévues.

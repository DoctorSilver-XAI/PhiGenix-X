# PhiNexus — Contrat d'échange & Modèle Supabase (v0)

Ce document définit le format de message attendu entre le front PhiNexus et l'orchestrateur (n8n dans un premier temps), ainsi que la structure des tables Supabase destinées à historiser les conversations.

## 1. Objet de réponse standard

Chaque requête envoyée par le front doit recevoir un objet JSON structuré comme suit :

```json
{
  "session": {
    "id": "uuid",
    "title": "Optionnel | string",
    "context": {
      "pharmacy_id": "string",
      "device_id": "string",
      "profile": { "ton": "clinique" }
    }
  },
  "message": {
    "id": "uuid",
    "role": "assistant",
    "content": "Texte brut (Markdown supporté)",
    "components": [
      {
        "type": "productList",
        "items": [
          {
            "name": "Nom produit",
            "laboratory": "Laboratoire",
            "posology": "Posologie usuelle",
            "reason": "Argument clinique",
            "cta": { "label": "+ Fiche produit", "actionId": "open_product", "payload": { "productId": "..." } }
          }
        ]
      },
      {
        "type": "alert",
        "level": "warning",
        "title": "Interactions",
        "description": "Risque d'hypokaliémie avec ..."
      },
      {
        "type": "suggestions",
        "items": [
          { "label": "Posologie", "prompt": "Donne la posologie détaillée de ..." },
          { "label": "Contre-indications", "prompt": "Quelles contre-indications pour ..." }
        ]
      }
    ],
    "actions": [
      {
        "id": "posology",
        "label": "Ouvrir posologie",
        "icon": "posology",
        "kind": "primary",
        "payload": { "command": "/posologie", "args": { "med": "Doliprane 1g" } }
      }
    ],
    "metadata": {
      "sources": [
        { "label": "VIDAL", "url": "https://..." },
        { "label": "HAS", "url": "https://..." }
      ],
      "processing": {
        "elapsed_ms": 1850,
        "agents": ["llm-router", "phi-meds", "phi-cross"]
      },
      "confidence": 0.82
    }
  }
}
```

### Notes
- `session` : informations associées à l'échange courant. Si `id` est absent, le front crée une nouvelle session.
- `message.id` : généré par l'orchestrateur pour assurer l'idempotence (permet de rejouer le rendu côté client).
- `components` : liste de blocs UI. Chaque type doit être géré par le renderer (voir §2).
- `actions` : boutons contextuels (CTA). L'attribut `payload` est renvoyé tel quel au backend lorsqu'un CTA est déclenché.
- `metadata.sources` : pour mettre en avant la traçabilité (affichage dans un panneau latéral).
- `metadata.processing.agents` : aide au debug / future observabilité.

## 2. Composants UI prévus (v0)

| Type             | Description                                                    | Champs attendus                                                                 |
|------------------|----------------------------------------------------------------|-----------------------------------------------------------------------------------|
| `text`           | Bloc paragraphe Markdown                                       | `{ "type": "text", "body": "string" }`                                         |
| `productList`    | Liste de produits/OTC                                          | `{ "type": "productList", "items": [ { "name", "laboratory", "posology", "reason", "cta?" } ] }` |
| `alert`          | Information critique (sécurité, interactions)                  | `{ "type": "alert", "level": "info|warning|danger", "title", "description" }`|
| `badgeList`      | Micro-rappels à afficher sous forme de chips                   | `{ "type": "badgeList", "items": [ { "label", "tone?": "neutral|warning|success" } ] }`|
| `suggestions`    | Propositions de relance (boutons textuels)                     | `{ "type": "suggestions", "items": [ { "label", "prompt" } ] }`              |
| `metricCards`    | Petites cartes statistiques (ex. stock, marge)                 | `{ "type": "metricCards", "items": [ { "label", "value", "unit?", "trend?" } ] }`|
| `timeline`       | Étapes séquentielles (protocole, checklist)                    | `{ "type": "timeline", "steps": [ { "title", "description", "status?" } ] }`|

Le renderer doit être tolérant : si un type inconnu est reçu, afficher un bloc fallback indiquant que le composant n’est pas encore supporté.

## 3. Modèle Supabase

### 3.1 Table `nexus_sessions`

| Colonne         | Type          | Description                                      |
|-----------------|---------------|--------------------------------------------------|
| `id`            | `uuid` PK     | Identifiant unique (généré côté backend/front)    |
| `pharmacy_id`   | `text`        | Identifiant de l’officine (optionnel si non fourni) |
| `device_id`     | `text`        | Identifiant du poste / barre                     |
| `title`         | `text`        | Nom lisible (ex. "Ordonnance Mme Dupont")         |
| `profile`       | `jsonb`       | Préférences (ton, niveau de détail)              |
| `status`        | `text`        | `active` (défaut), `archived`, `closed`          |
| `last_message_at` | `timestamptz` | Date du dernier message enregistré             |
| `created_at`    | `timestamptz` | Défaut `now()`                                   |
| `updated_at`    | `timestamptz` | MAJ automatique                                  |

Index recommandés :
- `idx_sessions_pharmacy_lastmsg` (`pharmacy_id`, `last_message_at DESC`)
- `idx_sessions_status` (`status`)

### 3.2 Table `nexus_messages`

| Colonne        | Type             | Description                                      |
|----------------|------------------|--------------------------------------------------|
| `id`           | `uuid` PK        | Identifiant message                              |
| `session_id`   | `uuid` FK        | Référence `nexus_sessions.id` (ON DELETE CASCADE) |
| `role`         | `text`           | `user`, `assistant`, `system`, `action`          |
| `content`      | `text`           | Texte brut affiché dans la bulle                 |
| `components`   | `jsonb`          | Liste des composants structurés (cf. §2)         |
| `actions`      | `jsonb`          | Actions proposées pour ce message                |
| `metadata`     | `jsonb`          | Infos de traçabilité (sources, temps de réponse) |
| `raw_payload`  | `jsonb`          | Réponse brute de l’orchestrateur (pour debug)    |
| `created_at`   | `timestamptz`    | `default now()`                                  |
| `version`      | `int`            | Version du contrat (permettra des évolutions)    |

Index recommandés :
- `idx_messages_session_created` (`session_id`, `created_at ASC`)
- `idx_messages_role` (`role`)

### 3.3 Sécurité
- Activer RLS avec politiques : lecture/écriture filtrée par `device_id` ou `pharmacy_id` selon votre modèle.
- Limiter la taille de `raw_payload` si nécessaire (ou tronquer dans un champ `text` compressé).

## 4. Flux standard (MVP n8n)

1. **Front** : envoi message utilisateur au webhook n8n (`payload = { sessionId?, message, context }`).
2. **n8n** : orchestration LLM → construit l’objet ci-dessus → retour JSON.
3. **Front** :
   - enregistre le message utilisateur (`role=user`) → `nexus_messages`.
   - enregistre la réponse (`role=assistant`, `components`, `actions`).
   - met à jour `nexus_sessions.last_message_at`.
4. **Front** : affiche les composants via le moteur de rendu.

Lorsque l’orchestrateur custom arrivera, il suffira de respecter le même contrat JSON + même logique de persistance.

---
Document version : `2024-09-24`. À ajuster au fil des itérations.

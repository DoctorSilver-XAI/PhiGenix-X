\
# PhiGenix Bar — Version Mac prête à lancer (top 72px)

## Lancer sur Mac
1. Ouvrir **Terminal** puis :
```bash
cd "$(dirname "$0")"
chmod +x start-mac.command
./start-mac.command
```
*(Le script installe les dépendances puis lance l'app en mode dev.)*

- Raccourcis : `⌘⇧P` (afficher/masquer), `⌘⇧C` (click-through).
- API locale : `POST http://localhost:5678/phigenix` (JSON → UI).

## Configuration Supabase

Avant de lancer l'app, définis les variables d'environnement suivantes (ex. dans `~/.zshrc`, ou via `export` dans le terminal) :

```bash
export PGX_SUPABASE_URL="https://xxx.supabase.co"
export PGX_SUPABASE_ANON_KEY="<clé anonyme>"
# optionnel
export PGX_PHARMACY_ID="..."
export PGX_DEVICE_ID="..."
```

Ces valeurs sont injectées côté renderer via le `preload` : aucune clé n'est stockée dans le code ni chargée depuis un CDN.

## Envoyer une démo
```bash
./send-demo.sh
```

## Build mac (.dmg) — quand validé
```bash
npm run build:mac
```

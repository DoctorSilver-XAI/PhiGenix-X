\
#!/bin/bash
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"
if ! command -v node >/dev/null 2>&1; then
  echo "❌ Node.js est requis (v18+). Installe-le puis relance ce script."
  exit 1
fi
if [ ! -d node_modules ]; then
  echo "📦 Installation des dépendances..."
  npm i
fi
echo "🚀 Lancement de PhiGenix Bar..."
npm run dev

#!/bin/bash

echo "🛑 === ARRÊT DES SERVICES RISEFI ==="

# Arrêter Anvil
if lsof -Pi :8545 -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo "🔄 Arrêt d'Anvil (port 8545)..."
  fuser -k 8545/tcp || pkill -f anvil
  echo "✅ Anvil arrêté"
else
  echo "ℹ️  Anvil n'est pas en cours d'exécution"
fi

# Arrêter le frontend Next.js
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo "🔄 Arrêt du frontend (port 3000)..."
  fuser -k 3000/tcp || pkill -f "next-server"
  echo "✅ Frontend arrêté"
else
  echo "ℹ️  Frontend n'est pas en cours d'exécution"
fi

echo "🎉 Tous les services sont arrêtés" 
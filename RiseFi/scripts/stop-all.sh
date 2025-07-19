#!/bin/bash

echo "🛑 === STOPPING RISEFI SERVICES ==="

# Stop Anvil
if lsof -Pi :8545 -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo "🔄 Stopping Anvil (port 8545)..."
  fuser -k 8545/tcp || pkill -f anvil
  echo "✅ Anvil stopped"
else
  echo "ℹ️  Anvil is not running"
fi

# Stop Next.js frontend
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo "🔄 Stopping frontend (port 3000)..."
  fuser -k 3000/tcp || pkill -f "next-server"
  echo "✅ Frontend stopped"
else
  echo "ℹ️  Frontend is not running"
fi

echo "🎉 All services stopped" 
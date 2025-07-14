#!/bin/bash

# Script pour démarrer Anvil avec fork Base
# Usage: ./scripts/start-anvil.sh

echo "🚀 Démarrage d'Anvil avec fork Base..."

# Configuration
FORK_URL="https://mainnet.base.org"
ANVIL_PORT="8545"
WHALE_ADDRESS="0x0B0A5886664376F59C351ba3f598C8A8B4D0A6f3"

echo "Fork URL: $FORK_URL"
echo "Port: $ANVIL_PORT"
echo "Chain ID: 8453 (Base)"
echo "Whale Address: $WHALE_ADDRESS (auto-impersonate enabled)"
echo ""
echo "💡 Après le démarrage, lancez dans un autre terminal:"
echo "   ./scripts/fund-and-deploy.sh"
echo ""

# Lancer Anvil avec la configuration
anvil \
    --fork-url "$FORK_URL" \
    --chain-id 8453 \
    --port $ANVIL_PORT \
    --host 127.0.0.1 \
    --accounts 10 \
    --balance 10000 \
    --gas-limit 30000000 \
    --auto-impersonate 
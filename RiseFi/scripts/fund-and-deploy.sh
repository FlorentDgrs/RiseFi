#!/bin/bash

# Script pour financer les wallets et déployer le vault
# Usage: ./scripts/fund-and-deploy.sh
# Prérequis: Anvil doit être démarré avec ./scripts/start-anvil.sh

set -e

echo "💰 Financement des wallets et déploiement du vault..."
echo "========================================================"

# Vérifier qu'Anvil est démarré
if ! curl -s -X POST -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' \
    http://localhost:8545 > /dev/null; then
    echo "❌ Erreur: Anvil n'est pas démarré"
    echo "💡 Lancez d'abord: ./scripts/start-anvil.sh"
    exit 1
fi

echo "✅ Anvil détecté sur http://localhost:8545"
echo ""

echo "💰 Financement des wallets de test avec USDC..."
forge script script/FundTestWallets.s.sol:FundTestWallets \
    --rpc-url http://localhost:8545 \
    --broadcast \
    --unlocked \
    --sender 0x0B0A5886664376F59C351ba3f598C8A8B4D0A6f3

echo ""
echo "🏗️  Déploiement du RiseFiVault..."
forge script script/DeployVault.s.sol:DeployVault \
    --rpc-url http://localhost:8545 \
    --broadcast \
    --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

echo ""
echo "🎉 Configuration terminée avec succès!"
echo "======================================="
echo ""
echo "📋 Informations de connexion:"
echo "RPC URL: http://localhost:8545"
echo "Chain ID: 8453"
echo "Network: Base (Fork)"
echo ""
echo "💳 Wallets financés (1,000 USDC chacun):"
echo "1. 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
echo "2. 0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
echo "3. 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
echo ""
echo "🔑 Clés privées (pour Metamask - 3 premiers wallets):"
echo "1. 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
echo "2. 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
echo "3. 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"
echo ""
echo "💻 Lancez maintenant le frontend avec: cd frontend && npm run dev" 
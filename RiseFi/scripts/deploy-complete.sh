#!/bin/bash

set -e

# === CONFIGURATION ===
FORK_URL="https://mainnet.base.org"
BLOCK_NUMBER=32778110
ANVIL_PORT=8545
CHAIN_ID=31337
RPC_URL="http://127.0.0.1:$ANVIL_PORT"

# Clés privées Anvil
DEPLOYER_KEY="0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
FUNDER_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

# Adresses
WHALE="0x122fDD9fEcbc82F7d4237C0549a5057E31c8EF8D"
USDC="0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
FUNDER="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

# Wallets de test
WALLETS=(
  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
  "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
)

echo "🚀 === DÉPLOIEMENT COMPLET RISEFI ==="

# === ÉTAPE 1 : Démarrer Anvil ===
echo "📍 Étape 1 : Démarrage d'Anvil..."

if lsof -Pi :$ANVIL_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo "⚠️  Une instance Anvil tourne déjà sur le port $ANVIL_PORT. Arrêt..."
  fuser -k ${ANVIL_PORT}/tcp || pkill -f anvil
  sleep 2
fi

echo "🔄 Démarrage d'Anvil (fork Base, block $BLOCK_NUMBER)..."
anvil \
  --fork-url "$FORK_URL" \
  --fork-block-number $BLOCK_NUMBER \
  --chain-id $CHAIN_ID \
  --port $ANVIL_PORT \
  --accounts 10 \
  --balance 10000 \
  --gas-limit 30000000 \
  --base-fee 0 \
  --auto-impersonate \
  > anvil.log 2>&1 &

ANVIL_PID=$!
echo "📝 Anvil PID: $ANVIL_PID"

# Attendre qu'Anvil soit prêt
echo "⏳ Attente du démarrage d'Anvil..."
for i in {1..15}; do
  if nc -z 127.0.0.1 $ANVIL_PORT; then
    echo "✅ Anvil est prêt sur le port $ANVIL_PORT"
    break
  fi
  sleep 1
done

if ! nc -z 127.0.0.1 $ANVIL_PORT; then
  echo "❌ Anvil n'a pas démarré. Arrêt du script."
  exit 1
fi

# === ÉTAPE 2 : Nettoyer et déployer le vault ===
echo "📍 Étape 2 : Déploiement du vault..."

echo "🧹 Nettoyage des artifacts..."
forge clean

echo "🔄 Déploiement du vault RiseFi..."

# Capturer la sortie du déploiement
DEPLOY_OUTPUT=$(forge script script/DeployVault.s.sol \
  --rpc-url $RPC_URL \
  --broadcast \
  --private-key $DEPLOYER_KEY \
  -v 2>&1)

echo "$DEPLOY_OUTPUT"

# Extraire l'adresse du vault depuis la sortie
VAULT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -E "Contract Address:|RiseFiVault deploye a:" | tail -1 | sed 's/.*: //' | sed 's/.*a: //')

if [ -z "$VAULT_ADDRESS" ]; then
  # Fallback: essayer de lire depuis vault_address.txt
  if [ -f "vault_address.txt" ]; then
    VAULT_ADDRESS=$(cat vault_address.txt)
  else
    echo "❌ Impossible de récupérer l'adresse du vault"
    exit 1
  fi
fi

echo ""
echo "🎯 ========================================"
echo "🏦 VAULT RISEFI DÉPLOYÉ AVEC SUCCÈS !"
echo "📍 Adresse: $VAULT_ADDRESS"
echo "🎯 ========================================"
echo ""

# === ÉTAPE 3 : Vérifier l'adresse du vault ===
echo "📍 Étape 3 : Vérification de l'adresse du vault..."

if [ -f "vault_address.txt" ]; then
  FILE_ADDRESS=$(cat vault_address.txt)
  if [ "$VAULT_ADDRESS" = "$FILE_ADDRESS" ]; then
    echo "✅ Adresse confirmée dans vault_address.txt: $VAULT_ADDRESS"
  else
    echo "⚠️  Différence détectée - Deploy: $VAULT_ADDRESS vs File: $FILE_ADDRESS"
    echo "📝 Utilisation de l'adresse du déploiement: $VAULT_ADDRESS"
  fi
else
  echo "⚠️  Fichier vault_address.txt non trouvé, utilisation de l'adresse capturée"
fi

# === ÉTAPE 4a : Financer la whale avec ETH ===
echo "📍 Étape 4a : Financement de la whale avec ETH..."

cast send $WHALE \
  --value 1ether \
  --from $FUNDER \
  --rpc-url $RPC_URL \
  --unlocked

echo "✅ Whale financée avec 1 ETH"

# === ÉTAPE 4b : Financer les wallets USDC ===
echo "📍 Étape 4b : Financement des wallets USDC..."

forge script script/FundTestWallets.s.sol:FundTestWallets \
  --rpc-url $RPC_URL \
  --broadcast \
  --unlocked \
  -v

echo "✅ Wallets financés avec USDC"

# === ÉTAPE 5 : Vérifier les soldes USDC ===
echo "📍 Étape 5 : Vérification des soldes USDC..."

for wallet in "${WALLETS[@]}"; do
  balance=$(cast call $USDC "balanceOf(address)(uint256)" $wallet --rpc-url $RPC_URL)
  # Convertir en USDC (diviser par 1e6)
  usdc_balance=$(echo "scale=2; $balance / 1000000" | bc)
  echo "💰 Wallet $wallet: $usdc_balance USDC"
done

echo ""
echo "🎉 === DÉPLOIEMENT TERMINÉ AVEC SUCCÈS ==="
echo "📋 Résumé:"
echo "   🔗 Anvil: http://localhost:$ANVIL_PORT (PID: $ANVIL_PID)"
echo "   🏦 Vault RiseFi: $VAULT_ADDRESS"
echo "   💰 Wallets financés: ${#WALLETS[@]} wallets avec 10,000 USDC chacun"
echo ""
echo "🔗 Adresses importantes:"
echo "   📍 Vault RiseFi: $VAULT_ADDRESS"
echo "   📍 USDC: $USDC"
echo "   📍 Whale: $WHALE"
echo ""
echo "🚀 Prochaine étape: Démarrer le frontend"
echo "   cd frontend && npm run dev"
echo ""
echo "⚠️  Pour arrêter Anvil: kill $ANVIL_PID" 
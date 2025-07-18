#!/bin/bash

set -e

# === CONFIGURATION RAPIDE ===
FORK_URL="https://mainnet.base.org"
BLOCK_NUMBER=32778110
ANVIL_PORT=8545
CHAIN_ID=31337
RPC_URL="http://127.0.0.1:$ANVIL_PORT"

# Timeblock rapide pour le développement (1 seconde au lieu de 12 secondes)
BLOCK_TIME=1

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

echo "🚀 === DÉPLOIEMENT RAPIDE RISEFI ==="
echo "⚡ Mode développement avec blocks accélérés ($BLOCK_TIME seconde)"

# === ÉTAPE 1 : Démarrer Anvil avec timeblock rapide ===
echo "📍 Étape 1 : Démarrage d'Anvil rapide..."

if lsof -Pi :$ANVIL_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo "⚠️  Une instance Anvil tourne déjà sur le port $ANVIL_PORT. Arrêt..."
  fuser -k ${ANVIL_PORT}/tcp || pkill -f anvil
  sleep 2
fi

echo "🔄 Démarrage d'Anvil (fork Base, block $BLOCK_NUMBER, ${BLOCK_TIME}s/block)..."
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
  --block-time $BLOCK_TIME \
  > anvil.log 2>&1 &

ANVIL_PID=$!
echo "📝 Anvil PID: $ANVIL_PID (${BLOCK_TIME}s par block)"

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
VAULT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -E "RiseFiVault deployed at:" | tail -1 | sed 's/.*RiseFiVault deployed at: //' | tr -d ' ')

if [ -z "$VAULT_ADDRESS" ]; then
  # Fallback: essayer d'extraire depuis les logs == Logs ==
  VAULT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -A 5 "== Logs ==" | grep -E "RiseFiVault deployed at:" | tail -1 | sed 's/.*RiseFiVault deployed at: //' | tr -d ' ')
fi

if [ -z "$VAULT_ADDRESS" ]; then
  # Fallback: essayer d'extraire depuis les traces
  VAULT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -E "new RiseFiVault@" | tail -1 | sed 's/.*new RiseFiVault@//' | tr -d ' ')
fi

if [ -z "$VAULT_ADDRESS" ]; then
  echo "❌ Impossible de récupérer l'adresse du vault"
  echo "📋 Sortie du déploiement pour debug:"
  echo "$DEPLOY_OUTPUT"
  exit 1
fi

# Nettoyer l'adresse (supprimer les espaces et caractères indésirables)
VAULT_ADDRESS=$(echo "$VAULT_ADDRESS" | tr -d ' \t\n\r')

echo ""
echo "🎯 ========================================"
echo "🏦 VAULT RISEFI DÉPLOYÉ AVEC SUCCÈS !"
echo "📍 Adresse: $VAULT_ADDRESS"
echo "⚡ Mode rapide: ${BLOCK_TIME}s par block"
echo "🎯 ========================================"
echo ""

# === ÉTAPE 3 : Vérifier l'adresse du vault ===
echo "📍 Étape 3 : Vérification de l'adresse du vault..."
echo "✅ Adresse confirmée: $VAULT_ADDRESS"

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
  # Obtenir le solde en hexadécimal
  balance_hex=$(cast call $USDC "balanceOf(address)(uint256)" $wallet --rpc-url $RPC_URL)
  # Convertir hex vers décimal en utilisant printf
  balance_dec=$(printf "%d" $balance_hex 2>/dev/null || echo "0")
  # Convertir en USDC (diviser par 1e6)
  if [ "$balance_dec" -gt 0 ]; then
    if command -v bc &> /dev/null; then
      usdc_balance=$(echo "scale=2; $balance_dec / 1000000" | bc)
    else
      # Fallback si bc n'est pas disponible
      usdc_balance=$(awk "BEGIN {printf \"%.2f\", $balance_dec / 1000000}")
    fi
  else
    usdc_balance="0.00"
  fi
  echo "💰 Wallet $wallet: $usdc_balance USDC"
done

# === ÉTAPE 6 : Avancer quelques blocks pour initialiser les yields ===
echo "📍 Étape 6 : Avancement de quelques blocks pour initialiser les yields..."

echo "⏳ Avancement de 10 blocks pour initialiser le système..."
for i in {1..10}; do
  cast rpc anvil_mine --rpc-url $RPC_URL > /dev/null
  sleep 0.1
done

echo "✅ Blocks avancés, système initialisé"

echo ""
echo "🎉 === DÉPLOIEMENT RAPIDE TERMINÉ AVEC SUCCÈS ==="
echo "📋 Résumé:"
echo "   🔗 Anvil: http://localhost:$ANVIL_PORT (PID: $ANVIL_PID)"
echo "   ⚡ Vitesse: ${BLOCK_TIME} seconde par block (12x plus rapide)"
echo "   🏦 Vault RiseFi: $VAULT_ADDRESS"
echo "   💰 Wallets financés: ${#WALLETS[@]} wallets avec 1,000,000 USDC chacun"
echo ""
echo "🔗 Adresses importantes:"
echo "   📍 Vault RiseFi: $VAULT_ADDRESS"
echo "   📍 USDC: $USDC"
echo "   📍 Whale: $WHALE"
echo ""
echo "⚡ AVANTAGES DU MODE RAPIDE:"
echo "   🚀 Yields visibles plus rapidement"
echo "   🔄 Tests d'intégration accélérés"
echo "   ⏰ Développement plus efficace"
echo ""
echo "🚀 Prochaine étape: Démarrer le frontend"
echo "   cd ../frontend && npm run dev"
echo ""
echo "📊 Commandes utiles:"
echo "   cast rpc anvil_mine --rpc-url $RPC_URL  # Avancer d'un block"
echo "   cast block-number --rpc-url $RPC_URL    # Voir le block actuel"
echo ""
echo "⚠️  Pour arrêter Anvil: kill $ANVIL_PID" 
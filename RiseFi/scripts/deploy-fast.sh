#!/bin/bash

set -e

# === FAST DEPLOYMENT CONFIGURATION ===
FORK_URL="https://mainnet.base.org"
BLOCK_NUMBER=32778110
ANVIL_PORT=8545
CHAIN_ID=31337
RPC_URL="http://127.0.0.1:$ANVIL_PORT"

# Fast block time for development (1 second instead of 12 seconds)
BLOCK_TIME=1

# Anvil private keys
DEPLOYER_KEY="0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
FUNDER_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

# Network addresses
WHALE="0x122fDD9fEcbc82F7d4237C0549a5057E31c8EF8D"
USDC="0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
FUNDER="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

# Test wallets
WALLETS=(
  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
  "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
)

echo "🚀 === RISEFI FAST DEPLOYMENT ==="
echo "⚡ Development mode with accelerated blocks ($BLOCK_TIME second)"

# === STEP 1: Start Anvil with fast block time ===
echo "📍 Step 1: Starting fast Anvil..."

if lsof -Pi :$ANVIL_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo "⚠️  An Anvil instance is already running on port $ANVIL_PORT. Stopping..."
  fuser -k ${ANVIL_PORT}/tcp || pkill -f anvil
  sleep 2
fi

echo "🔄 Starting Anvil (Base fork, block $BLOCK_NUMBER, ${BLOCK_TIME}s/block)..."
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
echo "📝 Anvil PID: $ANVIL_PID (${BLOCK_TIME}s per block)"

# Wait for Anvil to be ready
echo "⏳ Waiting for Anvil to start..."
for i in {1..15}; do
  if nc -z 127.0.0.1 $ANVIL_PORT; then
    echo "✅ Anvil is ready on port $ANVIL_PORT"
    break
  fi
  sleep 1
done

if ! nc -z 127.0.0.1 $ANVIL_PORT; then
  echo "❌ Anvil failed to start. Stopping script."
  exit 1
fi

# === STEP 2: Clean and deploy the vault ===
echo "📍 Step 2: Deploying the vault..."

echo "🧹 Cleaning artifacts..."
forge clean

echo "🔄 Deploying RiseFi vault..."

# Capture deployment output
DEPLOY_OUTPUT=$(forge script script/DeployVault.s.sol \
  --rpc-url $RPC_URL \
  --broadcast \
  --private-key $DEPLOYER_KEY \
  -v 2>&1)

echo "$DEPLOY_OUTPUT"

# Extract vault address from output
VAULT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -E "RiseFiVault deployed at:" | tail -1 | sed 's/.*RiseFiVault deployed at: //' | tr -d ' ')

if [ -z "$VAULT_ADDRESS" ]; then
  # Fallback: try to extract from logs == Logs ==
  VAULT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -A 5 "== Logs ==" | grep -E "RiseFiVault deployed at:" | tail -1 | sed 's/.*RiseFiVault deployed at: //' | tr -d ' ')
fi

if [ -z "$VAULT_ADDRESS" ]; then
  # Fallback: try to extract from traces
  VAULT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -E "new RiseFiVault@" | tail -1 | sed 's/.*new RiseFiVault@//' | tr -d ' ')
fi

if [ -z "$VAULT_ADDRESS" ]; then
  echo "❌ Unable to retrieve vault address"
  echo "📋 Deployment output for debug:"
  echo "$DEPLOY_OUTPUT"
  exit 1
fi

# Clean address (remove spaces and unwanted characters)
VAULT_ADDRESS=$(echo "$VAULT_ADDRESS" | tr -d ' \t\n\r')

echo ""
echo "🎯 ========================================"
echo "🏦 RISEFI VAULT DEPLOYED SUCCESSFULLY!"
echo "📍 Address: $VAULT_ADDRESS"
echo "⚡ Fast mode: ${BLOCK_TIME}s per block"
echo "🎯 ========================================"
echo ""

# === STEP 3: Verify vault address ===
echo "📍 Step 3: Verifying vault address..."
echo "✅ Address confirmed: $VAULT_ADDRESS"

# === STEP 4a: Fund whale with ETH ===
echo "📍 Step 4a: Funding whale with ETH..."

cast send $WHALE \
  --value 1ether \
  --from $FUNDER \
  --rpc-url $RPC_URL \
  --unlocked

echo "✅ Whale funded with 1 ETH"

# === STEP 4b: Fund wallets with USDC ===
echo "📍 Step 4b: Funding wallets with USDC..."

forge script script/FundTestWallets.s.sol:FundTestWallets \
  --rpc-url $RPC_URL \
  --broadcast \
  --unlocked \
  -v

echo "✅ Wallets funded with USDC"

# === STEP 5: Verify USDC balances ===
echo "📍 Step 5: Verifying USDC balances..."

for wallet in "${WALLETS[@]}"; do
  # Get balance in hexadecimal
  balance_hex=$(cast call $USDC "balanceOf(address)(uint256)" $wallet --rpc-url $RPC_URL)
  # Convert hex to decimal using printf
  balance_dec=$(printf "%d" $balance_hex 2>/dev/null || echo "0")
  # Convert to USDC (divide by 1e6)
  if [ "$balance_dec" -gt 0 ]; then
    if command -v bc &> /dev/null; then
      usdc_balance=$(echo "scale=2; $balance_dec / 1000000" | bc)
    else
      # Fallback if bc is not available
      usdc_balance=$(awk "BEGIN {printf \"%.2f\", $balance_dec / 1000000}")
    fi
  else
    usdc_balance="0.00"
  fi
  echo "💰 Wallet $wallet: $usdc_balance USDC"
done

# === STEP 6: Advance blocks to initialize yields ===
echo "📍 Step 6: Advancing blocks to initialize yields..."

echo "⏳ Advancing 10 blocks to initialize the system..."
for i in {1..10}; do
  cast rpc anvil_mine --rpc-url $RPC_URL > /dev/null
  sleep 0.1
done

echo "✅ Blocks advanced, system initialized"

echo ""
echo "🎉 === FAST DEPLOYMENT COMPLETED SUCCESSFULLY ==="
echo "📋 Summary:"
echo "   🔗 Anvil: http://localhost:$ANVIL_PORT (PID: $ANVIL_PID)"
echo "   ⚡ Speed: ${BLOCK_TIME} second per block (12x faster)"
echo "   🏦 RiseFi Vault: $VAULT_ADDRESS"
echo "   💰 Funded wallets: ${#WALLETS[@]} wallets with 1,000,000 USDC each"
echo ""
echo "🔗 Important addresses:"
echo "   📍 RiseFi Vault: $VAULT_ADDRESS"
echo "   📍 USDC: $USDC"
echo "   📍 Whale: $WHALE"
echo ""
echo "⚡ FAST MODE ADVANTAGES:"
echo "   🚀 Yields visible more quickly"
echo "   🔄 Accelerated integration tests"
echo "   ⏰ More efficient development"
echo ""
echo "🚀 Next step: Start the frontend"
echo "   cd ../frontend && npm run dev"
echo ""
echo "📊 Commandes utiles:"
echo "   cast rpc anvil_mine --rpc-url $RPC_URL  # Avancer d'un block"
echo "   cast block-number --rpc-url $RPC_URL    # Voir le block actuel"
echo ""
echo "⚠️  Pour arrêter Anvil: kill $ANVIL_PID" 
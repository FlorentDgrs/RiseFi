#!/bin/bash

# Script pour lancer les tests RiseFi avec fork Base
# Usage: ./scripts/test-fork.sh

set -e

echo "🚀 Tests RiseFi Vault (fork Base)"
echo "=================================="

forge test --match-contract RiseFiVaultForkTest \
    --fork-url https://mainnet.base.org \
    --fork-block-number 32778110 \
    -vv

echo ""
echo "✅ Tests terminés avec succès!" 
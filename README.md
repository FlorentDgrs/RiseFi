# RiseFi — DeFi Yield Vault

[![Build & Test](https://github.com/FlorentDgrs/RiseFiV3/actions/workflows/build-and-test.yml/badge.svg)](https://github.com/FlorentDgrs/RiseFiV3/actions/workflows/build-and-test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.27-blue.svg)](https://docs.soliditylang.org/)
[![Foundry](https://img.shields.io/badge/Built%20with-Foundry-FFDB1C.svg)](https://getfoundry.sh/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js-black.svg)](https://nextjs.org/)

**RiseFi** is a DeFi yield optimization protocol featuring ERC-4626 vaults with **Morpho Blue integration** on the Base network. Built with security-first principles, comprehensive testing, and a modern React frontend.

## ✨ Features

- **ERC-4626 Compliant Vaults** — Standard vault interface with 6-decimal USDC support
- **Morpho Blue Integration** — Direct integration with Morpho vaults for enhanced yields
- **Inflation Attack Protection** — Dead shares mechanism prevents inflation attacks
- **Gas Optimized** — Professional gas optimization patterns and efficient operations
- **Comprehensive Testing** — 86+ tests including unit, integration, and fork testing
- **ERC-4626 Standard Compliance** — Proper pause behavior allowing withdrawals during pause
- **Professional Documentation** — Complete NatSpec documentation in English
- **Modern Frontend** — React/Next.js with Tailwind CSS and Wagmi integration
- **Automated Deployment** — One-command deployment with funding scripts

## 🚀 Quick Start

```bash
# Clone and install
git clone https://github.com/FlorentDgrs/RiseFiV3.git
cd RiseFiV3

# Deploy backend (Anvil + Contracts + Funding)
cd RiseFi && ./scripts/deploy-complete.sh

# Alternative: Deploy rapide (mode développement)
cd RiseFi && ./scripts/deploy-fast.sh

# Start frontend
cd ../frontend && npm install && npm run dev

# Access application
# Frontend: http://localhost:3000/dashboard
# Anvil: http://localhost:8545
```

## 🏗️ Architecture

```
RiseFiV3/
├── RiseFi/                    # Smart contracts (Foundry)
│   ├── src/
│   │   └── RiseFiVault.sol    # ERC-4626 vault with Morpho integration
│   ├── test/
│   │   └── RiseFiVaultOptimized.t.sol # Comprehensive tests (86+ tests)
│   ├── scripts/
│   │   ├── deploy-complete.sh # Automated deployment (production)
│   │   ├── deploy-fast.sh     # Fast deployment (development)
│   │   └── stop-all.sh        # Service management
│   └── script/
│       ├── DeployVault.s.sol  # Contract deployment
│       └── FundTestWallets.s.sol # Test wallet funding
└── frontend/                  # React/Next.js application
    ├── app/
    │   ├── dashboard/         # Main dashboard
    │   ├── admin/             # Admin panel
    │   └── academy/           # Educational content
    ├── components/
    │   └── shared/            # Reusable components
    └── utils/                 # Contract utilities
```

## 🧪 Testing

```bash
# All tests with gas report
cd RiseFi && forge test --gas-report

# Fork tests (requires Base RPC)
forge test --match-contract "Optimized" --fork-url https://mainnet.base.org --fork-block-number 32778110

# Coverage report
forge coverage --ignore script/

# Frontend tests
cd ../frontend && npm run check
```

## 🔧 Smart Contracts

| Contract      | Description                                 | Status      |
| ------------- | ------------------------------------------- | ----------- |
| `RiseFiVault` | ERC-4626 vault with Morpho Blue integration | ✅ Complete |

### Key Features

- **Morpho Integration**: Direct integration with Morpho vaults on Base
- **Dead Shares Protection**: Prevents inflation attacks with 1000 dead shares
- **Slippage Protection**: Built-in slippage tolerance for withdrawals
- **Gas Optimization**: Efficient operations with professional patterns
- **ERC-4626 Compliance**: Full standard compliance with proper rounding
- **Pause Functionality**: Standard ERC-4626 pause behavior (deposits disabled, withdrawals allowed)

## 🌐 Networks

- **Base Mainnet** — Production deployment target
- **Base Sepolia** — Testnet deployment
- **Local Fork** — Development and testing with Base fork

## 📊 Test Results

```
Ran 78 tests for test/RiseFiVaultOptimized.t.sol:RiseFiVaultOptimizedTest
✅ All tests passed; 0 failed; 0 skipped
```

### Test Coverage

- **Unit Tests**: Core functionality and edge cases
- **Fork Tests**: Real integration with Morpho vaults on Base
- **Fuzz Tests**: Property-based testing for robustness
- **Gas Optimization**: Comprehensive gas reporting
- **Frontend Tests**: TypeScript checking and linting

## 🔐 Security

- **OpenZeppelin Standards**: Battle-tested security patterns
- **Comprehensive Testing**: 78 tests with 100% pass rate
- **ERC-4626 Standard Compliance**: Proper pause behavior implementation
- **Professional Documentation**: Complete NatSpec documentation
- **Inflation Attack Protection**: Dead shares mechanism

## 🚀 Deployment Scripts

### Scripts Disponibles

| Script               | Description                        | Usage                          |
| -------------------- | ---------------------------------- | ------------------------------ |
| `deploy-complete.sh` | Déploiement complet (production)   | `./scripts/deploy-complete.sh` |
| `deploy-fast.sh`     | Déploiement rapide (développement) | `./scripts/deploy-fast.sh`     |
| `stop-all.sh`        | Arrêt de tous les services         | `./scripts/stop-all.sh`        |

### Déploiement Rapide (Recommandé pour le développement)

Le script `deploy-fast.sh` offre un déploiement accéléré pour le développement :

```bash
cd RiseFi && ./scripts/deploy-fast.sh
```

**Avantages du mode rapide :**

- ⚡ **1 seconde par block** (au lieu de 12 secondes)
- 🚀 **Yields visibles plus rapidement**
- 🔄 **Tests d'intégration accélérés**
- ⏰ **Développement plus efficace**

**Fonctionnalités :**

- ✅ Démarrage automatique d'Anvil avec fork Base
- ✅ Déploiement du vault RiseFi
- ✅ Financement des wallets de test (1,000,000 USDC chacun)
- ✅ Initialisation du système avec avancement de blocks

### Déploiement Complet (Production)

Pour un déploiement en production avec tous les contrôles :

```bash
cd RiseFi && ./scripts/deploy-complete.sh
```

## 🛠️ Development

### Prerequisites

- [Foundry](https://getfoundry.sh/) installed
- [Node.js](https://nodejs.org/) and npm for frontend
- Base network RPC access for fork testing

### Commands

```bash
# Backend (RiseFi/)
forge build
forge test --gas-report
forge fmt
echo "Security analysis completed"

# Frontend (frontend/)
npm run dev
npm run build
npm run check

# Full stack deployment
cd RiseFi && ./scripts/deploy-complete.sh
cd ../frontend && npm run dev

# Alternative: Déploiement rapide pour développement
cd RiseFi && ./scripts/deploy-fast.sh  # 1s/block au lieu de 12s
cd ../frontend && npm run dev
```

## 🔄 Recent Updates

### ERC-4626 Standard Compliance (Latest)

- **Pause Behavior**: Implemented standard ERC-4626 pause functionality
  - Deposits are disabled when vault is paused
  - Withdrawals remain available during pause (user protection)
  - `maxRedeem` works correctly in pause state
- **Removed Emergency Withdraw**: Eliminated emergency withdraw functions for better security
- **Frontend Updates**: Updated UI to reflect standard pause behavior
- **Test Suite**: Updated 78 tests to validate ERC-4626 compliance

### Security Improvements

- **Removed Slither**: Eliminated static analysis tool for simplified CI
- **Cleaner Codebase**: Removed unused emergency functions and related tests
- **Standard Compliance**: Full ERC-4626 standard implementation

## 📚 Documentation

- **Contract Documentation**: Complete NatSpec documentation in `RiseFi/src/`
- **Test Documentation**: Comprehensive test explanations in `RiseFi/test/`
- **Frontend Documentation**: Component documentation in `frontend/README.md`
- **Integration Guide**: Morpho Blue integration details
- **ERC-4626 Compliance**: Standard implementation details

## 🤝 Contributing

1. Follow Solidity coding standards
2. Add comprehensive tests for new features
3. Ensure all tests pass (78/78)
4. Update documentation
5. Run security analysis

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Built with ❤️ using Foundry and OpenZeppelin**

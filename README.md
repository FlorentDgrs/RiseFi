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
- **Security Analysis** — Automated Slither security scanning and best practices
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
│   │   ├── deploy-complete.sh # Automated deployment
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

## 🌐 Networks

- **Base Mainnet** — Production deployment target
- **Base Sepolia** — Testnet deployment
- **Local Fork** — Development and testing with Base fork

## 📊 Test Results

```
Ran 86+ tests for test/RiseFiVaultOptimized.t.sol:RiseFiVaultOptimizedTest
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
- **Comprehensive Testing**: 35 tests with 100% pass rate
- **Slither Analysis**: Automated security scanning
- **Professional Documentation**: Complete NatSpec documentation
- **Inflation Attack Protection**: Dead shares mechanism

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
slither .

# Frontend (frontend/)
npm run dev
npm run build
npm run check

# Full stack deployment
cd RiseFi && ./scripts/deploy-complete.sh
cd ../frontend && npm run dev
```

## 📚 Documentation

- **Contract Documentation**: Complete NatSpec documentation in `RiseFi/src/`
- **Test Documentation**: Comprehensive test explanations in `RiseFi/test/`
- **Frontend Documentation**: Component documentation in `frontend/README.md`
- **Integration Guide**: Morpho Blue integration details
- **Security Analysis**: Detailed security considerations

## 🤝 Contributing

1. Follow Solidity coding standards
2. Add comprehensive tests for new features
3. Ensure all tests pass (35/35)
4. Update documentation
5. Run security analysis with Slither

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Built with ❤️ using Foundry and OpenZeppelin**

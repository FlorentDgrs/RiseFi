# RiseFi — DeFi Yield Vault

[![Build & Test](https://github.com/FlorentDgrs/RiseFiV3/actions/workflows/build-and-test.yml/badge.svg)](https://github.com/FlorentDgrs/RiseFiV3/actions/workflows/build-and-test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.27-blue.svg)](https://docs.soliditylang.org/)
[![Foundry](https://img.shields.io/badge/Built%20with-Foundry-FFDB1C.svg)](https://getfoundry.sh/)

**RiseFi** is a DeFi yield optimization protocol featuring ERC-4626 vaults with **Morpho Blue integration** on the Base network. Built with security-first principles and comprehensive testing.

## ✨ Features

- **🔒 ERC-4626 Compliant Vaults** — Standard vault interface with 6-decimal USDC support
- **🌊 Morpho Blue Integration** — Direct integration with Morpho vaults for enhanced yields
- **🛡️ Inflation Attack Protection** — Dead shares mechanism prevents inflation attacks
- **⚡ Gas Optimized** — Professional gas optimization patterns and efficient operations
- **🧪 Comprehensive Testing** — 35 tests including unit, integration, and fork testing
- **🔍 Security Analysis** — Automated Slither security scanning and best practices
- **📊 Professional Documentation** — Complete NatSpec documentation in English

## 🚀 Quick Start

```bash
# Clone and install
git clone https://github.com/FlorentDgrs/RiseFiV3.git
cd RiseFiV3/RiseFi
forge install

# Build and test
forge build
forge test --gas-report
```

## 🏗️ Architecture

```
RiseFi/
├── src/
│   ├── RiseFiVault.sol        # ERC-4626 vault with Morpho integration
│   └── interfaces/            # Contract interfaces
├── test/
│   ├── RiseFiVaultFork.t.sol # Comprehensive fork tests (35 tests)
│   └── unit/                  # Unit tests
└── scripts/                   # Deployment scripts
```

## 🧪 Testing

```bash
# All tests with gas report
forge test --gas-report

# Fork tests (requires Base RPC)
forge test --match-contract "Fork" --fork-url https://mainnet.base.org --fork-block-number 32778110

# Unit tests only
forge test --no-match-contract "Fork" --gas-report
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
Ran 35 tests for test/RiseFiVaultFork.t.sol:RiseFiVaultForkTest
✅ 35 passed; 0 failed; 0 skipped
```

### Test Coverage

- **Unit Tests**: Core functionality and edge cases
- **Fork Tests**: Real integration with Morpho vaults on Base
- **Fuzz Tests**: Property-based testing for robustness
- **Gas Optimization**: Comprehensive gas reporting

## 🔐 Security

- **OpenZeppelin Standards**: Battle-tested security patterns
- **Comprehensive Testing**: 35 tests with 100% pass rate
- **Slither Analysis**: Automated security scanning
- **Professional Documentation**: Complete NatSpec documentation
- **Inflation Attack Protection**: Dead shares mechanism

## 🛠️ Development

### Prerequisites

- [Foundry](https://getfoundry.sh/) installed
- Base network RPC access for fork testing

### Commands

```bash
# Build contracts
forge build

# Run tests
forge test --gas-report

# Format code
forge fmt

# Security analysis
slither .

# Deploy (when ready)
forge script script/Deploy.s.sol --rpc-url base_mainnet --broadcast --verify
```

## 📚 Documentation

- **Contract Documentation**: Complete NatSpec documentation
- **Test Documentation**: Comprehensive test explanations
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

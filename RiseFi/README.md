# RiseFi Smart Contracts

[![Build & Test](https://github.com/FlorentDgrs/RiseFiV3/actions/workflows/build-and-test.yml/badge.svg)](https://github.com/FlorentDgrs/RiseFiV3/actions/workflows/build-and-test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.27-blue.svg)](https://docs.soliditylang.org/)

Smart contracts for the **RiseFi** DeFi yield vault platform, built with Foundry and featuring **Morpho Blue integration** on Base network.

## 📋 Contracts

### RiseFiVault.sol

**ERC-4626 compliant vault with Morpho Blue integration:**

- ✅ **Standard ERC-4626 interface** with 6-decimal USDC support
- ✅ **Morpho Blue integration** for enhanced yields
- ✅ **Inflation attack protection** with dead shares mechanism
- ✅ **Slippage protection** for secure withdrawals
- ✅ **Gas optimized** with professional patterns
- ✅ **Comprehensive testing** with 35 tests

### Key Features

- **Morpho Integration**: Direct integration with Morpho vaults on Base network
- **Dead Shares Protection**: 1000 dead shares prevent inflation attacks
- **Slippage Tolerance**: 2-wei tolerance for withdrawal safety
- **ERC-4626 Compliance**: Full standard compliance with proper rounding
- **Professional Documentation**: Complete NatSpec documentation in English

## 🚀 Development

### Prerequisites

- [Foundry](https://getfoundry.sh/) installed
- Base network RPC access for fork testing

### Installation

```bash
# Install dependencies
forge install
```

### Build

```bash
forge build
```

### Test

```bash
# Run all tests with gas report
forge test --gas-report

# Run fork tests (requires Base RPC)
forge test --match-contract "Fork" --fork-url https://mainnet.base.org --fork-block-number 32778110

# Run unit tests only
forge test --no-match-contract "Fork" --gas-report

# Run with verbose output
forge test -v
```

### Format

```bash
forge fmt
```

## 🧪 Testing

### Test Results

```
Ran 35 tests for test/RiseFiVaultFork.t.sol:RiseFiVaultForkTest
✅ 35 passed; 0 failed; 0 skipped
```

### Test Coverage

- **Unit Tests**: Core functionality and edge cases
- **Fork Tests**: Real integration with Morpho vaults on Base
- **Fuzz Tests**: Property-based testing for robustness
- **Gas Optimization**: Comprehensive gas reporting

### Test Structure

```bash
test/
├── RiseFiVaultFork.t.sol      # Comprehensive fork tests (35 tests)
│   ├── Infrastructure Tests    # USDC and Morpho integration
│   ├── Constructor Tests       # Contract initialization
│   ├── Core Functionality      # Deposit and withdrawal flows
│   ├── Constants Tests         # Contract constants validation
│   ├── Conversion Tests        # ERC-4626 conversion functions
│   ├── Withdrawal Tests        # Comprehensive withdrawal scenarios
│   └── Fuzz Tests             # Property-based testing
└── unit/                       # Unit tests
```

### Running Tests

```bash
# All tests with coverage
forge test --gas-report

# Fork tests (requires Base RPC)
forge test --match-contract "Fork" --fork-url https://mainnet.base.org --fork-block-number 32778110

# Unit tests only
forge test --no-match-contract "Fork" --gas-report
```

## 📁 Project Structure

```
RiseFi/
├── src/
│   ├── RiseFiVault.sol         # ERC-4626 vault with Morpho integration
│   └── interfaces/             # Contract interfaces
├── test/
│   ├── RiseFiVaultFork.t.sol  # Comprehensive fork tests (35 tests)
│   └── unit/                   # Unit tests
├── scripts/                    # Deployment scripts
├── lib/                        # Dependencies (OpenZeppelin, etc.)
├── foundry.toml               # Foundry configuration
└── README.md                  # This file
```

## 🔧 Configuration

### Foundry Profiles

- **default**: Standard development profile
- **ci**: Optimized for CI/CD pipeline
- **fork**: Base network fork configuration

### Networks

- **Base Mainnet**: Production target with Morpho integration
- **Base Sepolia**: Testnet deployment
- **Local Fork**: Development and testing with Base fork

## 🚀 Deployment

### Local Development

```bash
# Start local node
anvil

# Deploy contracts
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --private-key 0x...
```

### Base Network

```bash
# Deploy to Base Sepolia
forge script script/Deploy.s.sol --rpc-url base_sepolia --broadcast --verify

# Deploy to Base Mainnet
forge script script/Deploy.s.sol --rpc-url base_mainnet --broadcast --verify
```

## 🔐 Security

- **OpenZeppelin Standards**: Battle-tested security patterns
- **Comprehensive Testing**: 35 tests with 100% pass rate
- **Slither Analysis**: Automated security scanning
- **Professional Documentation**: Complete NatSpec documentation
- **Inflation Attack Protection**: Dead shares mechanism
- **Slippage Protection**: Built-in tolerance for withdrawals

## 📊 Gas Optimization

### Deployment Cost

- **RiseFiVault**: 2,228,868 gas

### Key Functions

- **deposit**: ~180,000 gas (average)
- **withdraw**: ~120,000 gas (average)
- **convertToAssets**: ~21,000 gas (average)
- **convertToShares**: ~21,000 gas (average)

## 📚 Documentation

- **Contract Documentation**: Complete NatSpec documentation in English
- **Test Documentation**: Comprehensive test explanations
- **Integration Guide**: Morpho Blue integration details
- **Security Analysis**: Detailed security considerations

### Key Documentation Features

- **Professional NatSpec**: Complete parameter and return documentation
- **Technical Explanations**: Detailed explanations of complex logic
- **Security Considerations**: Clear documentation of security measures
- **Integration Details**: Morpho Blue integration specifics

## 🤝 Contributing

1. Follow Solidity coding standards
2. Add comprehensive tests for new features
3. Ensure all tests pass (35/35)
4. Update documentation
5. Run security analysis with Slither
6. Maintain professional documentation standards

## 📄 License

MIT License - see [LICENSE](../LICENSE) file for details.

---

**Built with ❤️ using Foundry and OpenZeppelin**

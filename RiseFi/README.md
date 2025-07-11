# RiseFi Smart Contracts

[![Build & Test](https://github.com/FlorentDgrs/RiseFiV3/actions/workflows/build-and-test.yml/badge.svg)](https://github.com/FlorentDgrs/RiseFiV3/actions/workflows/build-and-test.yml)

Smart contracts for the **RiseFi** DeFi yield vault platform, built with Foundry.

## 📋 Contracts

### MockedUSDC.sol

6-decimal USDC token for testing:

- ERC-20 compliant with 6 decimals (like real USDC)
- Mintable by owner
- Used for vault testing

### RiseFiVault.sol

ERC-4626 compliant vault:

- Standard vault interface
- 6-decimal USDC as underlying asset
- Yield optimization ready
- Morpho Blue integration architecture

## 🚀 Development

### Prerequisites

- [Foundry](https://getfoundry.sh/) installed

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
# Run all tests
forge test

# Run unit tests only
forge test --no-match-contract "Fork"

# Run fork tests only
forge test --match-contract "Fork" --fork-url base_public

# Run with gas report
forge test --gas-report
```

### Format

```bash
forge fmt
```

## 🧪 Testing

### Test Coverage

- **Unit Tests**: 20 tests covering MockedUSDC and RiseFiVault
- **Fork Tests**: 5 tests using Base network fork
- **Gas Optimization**: Comprehensive gas reporting

### Test Structure

```bash
test/
├── unit/
│   ├── MockedUSDC.t.sol       # USDC token tests
│   └── RiseFiVault.t.sol      # Vault functionality tests
└── fork/
    └── RiseFiVaultFork.t.sol  # Integration tests on Base fork
```

### Running Tests

```bash
# All tests with coverage
forge test --gas-report

# Unit tests only
forge test --no-match-contract "Fork" --gas-report

# Fork tests (requires Base RPC)
forge test --match-contract "Fork" --fork-url base_public -v
```

## 📁 Project Structure

```
RiseFi/
├── src/
│   ├── MockedUSDC.sol          # 6-decimal USDC token
│   ├── RiseFiVault.sol         # ERC-4626 vault implementation
│   └── interfaces/             # Contract interfaces
├── test/
│   ├── unit/                   # Unit tests (20 tests)
│   └── fork/                   # Fork tests (5 tests)
├── script/                     # Deployment scripts
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

- **Base Mainnet**: Production target
- **Base Sepolia**: Testnet deployment
- **Local Fork**: Development and testing

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

- **Slither Analysis**: Automated security scanning
- **OpenZeppelin**: Battle-tested security patterns
- **Comprehensive Testing**: 95%+ test coverage
- **Gas Optimization**: Professional gas optimization

## 📚 Documentation

- [Foundry Book](https://book.getfoundry.sh/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [ERC-4626 Standard](https://eips.ethereum.org/EIPS/eip-4626)
- [Morpho Blue](https://morpho.org/)

## 🤝 Contributing

1. Follow the coding standards
2. Add comprehensive tests
3. Ensure all tests pass
4. Update documentation
5. Run security analysis

## 📄 License

MIT License

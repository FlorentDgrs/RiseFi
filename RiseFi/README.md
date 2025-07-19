# RiseFi Smart Contracts

[![Build & Test](https://github.com/FlorentDgrs/RiseFiV3/actions/workflows/build-and-test.yml/badge.svg)](https://github.com/FlorentDgrs/RiseFiV3/actions/workflows/build-and-test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.27-blue.svg)](https://docs.soliditylang.org/)
[![Foundry](https://img.shields.io/badge/Built%20with-Foundry-FFDB1C.svg)](https://getfoundry.sh/)

ERC-4626 vault with Morpho Blue integration on Base network.

## Overview

### RiseFiVault.sol

ERC-4626 compliant vault with Morpho Blue integration:

- **Standard ERC-4626 interface** — 6-decimal USDC support
- **Morpho Blue integration** — Enhanced yields on Base network
- **Inflation attack protection** — Dead shares mechanism
- **Slippage protection** — 1% tolerance for withdrawals
- **Gas optimized** — Professional patterns
- **Comprehensive testing** — 78 tests with >95% coverage
- **Admin controls** — Pause/unpause functionality
- **ERC-4626 standard pause** — Withdrawals allowed during pause

## Quick Start

### Prerequisites

- [Foundry](https://getfoundry.sh/)
- [Node.js](https://nodejs.org/) and npm (optional, for frontend)
- Internet connection (for Base mainnet fork)

### Installation

```bash
# Install Foundry dependencies
forge install

# Install frontend dependencies (optional)
cd ../frontend && npm install
```

## Deployment

### Automated Deployment

#### Production Mode (12s blocks)

```bash
cd RiseFi
./scripts/deploy-complete.sh
```

#### Development Mode (1s blocks)

```bash
cd RiseFi
./scripts/deploy-fast.sh
```

#### Test Mode (instant blocks)

```bash
cd RiseFi
./scripts/deploy-ultra-fast.sh
```

### Manual Deployment

```bash
# Start Anvil (simplified configuration)
anvil --fork-url https://mainnet.base.org \
      --fork-block-number 32778110 \
      --chain-id 31337 \
      --port 8545

# Deploy vault
forge script script/DeployVault.s.sol \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast \
  --private-key 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

# Fund test wallets
forge script script/FundTestWallets.s.sol \
  --rpc-url http://127.0.0.1:8545 \
  --broadcast \
  --unlocked
```

### Environment Configuration

The project uses a minimal configuration for local development:

```bash
# .env (optional - defaults work out of the box)
FORK_URL=https://mainnet.base.org
FORK_BLOCK=32778110
CHAIN_ID=31337
PORT=8545
```

**No API keys required** - uses public RPC endpoints only.

## Scripts

### Shell Scripts

| Script                 | Description                        | Usage                            |
| ---------------------- | ---------------------------------- | -------------------------------- |
| `deploy-complete.sh`   | Production deployment (12s blocks) | `./scripts/deploy-complete.sh`   |
| `deploy-fast.sh`       | Development deployment (1s blocks) | `./scripts/deploy-fast.sh`       |
| `deploy-ultra-fast.sh` | Test deployment (instant blocks)   | `./scripts/deploy-ultra-fast.sh` |
| `stop-all.sh`          | Stop all services                  | `./scripts/stop-all.sh`          |

### Solidity Scripts

| Script                  | Description                 |
| ----------------------- | --------------------------- |
| `DeployVault.s.sol`     | Deploy RiseFi vault         |
| `FundTestWallets.s.sol` | Fund test wallets with USDC |

## Network Configuration

### Local Network (Anvil - Chain ID: 31337)

- **USDC (Base)** — `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- **Morpho Vault** — `0x3128a0F7f0ea68E7B7c9B00AFa7E41045828e858`
- **Whale USDC** — `0x122fDD9fEcbc82F7d4237C0549a5057E31c8EF8D`
- **Vault RiseFi** — Displayed during deployment

### Test Accounts (Anvil)

- **Account 0** — `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- **Account 1** — `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
- **Account 2** — `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`

Each account is funded with 1,000,000 USDC for testing.

## Development

### Build

```bash
forge build
```

### Test

```bash
# Unit tests (73 tests, coverage >95%)
forge test

# Tests with gas reporting
forge test --gas-report

# Verbose tests
forge test -vvv

# Coverage report
forge coverage

# Comprehensive testing (with fork)
./scripts/test-comprehensive.sh
```

### Linting

```bash
# Format Solidity code
forge fmt

# Check formatting
forge fmt --check
```

## Project Structure

```
RiseFi/
├── scripts/
│   ├── deploy-complete.sh    # Production deployment (12s blocks)
│   ├── deploy-fast.sh        # Development deployment (1s blocks)
│   ├── deploy-ultra-fast.sh  # Test deployment (0s blocks)
│   ├── stop-all.sh           # Stop all services
│   └── test-comprehensive.sh # Comprehensive testing
├── script/
│   ├── DeployVault.s.sol     # Vault deployment
│   └── FundTestWallets.s.sol # Wallet funding
├── src/
│   └── RiseFiVault.sol       # Main ERC-4626 contract
├── test/
│   └── RiseFiVault.t.sol     # 73 comprehensive tests
├── lib/                      # Foundry dependencies
├── out/                      # Build artifacts
├── cache/                    # Foundry cache
├── .env                      # Minimal environment config
├── foundry.toml              # Foundry configuration
├── LICENSE                   # MIT License
├── README.md                 # This file
├── DOCUMENTATION_FONCTIONS.md # Detailed function docs
├── RAPPORT_SECURITE_COMPLET.md # Security report
└── GUIDE_TESTS_FOUNDRY.md    # Testing guide
```

## Contributing

1. Fork the project
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## License

MIT License - see [LICENSE](LICENSE) file for details.

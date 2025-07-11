# RiseFi — DeFi Yield Vault

[![Build & Test](https://github.com/FlorentDgrs/RiseFiV3/actions/workflows/build-and-test.yml/badge.svg)](https://github.com/FlorentDgrs/RiseFiV3/actions/workflows/build-and-test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.27-blue.svg)](https://docs.soliditylang.org/)
[![Foundry](https://img.shields.io/badge/Built%20with-Foundry-FFDB1C.svg)](https://getfoundry.sh/)

DeFi yield optimization protocol with ERC-4626 vaults and Morpho Blue integration.

## Features

- **ERC-4626 Vaults** — Standard vault interface with 6-decimal USDC
- **Morpho Blue Ready** — Integration architecture for yield optimization
- **Gas Optimized** — Professional gas optimization patterns
- **Comprehensive Testing** — Unit, integration, and fork testing
- **Security Analysis** — Automated Slither security scanning

## Quick Start

```bash
# Clone and install
git clone https://github.com/FlorentDgrs/RiseFiV3.git
cd RiseFiV3/RiseFi
forge install

# Build and test
forge build
forge test
```

## Architecture

```
RiseFi/
├── src/
│   ├── MockedUSDC.sol     # 6-decimal USDC token
│   ├── RiseFiVault.sol    # ERC-4626 vault implementation
│   └── interfaces/        # Contract interfaces
├── test/
│   ├── unit/              # Unit tests (20 tests)
│   └── fork/              # Fork tests (5 tests)
└── script/                # Deployment scripts
```

## Testing

```bash
# Unit tests
forge test --no-match-contract "Fork" --gas-report

# Fork tests (requires Base RPC)
forge test --match-contract "Fork" --fork-url base_public -v

# All tests
forge test
```

## Development

- **Foundry** — Testing and development framework
- **OpenZeppelin** — Security standards and libraries
- **Base Network** — Target deployment network
- **Slither** — Automated security analysis

## Smart Contracts

| Contract      | Description                            |
| ------------- | -------------------------------------- |
| `MockedUSDC`  | 6-decimal USDC token for testing       |
| `RiseFiVault` | ERC-4626 vault with yield optimization |

## Networks

- **Base Mainnet** — Production deployment (coming soon)
- **Base Sepolia** — Testnet deployment (coming soon)
- **Local Fork** — Development and testing

## License

MIT License

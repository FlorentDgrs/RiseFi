# RiseFi — ERC-4626 Yield Vault

[![Build & Test](https://github.com/FlorentDgrs/RiseFiV3/actions/workflows/build-and-test.yml/badge.svg)](https://github.com/FlorentDgrs/RiseFiV3/actions/workflows/build-and-test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.27-blue.svg)](https://docs.soliditylang.org/)
[![Foundry](https://img.shields.io/badge/Built%20with-Foundry-FFDB1C.svg)](https://getfoundry.sh/)

ERC-4626 compliant yield vault with Morpho Blue integration on Base network.

## Features

- **ERC-4626 Standard** — Full compliance with proper pause behavior
- **Morpho Blue Integration** — Direct vault integration for enhanced yields
- **Security** — Dead shares protection, slippage guards, comprehensive testing
- **Gas Optimized** — Professional patterns and efficient operations
- **Zero Configuration** — Works out of the box with public RPC endpoints
- **Modern Frontend** — React/Next.js with TypeScript and Wagmi

## Quick Start

```bash
# Clone repository
git clone https://github.com/FlorentDgrs/RiseFi.git
cd RiseFi

# Install Foundry dependencies
cd RiseFi && forge install

# Deploy contracts (no API keys needed)
./scripts/deploy-ultra-fast.sh

# Start frontend
cd ../frontend && npm install && npm run dev
```

**No API keys required** - uses public Base mainnet RPC endpoints.

## Architecture

```
RiseFiV3/
├── RiseFi/                    # Smart contracts (Foundry)
│   ├── src/RiseFiVault.sol    # ERC-4626 vault
│   ├── test/                  # 78 comprehensive tests
│   └── scripts/               # Deployment automation
└── frontend/                  # React/Next.js application
    ├── app/                   # Pages and routing
    │   ├── dashboard/         # Main dashboard
    │   ├── admin/             # Admin panel
    │   └── academy/           # Educational content
    ├── components/            # Reusable components
    └── utils/                 # Contract utilities
```

## Testing

```bash
# Smart contracts
cd RiseFi && forge test --gas-report

# Frontend
cd frontend && npm run check
```

## Smart Contracts

| Contract      | Description                            | Status      |
| ------------- | -------------------------------------- | ----------- |
| `RiseFiVault` | ERC-4626 vault with Morpho integration | ✅ Complete |

### Key Features

- **Morpho Integration** — Direct vault integration on Base
- **Dead Shares Protection** — 1000 dead shares prevent inflation attacks
- **Slippage Protection** — 1% tolerance for withdrawals
- **ERC-4626 Compliance** — Standard pause behavior (deposits disabled, withdrawals allowed)
- **Gas Optimization** — Professional patterns and efficient operations

## Networks

- **Base Mainnet** — Production deployment
- **Base Sepolia** — Testnet deployment
- **Local Fork** — Development with Base fork

## Test Results

```
Ran 73 tests for test/RiseFiVault.t.sol:RiseFiVaultTest
✅ All tests passed; 0 failed; 0 skipped
```

## Security

- **OpenZeppelin Standards** — Battle-tested security patterns
- **Comprehensive Testing** — 78 tests with 100% pass rate
- **ERC-4626 Compliance** — Standard implementation
- **Professional Documentation** — Complete NatSpec documentation

## Development

### Prerequisites

- [Foundry](https://getfoundry.sh/)
- [Node.js](https://nodejs.org/) and npm (for frontend)
- Internet connection (for Base mainnet fork)

### Commands

```bash
# Smart contracts
cd RiseFi
forge build
forge test --gas-report
forge fmt

# Frontend
cd frontend
npm run dev
npm run build
npm run check
```

## Recent Updates

### Simplified Configuration

- **Zero Configuration** — Works out of the box with public RPC endpoints
- **No API Keys** — Uses Base mainnet public RPC only
- **Minimal Setup** — Only 4 environment variables needed
- **Enhanced Testing** — 73 comprehensive tests with full coverage

### ERC-4626 Standard Compliance

- **Pause Behavior** — Deposits disabled, withdrawals allowed during pause
- **Removed Emergency Functions** — Cleaner, more secure implementation
- **Frontend Updates** — UI reflects standard pause behavior
- **Test Suite** — 73 tests validate ERC-4626 compliance

## Documentation

- **Contract Documentation** — Complete NatSpec in `RiseFi/src/`
- **Function Documentation** — Detailed explanations in `RiseFi/DOCUMENTATION_FONCTIONS.md`
- **Security Report** — Comprehensive analysis in `RiseFi/RAPPORT_SECURITE_COMPLET.md`
- **Testing Guide** — Complete Foundry guide in `RiseFi/GUIDE_TESTS_FOUNDRY.md`
- **Frontend Documentation** — Component docs in `frontend/README.md`

## Contributing

1. Follow Solidity coding standards
2. Add comprehensive tests for new features
3. Ensure all tests pass (73/73)
4. Update documentation
5. No API keys required - use public RPC endpoints

## License

MIT License - see [LICENSE](LICENSE) file for details.

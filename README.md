# RiseFi — Decentralized Vaults with Yield Strategies

![CI](https://github.com/FlorentDgrs/RiseFiV3/actions/workflows/test.yml/badge.svg)

**RiseFi** is a decentralized investment platform built as part of the Alyra certification program.  
It allows users to invest into yield-generating strategies via ERC-4626-compliant vaults.

<!-- Test trigger for GitHub Actions -->

## 🏗️ Project Structure

```
RiseFiv3Foundry/
├── .github/workflows/test.yml  ← GitHub Actions CI (Foundry)
├── RiseFi/                     ← Smart contracts (Vault, ERC20, tests)
└── frontend/                   ← Frontend (coming soon)
```

## 🚀 Quick Start

### Prerequisites

- [Foundry](https://getfoundry.sh/) installed
- Git

### Installation

```bash
git clone https://github.com/FlorentDgrs/RiseFiV3.git
cd RiseFiV3
forge install
```

### Development

```bash
# Navigate to smart contracts
cd RiseFi

# Build contracts
forge build

# Run tests
forge test

# Format code
forge fmt
```

## 📦 Subprojects

### `/RiseFi` – Smart contracts (Solidity + Foundry)

- ERC20 mock token (`MockedUSDC`)
- ERC4626 vault (in progress)
- Morpho Blue integration (strategy routing)
- Tests in Foundry + GitHub Actions + Slither

📘 [See smart contract README](./RiseFi/README.md)

### `/frontend` – Web3 frontend (to come)

- Connect wallet
- Visualize vaults
- Deposit/withdraw
- Monitor yield

## 🎓 Context

This project is part of the final evaluation for the [Alyra blockchain developer certification](https://alyra.fr/).  
It demonstrates skills in Solidity, smart contract testing, TDD, vault design, DeFi protocol integration, and deployment pipelines.

## 🧪 Testing

All tests are automatically run on every push via GitHub Actions:

- Unit tests
- Integration tests
- Security analysis (Slither)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Links

- [Alyra Certification](https://alyra.fr/)
- [Foundry Book](https://book.getfoundry.sh/)
- [ERC-4626 Standard](https://eips.ethereum.org/EIPS/eip-4626)

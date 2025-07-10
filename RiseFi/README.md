# RiseFi Smart Contracts

![CI](https://github.com/FlorentDgrs/RiseFiV3/actions/workflows/test.yml/badge.svg)

Smart contracts for the **RiseFi** decentralized vault platform, built with Foundry.

## 📋 Contracts

### MockedUSDC.sol

A mock USDC token for testing purposes:

- ERC-20 compliant
- Mintable by owner
- Used for vault testing

```solidity
contract MockedUSDC is ERC20, Ownable {
    constructor() ERC20("Mocked USDC", "mUSDC") Ownable(msg.sender) {}

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}
```

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

# Run with verbose output
forge test -vvv

# Run specific test
forge test --match-test testNameAndSymbol
```

### Format

```bash
forge fmt
```

### Gas Analysis

```bash
forge snapshot
```

## 🧪 Testing

### Current Tests

- `MockedUSDC.t.sol`: Tests for the mock USDC token
  - Name and symbol verification
  - Minting functionality
  - Owner permissions

### Running Tests

```bash
# Run all tests
forge test

# Run with coverage
forge coverage

# Run specific test file
forge test --match-path test/MockedUSDC.t.sol
```

## 📁 Project Structure

```
RiseFi/
├── src/
│   └── MockedUSDC.sol      ← Mock USDC token
├── test/
│   └── MockedUSDC.t.sol    ← Token tests
├── script/                  ← Deployment scripts
├── lib/                     ← Dependencies
└── foundry.toml            ← Foundry configuration
```

## 🔧 Configuration

The project uses Foundry with the following configuration:

- Solidity version: ^0.8.30
- OpenZeppelin contracts for ERC-20 implementation
- Forge-std for testing utilities

## 🚀 Deployment

### Local Development

```bash
# Start local node
anvil

# Deploy contracts
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --private-key 0x...
```

### Testnet/Mainnet

```bash
# Deploy to testnet
forge script script/Deploy.s.sol --rpc-url <RPC_URL> --private-key <PRIVATE_KEY>
```

## 📚 Documentation

- [Foundry Book](https://book.getfoundry.sh/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [ERC-4626 Standard](https://eips.ethereum.org/EIPS/eip-4626)

## 🤝 Contributing

1. Follow the coding standards
2. Add tests for new features
3. Ensure all tests pass
4. Update documentation

## 📄 License

MIT License - see LICENSE file for details

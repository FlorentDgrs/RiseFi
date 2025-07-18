// Contract configuration for RiseFi frontend
// Contract addresses on local Base fork

import { RISEFI_VAULT_ABI } from "./generated-abi";

export const CONTRACTS = {
  USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  RISEFI_VAULT: "0x2c90f2f1a1fe7279c0321787a93015bf116dc36a",
} as const;

// Network configuration
export const NETWORK_CONFIG = {
  CHAIN_ID: 31337, // Anvil local (Base fork)
  RPC_URL: "http://localhost:8545",
  BLOCK_EXPLORER: "https://basescan.org", // For reference
  FORK_BLOCK: 32778110,
} as const;

// Anvil test wallets (with their private keys)
export const TEST_WALLETS = {
  WALLET_1: {
    address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    privateKey:
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  },
  WALLET_2: {
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    privateKey:
      "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
  },
  WALLET_3: {
    address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    privateKey:
      "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
  },
} as const;

// ABIs - Now uses automatically generated ABI
export const ABIS = {
  // Minimal ERC20 ABI for USDC
  ERC20: [
    {
      name: "allowance",
      type: "function",
      stateMutability: "view",
      inputs: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
      ],
      outputs: [{ name: "", type: "uint256" }],
    },
    {
      name: "approve",
      type: "function",
      stateMutability: "nonpayable",
      inputs: [
        { name: "spender", type: "address" },
        { name: "amount", type: "uint256" },
      ],
      outputs: [{ name: "", type: "bool" }],
    },
    {
      name: "balanceOf",
      type: "function",
      stateMutability: "view",
      inputs: [{ name: "account", type: "address" }],
      outputs: [{ name: "", type: "uint256" }],
    },
    {
      name: "transfer",
      type: "function",
      stateMutability: "nonpayable",
      inputs: [
        { name: "to", type: "address" },
        { name: "amount", type: "uint256" },
      ],
      outputs: [{ name: "", type: "bool" }],
    },
  ] as const,

  // RiseFi Vault ABI - Now automatically generated from the contract
  RISEFI_VAULT: RISEFI_VAULT_ABI,
} as const;

// Helper to update RiseFi vault address after deployment
export const updateRiseFiVaultAddress = (address: string) => {
  // This function will be used to update the address after deployment
  // In production, this should be handled by environment variables
  return address;
};

// Useful constants
export const CONSTANTS = {
  USDC_DECIMALS: 6,
  VAULT_SHARES_DECIMALS: 18,
  FUNDING_AMOUNT: 10000, // 10,000 USDC per test wallet
} as const;

// RiseFi Frontend Contract Configuration
// All contract addresses for local development

import { RISEFI_VAULT_ABI_TYPED } from "./abi";

export const CONTRACTS = {
  USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  RISEFI_VAULT: "0x2c90f2f1a1fe7279c0321787a93015bf116dc36a",
  MORPHO_VAULT: "0x3128a0F7f0ea68E7B7c9B00AFa7E41045828e858", // For shares reading
  MORPHO_VAULT_APY: "0x7BfA7C4f149E7415b73bdeDfe609237e29CBF34A", // For APY API
} as const;

// Network configuration for local development
export const NETWORK_CONFIG = {
  CHAIN_ID: 31337, // Anvil local
  RPC_URL: "http://localhost:8545",
  BLOCK_EXPLORER: "https://basescan.org",
  FORK_BLOCK: 32778110,
} as const;

// ABIs for contract interactions
export const ABIS = {
  // Minimal ERC20 ABI for USDC operations
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

  // RiseFi Vault ABI - Automatically generated from contract
  RISEFI_VAULT: RISEFI_VAULT_ABI_TYPED,
} as const;

// Project constants
export const CONSTANTS = {
  USDC_DECIMALS: 6,
  VAULT_SHARES_DECIMALS: 18,
  FUNDING_AMOUNT: 10000, // 10,000 USDC per test wallet
} as const;

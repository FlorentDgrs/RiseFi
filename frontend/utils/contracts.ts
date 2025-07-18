// Configuration des contrats pour le frontend RiseFi
// Adresses des contrats sur le fork Base local

import { RISEFI_VAULT_ABI } from "./generated-abi";

export const CONTRACTS = {
  USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  RISEFI_VAULT: "0x2c90F2f1A1fE7279C0321787A93015bF116Dc36A",
} as const;

// Configuration réseau
export const NETWORK_CONFIG = {
  CHAIN_ID: 31337, // Anvil local (fork de Base)
  RPC_URL: "http://localhost:8545",
  BLOCK_EXPLORER: "https://basescan.org", // Pour référence
  FORK_BLOCK: 32778110,
} as const;

// Wallets de test Anvil (avec leurs clés privées)
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

// ABIs - Maintenant utilise l'ABI généré automatiquement
export const ABIS = {
  // ABI ERC20 minimal pour USDC
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

  // ABI RiseFi Vault - Maintenant généré automatiquement depuis le contrat
  RISEFI_VAULT: RISEFI_VAULT_ABI,
} as const;

// Helper pour mettre à jour l'adresse du vault RiseFi après déploiement
export const updateRiseFiVaultAddress = (address: string) => {
  // Cette fonction sera utilisée pour mettre à jour l'adresse après déploiement
  // En production, cela devrait être géré par des variables d'environnement
  console.log("RiseFi Vault deployed at:", address);
  return address;
};

// Constantes utiles
export const CONSTANTS = {
  USDC_DECIMALS: 6,
  VAULT_SHARES_DECIMALS: 18,
  MIN_DEPOSIT_USDC: 1, // 1 USDC minimum
  FUNDING_AMOUNT: 10000, // 10,000 USDC par wallet de test
} as const;

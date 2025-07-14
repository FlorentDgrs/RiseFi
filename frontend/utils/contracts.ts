// Configuration des contrats pour le frontend RiseFi
// Adresses des contrats sur le fork Base local

export const CONTRACTS = {
  // Contrats Base mainnet (utilisés sur le fork)
  USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  MORPHO_VAULT: "0x3128a0F7f0ea68E7B7c9B00AFa7E41045828e858",
  USDC_WHALE: "0x0B0A5886664376F59C351ba3f598C8A8B4D0A6f3",

  // Contrat RiseFi (déployé sur le fork)
  RISEFI_VAULT: "0x5a629b4f8c0176715599A45d0BC57322e8cE1848", // Déployé avec fund-and-deploy.sh
} as const;

// Configuration réseau
export const NETWORK_CONFIG = {
  CHAIN_ID: 8453, // Base mainnet (même sur le fork)
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

// ABIs simplifiés pour les interactions
export const ABIS = {
  // ABI ERC20 minimal pour USDC
  ERC20: [
    {
      name: "name",
      type: "function",
      stateMutability: "view",
      inputs: [],
      outputs: [{ name: "", type: "string" }],
    },
    {
      name: "symbol",
      type: "function",
      stateMutability: "view",
      inputs: [],
      outputs: [{ name: "", type: "string" }],
    },
    {
      name: "decimals",
      type: "function",
      stateMutability: "view",
      inputs: [],
      outputs: [{ name: "", type: "uint8" }],
    },
    {
      name: "totalSupply",
      type: "function",
      stateMutability: "view",
      inputs: [],
      outputs: [{ name: "", type: "uint256" }],
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
      name: "allowance",
      type: "function",
      stateMutability: "view",
      inputs: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
      ],
      outputs: [{ name: "", type: "uint256" }],
    },
  ] as const,

  // ABI ERC4626 pour les vaults (RiseFi et Morpho)
  ERC4626: [
    {
      name: "name",
      type: "function",
      stateMutability: "view",
      inputs: [],
      outputs: [{ name: "", type: "string" }],
    },
    {
      name: "symbol",
      type: "function",
      stateMutability: "view",
      inputs: [],
      outputs: [{ name: "", type: "string" }],
    },
    {
      name: "asset",
      type: "function",
      stateMutability: "view",
      inputs: [],
      outputs: [{ name: "", type: "address" }],
    },
    {
      name: "totalAssets",
      type: "function",
      stateMutability: "view",
      inputs: [],
      outputs: [{ name: "", type: "uint256" }],
    },
    {
      name: "totalSupply",
      type: "function",
      stateMutability: "view",
      inputs: [],
      outputs: [{ name: "", type: "uint256" }],
    },
    {
      name: "convertToShares",
      type: "function",
      stateMutability: "view",
      inputs: [{ name: "assets", type: "uint256" }],
      outputs: [{ name: "", type: "uint256" }],
    },
    {
      name: "convertToAssets",
      type: "function",
      stateMutability: "view",
      inputs: [{ name: "shares", type: "uint256" }],
      outputs: [{ name: "", type: "uint256" }],
    },
    {
      name: "maxDeposit",
      type: "function",
      stateMutability: "view",
      inputs: [{ name: "receiver", type: "address" }],
      outputs: [{ name: "", type: "uint256" }],
    },
    {
      name: "maxWithdraw",
      type: "function",
      stateMutability: "view",
      inputs: [{ name: "owner", type: "address" }],
      outputs: [{ name: "", type: "uint256" }],
    },
    {
      name: "balanceOf",
      type: "function",
      stateMutability: "view",
      inputs: [{ name: "account", type: "address" }],
      outputs: [{ name: "", type: "uint256" }],
    },
    {
      name: "deposit",
      type: "function",
      stateMutability: "nonpayable",
      inputs: [
        { name: "assets", type: "uint256" },
        { name: "receiver", type: "address" },
      ],
      outputs: [{ name: "", type: "uint256" }],
    },
    {
      name: "withdraw",
      type: "function",
      stateMutability: "nonpayable",
      inputs: [
        { name: "assets", type: "uint256" },
        { name: "receiver", type: "address" },
        { name: "owner", type: "address" },
      ],
      outputs: [{ name: "", type: "uint256" }],
    },
    {
      name: "redeem",
      type: "function",
      stateMutability: "nonpayable",
      inputs: [
        { name: "shares", type: "uint256" },
        { name: "receiver", type: "address" },
        { name: "owner", type: "address" },
      ],
      outputs: [{ name: "", type: "uint256" }],
    },
  ] as const,

  // ABI spécifique RiseFi Vault - Inclut ERC4626 + fonctions spécifiques
  RISEFI_VAULT: [
    // Fonctions ERC4626 héritées
    {
      name: "name",
      type: "function",
      stateMutability: "view",
      inputs: [],
      outputs: [{ name: "", type: "string" }],
    },
    {
      name: "symbol",
      type: "function",
      stateMutability: "view",
      inputs: [],
      outputs: [{ name: "", type: "string" }],
    },
    {
      name: "asset",
      type: "function",
      stateMutability: "view",
      inputs: [],
      outputs: [{ name: "", type: "address" }],
    },
    {
      name: "totalAssets",
      type: "function",
      stateMutability: "view",
      inputs: [],
      outputs: [{ name: "", type: "uint256" }],
    },
    {
      name: "totalSupply",
      type: "function",
      stateMutability: "view",
      inputs: [],
      outputs: [{ name: "", type: "uint256" }],
    },
    {
      name: "convertToShares",
      type: "function",
      stateMutability: "view",
      inputs: [{ name: "assets", type: "uint256" }],
      outputs: [{ name: "", type: "uint256" }],
    },
    {
      name: "convertToAssets",
      type: "function",
      stateMutability: "view",
      inputs: [{ name: "shares", type: "uint256" }],
      outputs: [{ name: "", type: "uint256" }],
    },
    {
      name: "balanceOf",
      type: "function",
      stateMutability: "view",
      inputs: [{ name: "account", type: "address" }],
      outputs: [{ name: "", type: "uint256" }],
    },
    {
      name: "deposit",
      type: "function",
      stateMutability: "nonpayable",
      inputs: [
        { name: "assets", type: "uint256" },
        { name: "receiver", type: "address" },
      ],
      outputs: [{ name: "", type: "uint256" }],
    },
    {
      name: "withdraw",
      type: "function",
      stateMutability: "nonpayable",
      inputs: [
        { name: "assets", type: "uint256" },
        { name: "receiver", type: "address" },
        { name: "owner", type: "address" },
      ],
      outputs: [{ name: "", type: "uint256" }],
    },
    // Fonctions spécifiques RiseFi
    {
      name: "USDC",
      type: "function",
      stateMutability: "view",
      inputs: [],
      outputs: [{ name: "", type: "address" }],
    },
    {
      name: "morphoVault",
      type: "function",
      stateMutability: "view",
      inputs: [],
      outputs: [{ name: "", type: "address" }],
    },
    {
      name: "MIN_DEPOSIT",
      type: "function",
      stateMutability: "view",
      inputs: [],
      outputs: [{ name: "", type: "uint256" }],
    },
    {
      name: "DEAD_SHARES",
      type: "function",
      stateMutability: "view",
      inputs: [],
      outputs: [{ name: "", type: "uint256" }],
    },
    {
      name: "DEAD_ADDRESS",
      type: "function",
      stateMutability: "view",
      inputs: [],
      outputs: [{ name: "", type: "address" }],
    },
  ] as const,
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

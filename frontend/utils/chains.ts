import { Chain } from "viem";

// Configuration du réseau Anvil local (développement)
export const anvilChain: Chain = {
  id: 31337, // Anvil local standard
  name: "Anvil Local",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["http://127.0.0.1:8545"],
    },
    public: {
      http: ["http://127.0.0.1:8545"],
    },
  },
  blockExplorers: {
    default: {
      name: "Anvil Local",
      url: "http://127.0.0.1:8545",
    },
  },
  testnet: true,
};

// Configuration du réseau Base mainnet (production)
export const baseChain: Chain = {
  id: 8453,
  name: "Base",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["https://mainnet.base.org"],
    },
    public: {
      http: ["https://mainnet.base.org"],
    },
  },
  blockExplorers: {
    default: {
      name: "BaseScan",
      url: "https://basescan.org",
    },
  },
  testnet: false,
};

// Configuration pour différents environnements
export const getChains = () => {
  // En développement, utiliser Anvil
  if (process.env.NODE_ENV === "development") {
    return [anvilChain];
  }

  // En production, utiliser Base mainnet
  return [baseChain];
};

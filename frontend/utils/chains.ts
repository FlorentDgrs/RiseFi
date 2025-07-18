import { Chain } from "viem";

// Anvil local network configuration (development)
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

// Base mainnet network configuration (production)
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

// Configuration for different environments
export const getChains = () => {
  // In development, use Anvil
  if (process.env.NODE_ENV === "development") {
    return [anvilChain];
  }

  // In production, use Base mainnet
  return [baseChain];
};

import { Chain } from "viem";

// Anvil local network configuration
export const anvilChain: Chain = {
  id: 31337, // Anvil standard
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

// Base mainnet network configuration
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

// Chain configuration
export const getChains = () => {
  // Currently using Anvil local for development
  // In production, this would return Base mainnet
  return [anvilChain];
};

"use client";
import "@rainbow-me/rainbowkit/styles.css";
import {
  getDefaultConfig,
  RainbowKitProvider,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { http } from "viem";
import { anvilChain } from "../utils/chains";
import { NetworkEnforcer } from "../components/shared/NetworkEnforcer";

// Define Anvil chain for RainbowKit
const rainbowKitAnvilChain = {
  id: 31337,
  name: "Anvil Local",
  iconUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png",
  iconBackground: "#000000",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: { http: ["http://127.0.0.1:8545"] },
    public: { http: ["http://127.0.0.1:8545"] },
  },
  blockExplorers: {
    default: {
      name: "Anvil Local",
      url: "http://127.0.0.1:8545",
    },
  },
  testnet: true,
};

// Configuration for local development
const config = getDefaultConfig({
  appName: "RiseFi",
  projectId: "79baaa61aacc8a01e2d6f0fb66c30898", // ProjectId factice
  chains: [rainbowKitAnvilChain],
  transports: {
    [anvilChain.id]: http("http://127.0.0.1:8545"),
  },
  ssr: false, // Disable SSR to avoid IndexedDB errors
});

// QueryClient configuration with error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const RainbowKitAndWagmiProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#E1A100",
            accentColorForeground: "black",
            borderRadius: "small",
            fontStack: "system",
            overlayBlur: "small",
          })}
          locale="en-US"
          showRecentTransactions={true}
        >
          <NetworkEnforcer />
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default RainbowKitAndWagmiProvider;

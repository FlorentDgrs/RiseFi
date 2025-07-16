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
import { NetworkEnforcer } from "../components/NetworkEnforcer";

// Configuration pour développement local
// Note: Les erreurs WalletConnect 403 et Reown analytics sont normales en développement
// et n'affectent pas les transactions - elles peuvent être ignorées
const config = getDefaultConfig({
  appName: "RiseFi",
  projectId: "00000000000000000000000000000000", // ProjectId factice
  chains: [anvilChain],
  transports: {
    [anvilChain.id]: http("http://127.0.0.1:8545"),
  },
  ssr: true,
});

// Configuration du QueryClient avec gestion d'erreurs
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

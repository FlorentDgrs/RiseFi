"use client";
import "@rainbow-me/rainbowkit/styles.css";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider, createConfig, http } from "wagmi";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { defineChain } from "viem";

// Configuration pour le fork Anvil - réseau complètement personnalisé
const anvilFork = defineChain({
  id: 31337, // Chain ID d'Anvil par défaut
  name: "Anvil Local Fork",
  network: "anvil-local",
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
      name: "Local Explorer",
      url: "http://localhost:8545",
    },
  },
});

// Configuration pour Anvil (Base fork)
const config = createConfig({
  chains: [anvilFork],
  transports: {
    [anvilFork.id]: http("http://127.0.0.1:8545"),
  },
  // Forcer l'utilisation du réseau Anvil uniquement
  ssr: false,
  // Désactiver la détection automatique de réseau
  pollingInterval: 0,
});

const queryClient = new QueryClient();

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
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default RainbowKitAndWagmiProvider;

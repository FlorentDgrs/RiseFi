"use client";
import "@rainbow-me/rainbowkit/styles.css";
import {
  getDefaultConfig,
  RainbowKitProvider,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { foundry, base } from "viem/chains";
import { http } from "viem";

const config = getDefaultConfig({
  appName: "RiseFi",
  projectId:
    process.env.NEXT_PUBLIC_WC_PROJECT_ID || "YOUR_WALLETCONNECT_PROJECT_ID",
  chains: [foundry, base],
  transports: {
    [foundry.id]: http(
      process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545"
    ),
    [base.id]: http("https://mainnet.base.org"),
  },
  ssr: true,
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

"use client";
import { useEffect } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";

const ANVIL_CHAIN_ID = 31337; // Anvil local chainId

export function NetworkEnforcer() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  useEffect(() => {
    if (isConnected && chainId !== ANVIL_CHAIN_ID) {
      console.log("🔄 Forcing switch to Anvil local network...");
      switchChain?.({ chainId: ANVIL_CHAIN_ID });
    }
  }, [isConnected, chainId, switchChain]);

  return null; // Ce composant ne rend rien visuellement
}

"use client";
import { useEffect } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";

const ANVIL_CHAIN_ID = 31337;

export function NetworkEnforcer() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  useEffect(() => {
    if (isConnected && chainId !== ANVIL_CHAIN_ID) {
      switchChain?.({ chainId: ANVIL_CHAIN_ID });
    }
  }, [isConnected, chainId, switchChain]);

  // Show message if not on the correct network
  if (isConnected && chainId !== ANVIL_CHAIN_ID) {
    return (
      <div className="fixed top-0 left-0 right-0 bg-red-600 text-white p-3 text-center z-50">
        ⚠️ Wrong network detected. Switching to Anvil (chainId: {ANVIL_CHAIN_ID}
        )...
      </div>
    );
  }

  return null; // This component doesn't render anything visually when everything is fine
}

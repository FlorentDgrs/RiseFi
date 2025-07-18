"use client";

import { useReadContract } from "wagmi";
import { ABIS, CONTRACTS } from "@/utils/contracts";

const VAULT_ADDRESS = CONTRACTS.RISEFI_VAULT;
const VAULT_ABI = ABIS.RISEFI_VAULT;

export default function VaultInfo() {
  // Lire les constantes du contrat
  const { data: minDeposit } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "MIN_DEPOSIT",
  });

  const { data: deadShares } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "DEAD_SHARES",
  });

  const { data: slippageTolerance } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "getSlippageTolerance",
  });

  const { data: basisPoints } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "BASIS_POINTS",
  });

  const { data: isPaused } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "isPaused",
  });

  const { data: deadAddress } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "DEAD_ADDRESS",
  });

  const { data: morphoVault } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "morphoVault",
  });

  return (
    <div className="w-full max-w-2xl mx-auto p-6 rounded-2xl bg-gray-900/90 border border-[#f5c249] shadow-xl">
      <h2 className="text-xl font-bold text-[#f5c249] mb-4">
        📊 Vault Information
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-400">Status:</span>
            <span className={isPaused ? "text-red-400" : "text-green-400"}>
              {isPaused ? "⏸️ Paused" : "▶️ Active"}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">Min Deposit:</span>
            <span className="text-white font-mono">
              {minDeposit ? `${Number(minDeposit) / 1e6} USDC` : "Loading..."}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">Dead Shares:</span>
            <span className="text-white font-mono">
              {deadShares ? deadShares.toString() : "Loading..."}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">Slippage Tolerance:</span>
            <span className="text-white font-mono">
              {slippageTolerance && basisPoints
                ? `${(Number(slippageTolerance) / Number(basisPoints)) * 100}%`
                : "Loading..."}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-400">Dead Address:</span>
            <span className="text-white font-mono text-xs">
              {deadAddress
                ? `${deadAddress.slice(0, 6)}...${deadAddress.slice(-4)}`
                : "Loading..."}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">Morpho Vault:</span>
            <span className="text-white font-mono text-xs">
              {morphoVault
                ? `${morphoVault.slice(0, 6)}...${morphoVault.slice(-4)}`
                : "Loading..."}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">Basis Points:</span>
            <span className="text-white font-mono">
              {basisPoints ? basisPoints.toString() : "Loading..."}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-900/20 rounded-lg border border-blue-500/30">
        <h3 className="text-sm font-semibold text-blue-400 mb-2">
          ℹ️ Important Notes
        </h3>
        <ul className="text-xs text-blue-300 space-y-1">
          <li>• withdraw() function is disabled - use redeem() instead</li>
          <li>• Dead shares prevent inflation attacks on first deposit</li>
          <li>
            • Slippage protection is automatically applied to all operations
          </li>
          <li>• Emergency withdraw bypasses normal safety checks</li>
        </ul>
      </div>
    </div>
  );
}

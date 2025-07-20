"use client";

import { useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { ABIS, CONTRACTS, CONSTANTS } from "@/utils/contracts";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

const VAULT_ADDRESS = CONTRACTS.RISEFI_VAULT;
const VAULT_ABI = ABIS.RISEFI_VAULT;
const MORPHO_VAULT_ADDRESS = CONTRACTS.MORPHO_VAULT;
const MORPHO_VAULT_APY_ADDRESS = CONTRACTS.MORPHO_VAULT_APY;

export default function EnhancedVaultInfo() {
  // Basic vault info
  const { data: minDeposit } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "MIN_DEPOSIT",
  }) as { data: bigint | undefined };

  const { data: deadShares } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "DEAD_SHARES",
  }) as { data: bigint | undefined };

  const { data: slippageTolerance } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "getSlippageTolerance",
  }) as { data: bigint | undefined };

  const { data: basisPoints } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "BASIS_POINTS",
  }) as { data: bigint | undefined };

  const { data: isPaused, refetch: refetchPauseStatus } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "isPaused",
  }) as { data: boolean | undefined; refetch: () => void };

  const { data: deadAddress } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "DEAD_ADDRESS",
  }) as { data: string | undefined };

  const { data: morphoVault } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "morphoVault",
  }) as { data: string | undefined };

  // Enhanced vault metrics
  const { data: totalSupply, refetch: refetchTotalSupply } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "totalSupply",
  }) as { data: bigint | undefined; refetch: () => void };

  const { data: totalAssets, refetch: refetchTotalAssets } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "totalAssets",
  }) as { data: bigint | undefined; refetch: () => void };

  // Morpho vault shares held by RiseFi - read from Morpho vault
  const { data: morphoSharesBalance, refetch: refetchMorphoShares } =
    useReadContract({
      address: MORPHO_VAULT_ADDRESS,
      abi: [
        {
          name: "balanceOf",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: "account", type: "address" }],
          outputs: [{ name: "", type: "uint256" }],
        },
      ],
      functionName: "balanceOf",
      args: [VAULT_ADDRESS],
    }) as { data: bigint | undefined; refetch: () => void };

  // Calculate effective shares (total supply minus dead shares)
  const effectiveShares =
    totalSupply && deadShares ? totalSupply - deadShares : BigInt(0);

  // Calculate share price (corrected calculation)
  // Normalize units: totalAssets (6 decimals) / effectiveShares (18 decimals)
  // To get price per share in USDC, we need to multiply by 10^12
  const sharePrice =
    totalAssets && effectiveShares && effectiveShares > 0
      ? (Number(totalAssets) * 10 ** 12) / Number(effectiveShares)
      : 1;

  // Use the same APY as dashboard (from Morpho API)
  const [apy, setApy] = useState<number | null>(null);
  const [apyLoading, setApyLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-refresh function
  const refreshData = useCallback(() => {
    setIsRefreshing(true);

    // Refresh all contract data
    refetchTotalSupply?.();
    refetchTotalAssets?.();
    refetchMorphoShares?.();
    refetchPauseStatus?.();

    // Refresh APY data
    const fetchApy = async () => {
      try {
        const query = `
          query {
            vaultByAddress(
              address: "${MORPHO_VAULT_APY_ADDRESS}"
              chainId: 8453
            ) {
              address
              state {
                netApy
                apy
              }
            }
          }
        `;
        const response = await fetch("https://api.morpho.org/graphql", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });
        const data = await response.json();
        const vault = data?.data?.vaultByAddress;
        const netApy = vault?.state?.netApy ?? vault?.state?.apy;
        if (typeof netApy === "number") {
          setApy(netApy);
        } else {
          setApy(null);
        }
      } catch {
        setApy(null);
      } finally {
        setIsRefreshing(false);
      }
    };

    fetchApy();
    setLastRefresh(new Date());
  }, [
    refetchTotalSupply,
    refetchTotalAssets,
    refetchMorphoShares,
    refetchPauseStatus,
  ]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, [refreshData]);

  // Fetch APY from Morpho API (same as dashboard)
  useEffect(() => {
    const fetchApy = async () => {
      setApyLoading(true);
      try {
        const query = `
          query {
            vaultByAddress(
              address: "${MORPHO_VAULT_APY_ADDRESS}"
              chainId: 8453
            ) {
              address
              state {
                netApy
                apy
              }
            }
          }
        `;
        const response = await fetch("https://api.morpho.org/graphql", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });
        const data = await response.json();
        const vault = data?.data?.vaultByAddress;
        const netApy = vault?.state?.netApy ?? vault?.state?.apy;
        if (typeof netApy === "number") {
          setApy(netApy);
        } else {
          setApy(null);
        }
      } catch {
        setApy(null);
      } finally {
        setApyLoading(false);
      }
    };

    fetchApy();
  }, []);

  return (
    <div className="w-full p-6 rounded-2xl bg-gray-900/90 border border-[#f5c249] shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#f5c249]">
          RiseFi Vault Information
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            Last refresh: {lastRefresh.toLocaleTimeString()}
          </span>
          <button
            onClick={refreshData}
            disabled={isRefreshing}
            className={`p-2 transition-colors ${
              isRefreshing
                ? "text-[#f5c249] cursor-not-allowed"
                : "text-gray-400 hover:text-[#f5c249]"
            }`}
            title={isRefreshing ? "Refreshing..." : "Refresh data"}
          >
            <svg
              className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Status Banner */}
      <div
        className={`mb-6 p-4 rounded-lg border ${
          isPaused
            ? "bg-red-900/20 border-red-500/50"
            : "bg-green-900/20 border-green-500/50"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-gray-300">Vault Status:</span>
          <span
            className={`font-bold ${
              isPaused ? "text-red-400" : "text-green-400"
            }`}
          >
            {isPaused
              ? "PAUSED - Deposits disabled, withdrawals available"
              : "ACTIVE - Normal operations"}
          </span>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {/* Total Supply */}
        <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">
            Total Shares Issued
          </h3>
          <div className="text-lg font-mono text-white">
            {totalSupply
              ? `${formatUnits(
                  totalSupply,
                  CONSTANTS.VAULT_SHARES_DECIMALS
                )} rfUSDC`
              : "Loading..."}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Including{" "}
            {deadShares
              ? formatUnits(deadShares, CONSTANTS.VAULT_SHARES_DECIMALS)
              : "0"}{" "}
            dead shares
          </div>
        </div>

        {/* Effective Supply */}
        <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">
            Effective Supply
          </h3>
          <div className="text-lg font-mono text-white">
            {effectiveShares > 0
              ? `${formatUnits(
                  effectiveShares,
                  CONSTANTS.VAULT_SHARES_DECIMALS
                )} rfUSDC`
              : "0 rfUSDC"}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Total supply minus dead shares
          </div>
        </div>

        {/* Total Assets */}
        <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">
            Total Assets
          </h3>
          <div className="text-lg font-mono text-white">
            {totalAssets
              ? `${formatUnits(totalAssets, CONSTANTS.USDC_DECIMALS)} USDC`
              : "Loading..."}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Value of assets in vault
          </div>
        </div>

        {/* Share Price */}
        <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">
            Share Price (rfUSDC)
          </h3>
          <div className="text-lg font-mono text-white">
            {sharePrice ? `$${sharePrice.toFixed(6)}` : "Loading..."}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Current value per share
          </div>
        </div>

        {/* Current APY */}
        <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">
            Current APY
          </h3>
          <div className="flex items-center gap-2">
            <div className="text-lg font-mono text-white">
              {apyLoading
                ? "...%"
                : apy !== null
                ? `${(apy * 100).toFixed(2)}%`
                : "-"}
            </div>
            <Link
              href="/academy?section=understanding-apy"
              className="group relative"
            >
              <svg
                className="w-4 h-4 text-gray-400 hover:text-[#f5c249] transition-colors cursor-help"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                What is APY? Learn more
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </div>
            </Link>
          </div>
          <div className="text-xs text-gray-500 mt-1">From Morpho vault</div>
          <div className="text-xs text-gray-600 mt-1">
            APY Address: {MORPHO_VAULT_APY_ADDRESS.slice(0, 8)}...
            {MORPHO_VAULT_APY_ADDRESS.slice(-6)}
          </div>
        </div>

        {/* Morpho Shares */}
        <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">
            Morpho Shares
          </h3>
          <div className="text-lg font-mono text-white">
            {morphoSharesBalance
              ? `${formatUnits(morphoSharesBalance, 18)} shares`
              : "Loading..."}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Shares held by RiseFi in Morpho vault
          </div>
          <div className="text-xs text-gray-600 mt-1">
            Shares Address: {MORPHO_VAULT_ADDRESS.slice(0, 8)}...
            {MORPHO_VAULT_ADDRESS.slice(-6)}
          </div>
        </div>
      </div>

      {/* Configuration Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-[#f5c249] mb-3">
            Configuration
          </h3>

          <div className="flex justify-between">
            <span className="text-gray-400">Min Deposit:</span>
            <span className="text-white font-mono">
              {minDeposit
                ? `${formatUnits(minDeposit, CONSTANTS.USDC_DECIMALS)} USDC`
                : "Loading..."}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">Dead Shares:</span>
            <span className="text-white font-mono">
              {deadShares
                ? formatUnits(deadShares, CONSTANTS.VAULT_SHARES_DECIMALS)
                : "Loading..."}
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

          <div className="flex justify-between">
            <span className="text-gray-400">Basis Points:</span>
            <span className="text-white font-mono">
              {basisPoints ? basisPoints.toString() : "Loading..."}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-[#f5c249] mb-3">
            Addresses
          </h3>

          <div className="flex justify-between">
            <span className="text-gray-400">Dead Address:</span>
            <span className="text-white font-mono text-sm">
              {deadAddress ? deadAddress : "Loading..."}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">Morpho Vault:</span>
            <span className="text-white font-mono text-sm">
              {morphoVault ? morphoVault : "Loading..."}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">RiseFi Vault:</span>
            <span className="text-white font-mono text-sm">
              {VAULT_ADDRESS}
            </span>
          </div>
        </div>
      </div>

      {/* Important Notes */}
      <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">
          Important Notes
        </h3>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• withdraw() function is disabled - use redeem() instead</li>
          <li>• Dead shares prevent inflation attacks on first deposit</li>
          <li>
            • Slippage protection is automatically applied to all operations
          </li>
          <li>• When paused, deposits are disabled but withdrawals work</li>
          <li>• Share price represents current value per vault share</li>
        </ul>
      </div>
    </div>
  );
}

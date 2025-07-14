"use client";

import { useReadContract, useReadContracts } from "wagmi";
import { formatUnits } from "viem";
import { useEffect, useState } from "react";
import { CONTRACTS, ABIS } from "@/utils/contracts";

interface VaultInfoProps {
  className?: string;
}

export default function VaultInfo({ className = "" }: VaultInfoProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  // Lecture des données du RiseFi Vault
  const {
    data: vaultData,
    error: vaultError,
    isLoading: vaultLoading,
  } = useReadContracts({
    contracts: [
      {
        address: CONTRACTS.RISEFI_VAULT as `0x${string}`,
        abi: ABIS.RISEFI_VAULT,
        functionName: "totalAssets",
      },
      {
        address: CONTRACTS.RISEFI_VAULT as `0x${string}`,
        abi: ABIS.RISEFI_VAULT,
        functionName: "totalSupply",
      },
      {
        address: CONTRACTS.RISEFI_VAULT as `0x${string}`,
        abi: ABIS.RISEFI_VAULT,
        functionName: "name",
      },
      {
        address: CONTRACTS.RISEFI_VAULT as `0x${string}`,
        abi: ABIS.RISEFI_VAULT,
        functionName: "symbol",
      },
    ],
    query: {
      refetchInterval: 5000, // Rafraîchir toutes les 5 secondes
      enabled: isMounted, // Seulement après le montage
    },
  });

  // Debug logs (à supprimer en production)
  if (isMounted && vaultError) {
    console.error("Vault data error:", vaultError);
    console.error("Vault address:", CONTRACTS.RISEFI_VAULT);
  }
  if (isMounted && vaultData) {
    console.log("Vault data:", vaultData);
  }
  if (isMounted && vaultLoading) {
    console.log("Vault loading...");
  }

  // Lecture des données du Morpho Vault pour APY
  const {
    data: morphoData,
    error: morphoError,
    isLoading: morphoLoading,
  } = useReadContracts({
    contracts: [
      {
        address: CONTRACTS.MORPHO_VAULT as `0x${string}`,
        abi: ABIS.ERC4626,
        functionName: "totalAssets",
      },
      {
        address: CONTRACTS.MORPHO_VAULT as `0x${string}`,
        abi: ABIS.ERC4626,
        functionName: "totalSupply",
      },
    ],
    query: {
      refetchInterval: 5000,
      enabled: isMounted, // Seulement après le montage
    },
  });

  // Debug logs (à supprimer en production)
  if (isMounted && morphoError) {
    console.error("Morpho data error:", morphoError);
  }
  if (isMounted && morphoData) {
    console.log("Morpho data:", morphoData);
  }

  // Extraction des données avec gestion des erreurs
  const totalAssets = vaultData?.[0]?.result as bigint | undefined;
  const totalSupply = vaultData?.[1]?.result as bigint | undefined;
  const vaultName = vaultData?.[2]?.result as string | undefined;
  const vaultSymbol = vaultData?.[3]?.result as string | undefined;

  const morphoTotalAssets = morphoData?.[0]?.result as bigint | undefined;
  const morphoTotalSupply = morphoData?.[1]?.result as bigint | undefined;

  // Calcul du share price (ratio assets/supply)
  const sharePrice =
    totalAssets && totalSupply && totalSupply > BigInt(0)
      ? Number(formatUnits(totalAssets, 6)) /
        Number(formatUnits(totalSupply, 18))
      : 1.0;

  // Calcul approximatif de l'APY basé sur le Morpho vault
  const morphoSharePrice =
    morphoTotalAssets && morphoTotalSupply && morphoTotalSupply > BigInt(0)
      ? Number(formatUnits(morphoTotalAssets, 6)) /
        Number(formatUnits(morphoTotalSupply, 18))
      : 1.0;

  // APY estimé (placeholder - dans un vrai système, on utiliserait l'API Morpho)
  const estimatedAPY = 5.2; // Placeholder

  if (!isMounted) {
    return (
      <div className={`rounded-lg border p-6 ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Vault Information</h2>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-400">Initializing...</span>
          </div>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-400">Loading vault information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Vault Information</h2>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-gray-400">Live</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Informations de base */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-300 border-b border-gray-600 pb-2">
            Basic Info
          </h3>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Name:</span>
              <span className="font-medium text-white">
                {vaultError ? (
                  <span className="text-red-400">Error</span>
                ) : (
                  vaultName || "Loading..."
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Symbol:</span>
              <span className="font-medium text-white">
                {vaultError ? (
                  <span className="text-red-400">Error</span>
                ) : (
                  vaultSymbol || "Loading..."
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Address:</span>
              <span className="font-mono text-sm text-gray-300">
                {CONTRACTS.RISEFI_VAULT.slice(0, 6)}...
                {CONTRACTS.RISEFI_VAULT.slice(-4)}
              </span>
            </div>
          </div>
        </div>

        {/* Métriques financières */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-300 border-b border-gray-600 pb-2">
            Financial Metrics
          </h3>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Total Assets:</span>
              <span className="font-medium text-white">
                {totalAssets
                  ? `${Number(formatUnits(totalAssets, 6)).toFixed(2)} USDC`
                  : "Loading..."}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Total Supply:</span>
              <span className="font-medium text-white">
                {totalSupply
                  ? `${Number(formatUnits(totalSupply, 18)).toFixed(2)} Shares`
                  : "Loading..."}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Share Price:</span>
              <span className="font-medium text-yellow-400">
                ${sharePrice.toFixed(6)}
              </span>
            </div>
          </div>
        </div>

        {/* Informations de rendement */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-300 border-b border-gray-600 pb-2">
            Yield Information
          </h3>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Estimated APY:</span>
              <span className="font-medium text-green-400">
                {estimatedAPY.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Protocol:</span>
              <span className="font-medium text-white">Morpho Blue</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Asset:</span>
              <span className="font-medium text-white">USDC</span>
            </div>
          </div>
        </div>
      </div>

      {/* Informations Morpho */}
      <div className="mt-6 pt-6 border-t border-gray-600">
        <h3 className="text-lg font-semibold text-gray-300 mb-4">
          Underlying Morpho Vault
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex justify-between">
            <span className="text-gray-400">Morpho Total Assets:</span>
            <span className="font-medium text-white">
              {morphoTotalAssets
                ? `${Number(formatUnits(morphoTotalAssets, 6)).toFixed(2)} USDC`
                : "Loading..."}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Morpho Share Price:</span>
            <span className="font-medium text-yellow-400">
              ${morphoSharePrice.toFixed(6)}
            </span>
          </div>
        </div>
      </div>

      {/* Status et indicateurs */}
      <div className="mt-6 pt-6 border-t border-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-400">Base Network</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm text-gray-400">Morpho Integration</span>
            </div>
          </div>

          <button
            onClick={() =>
              window.open(
                "https://basescan.org/address/" + CONTRACTS.RISEFI_VAULT,
                "_blank"
              )
            }
            className="text-blue-400 hover:text-blue-300 text-sm font-medium"
          >
            View on BaseScan →
          </button>
        </div>
      </div>
    </div>
  );
}

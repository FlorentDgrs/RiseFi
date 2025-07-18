"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { useVaultUserStats } from "@/utils/hooks/useVaultUserStats";
import { parseUnits, formatUnits } from "viem";
import { ABIS, CONTRACTS, CONSTANTS } from "@/utils/contracts";

interface RealYieldData {
  investedAmount: number;
  currentValue: number;
  gains: number;
  gainPercentage: number;
  shares: number;
  totalAssets: number;
  totalSupply: number;
  pricePerShare: number;
  lastUpdate: Date;
}

const VAULT_ADDRESS = CONTRACTS.RISEFI_VAULT;
const VAULT_ABI = ABIS.RISEFI_VAULT;

export default function RealYieldTracker() {
  const { address } = useAccount();
  const stats = useVaultUserStats();
  const [yieldData, setYieldData] = useState<RealYieldData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lectures on-chain optimisées
  const { data: totalAssets } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "totalAssets",
    query: { enabled: !!address, refetchInterval: 5000 }, // Refresh toutes les 5s
  });

  const { data: totalSupply } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "totalSupply",
    query: { enabled: !!address, refetchInterval: 5000 },
  });

  const { data: userShares } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 5000 },
  });

  // Calculer les gains réels
  const calculateRealYield = () => {
    if (
      !address ||
      !stats.investedAmountStr ||
      !totalAssets ||
      !totalSupply ||
      !userShares
    ) {
      return null;
    }

    try {
      const investedAmount = parseFloat(stats.investedAmountStr);
      if (investedAmount <= 0) return null;

      // Convertir les BigInt en nombres
      const totalAssetsNum = parseFloat(
        formatUnits(totalAssets, CONSTANTS.USDC_DECIMALS)
      );
      const totalSupplyNum = parseFloat(formatUnits(totalSupply, 18)); // Shares ont 18 decimals
      const userSharesNum = parseFloat(formatUnits(userShares, 18));

      // Calculer le prix par share
      const pricePerShare =
        totalSupplyNum > 0 ? totalAssetsNum / totalSupplyNum : 0;

      // Calculer la valeur actuelle
      const currentValue = userSharesNum * pricePerShare;
      const gains = currentValue - investedAmount;
      const gainPercentage =
        investedAmount > 0 ? (gains / investedAmount) * 100 : 0;

      return {
        investedAmount,
        currentValue,
        gains,
        gainPercentage,
        shares: userSharesNum,
        totalAssets: totalAssetsNum,
        totalSupply: totalSupplyNum,
        pricePerShare,
        lastUpdate: new Date(),
      };
    } catch (err) {
      console.error("Erreur calcul yield réel:", err);
      setError("Erreur lors du calcul des gains");
      return null;
    }
  };

  // Mettre à jour les données quand les lectures changent
  useEffect(() => {
    if (!address || !stats.investedAmountStr) {
      setYieldData(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const newYieldData = calculateRealYield();
    if (newYieldData) {
      setYieldData(newYieldData);
    }

    setIsLoading(false);
  }, [address, stats.investedAmountStr, totalAssets, totalSupply, userShares]);

  if (
    !address ||
    !stats.investedAmountStr ||
    parseFloat(stats.investedAmountStr) <= 0
  ) {
    return null;
  }

  const formatUSDC = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(amount);
  };

  const formatShares = (shares: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 6,
      maximumFractionDigits: 6,
    }).format(shares);
  };

  return (
    <div className="w-full max-w-md bg-gray-900/90 rounded-2xl p-6 shadow-xl border border-blue-500/30 mx-auto">
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold text-blue-400 mb-2">
          🔗 Yield Réel On-Chain
        </h3>
        <p className="text-gray-400 text-sm">
          Dernière mise à jour: {yieldData?.lastUpdate.toLocaleTimeString()}
        </p>
      </div>

      {isLoading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400 mx-auto"></div>
          <p className="text-gray-400 text-sm mt-2">Lecture on-chain...</p>
        </div>
      )}

      {error && (
        <div className="text-red-400 text-sm text-center mb-4">⚠️ {error}</div>
      )}

      {yieldData && !isLoading && (
        <div className="space-y-4">
          {/* Montant investi */}
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Investi:</span>
            <span className="font-mono text-white">
              {yieldData.investedAmount.toFixed(2)} USDC
            </span>
          </div>

          {/* Valeur actuelle */}
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Valeur actuelle:</span>
            <span className="font-mono text-blue-400 font-bold">
              {formatUSDC(yieldData.currentValue)} USDC
            </span>
          </div>

          {/* Gains */}
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Gains:</span>
            <span
              className={`font-mono font-bold ${
                yieldData.gains >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {yieldData.gains >= 0 ? "+" : ""}
              {formatUSDC(yieldData.gains)} USDC
            </span>
          </div>

          {/* Pourcentage de gains */}
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Rendement:</span>
            <span
              className={`font-mono font-bold ${
                yieldData.gainPercentage >= 0
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {yieldData.gainPercentage >= 0 ? "+" : ""}
              {yieldData.gainPercentage.toFixed(4)}%
            </span>
          </div>

          {/* Détails techniques */}
          <div className="border-t border-gray-700 pt-4 mt-4">
            <h4 className="text-gray-300 font-semibold mb-2">
              Détails techniques:
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Tes shares:</span>
                <span className="font-mono text-gray-300">
                  {formatShares(yieldData.shares)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Prix/share:</span>
                <span className="font-mono text-gray-300">
                  {formatUSDC(yieldData.pricePerShare)} USDC
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total assets:</span>
                <span className="font-mono text-gray-300">
                  {formatUSDC(yieldData.totalAssets)} USDC
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500 mt-4 text-center">
        🔗 Données on-chain • Mise à jour toutes les 5s • 0 gaz
      </div>
    </div>
  );
}

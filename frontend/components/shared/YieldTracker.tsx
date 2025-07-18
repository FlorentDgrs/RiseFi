"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useVaultUserStats } from "@/utils/hooks/useVaultUserStats";
import { parseUnits, formatUnits } from "viem";
import { CONSTANTS } from "@/utils/contracts";

interface YieldData {
  investedAmount: number;
  currentValue: number;
  gains: number;
  gainPercentage: number;
  apy: number;
  timeElapsed: number; // en secondes
}

export default function YieldTracker() {
  const { address } = useAccount();
  const stats = useVaultUserStats();
  const [yieldData, setYieldData] = useState<YieldData | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);

  // APY fixe pour la démo (10% - plus visible pour les tests)
  const DEMO_APY = 0.1;

  // Calculer les gains en temps réel
  const calculateYield = (
    invested: number,
    apy: number,
    timeElapsed: number
  ) => {
    // Formule d'intérêt composé : A = P(1 + r/n)^(nt)
    // Où n = nombre de périodes par an (365 jours * 24h * 3600s = 31,536,000 secondes)
    const periodsPerYear = 31536000;
    const periods = timeElapsed;
    const ratePerPeriod = apy / periodsPerYear;

    const currentValue = invested * Math.pow(1 + ratePerPeriod, periods);
    const gains = currentValue - invested;
    const gainPercentage = invested > 0 ? (gains / invested) * 100 : 0;

    return {
      investedAmount: invested,
      currentValue,
      gains,
      gainPercentage,
      apy,
      timeElapsed,
    };
  };

  // Mettre à jour les données toutes les 0.5 secondes (ultra-rapide)
  useEffect(() => {
    if (!address || !stats.investedAmountStr) return;

    const investedAmount = parseFloat(stats.investedAmountStr);
    if (investedAmount <= 0) return;

    // Initialiser le temps de départ si pas encore fait
    if (startTime === null) {
      setStartTime(Date.now());
      return;
    }

    const updateYield = () => {
      const now = Date.now();
      const timeElapsed = (now - startTime) / 1000; // en secondes

      const newYieldData = calculateYield(
        investedAmount,
        DEMO_APY,
        timeElapsed
      );
      setYieldData(newYieldData);
    };

    // Mise à jour immédiate
    updateYield();

    // Mise à jour toutes les 0.5 secondes (ultra-rapide)
    const interval = setInterval(updateYield, 500);

    return () => clearInterval(interval);
  }, [address, stats.investedAmountStr, startTime]);

  // Reset quand l'utilisateur change
  useEffect(() => {
    setStartTime(null);
    setYieldData(null);
  }, [address]);

  if (!address || !yieldData || yieldData.investedAmount <= 0) {
    return null;
  }

  const formatUSDC = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(amount);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  return (
    <div className="w-full max-w-md bg-gray-900/90 rounded-2xl p-6 shadow-xl border border-green-500/30 mx-auto">
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold text-green-400 mb-2">
          🚀 Yield en Temps Réel
        </h3>
        <p className="text-gray-400 text-sm">
          Temps écoulé: {formatTime(yieldData.timeElapsed)}
        </p>
      </div>

      <div className="space-y-4">
        {/* Montant investi */}
        <div className="flex justify-between items-center">
          <span className="text-gray-300">Investi:</span>
          <span className="font-mono text-white">
            {formatUSDC(yieldData.investedAmount)} USDC
          </span>
        </div>

        {/* Valeur actuelle */}
        <div className="flex justify-between items-center">
          <span className="text-gray-300">Valeur actuelle:</span>
          <span className="font-mono text-green-400 font-bold">
            {formatUSDC(yieldData.currentValue)} USDC
          </span>
        </div>

        {/* Gains */}
        <div className="flex justify-between items-center">
          <span className="text-gray-300">Gains:</span>
          <span className="font-mono text-green-400 font-bold">
            +{formatUSDC(yieldData.gains)} USDC
          </span>
        </div>

        {/* Pourcentage de gains */}
        <div className="flex justify-between items-center">
          <span className="text-gray-300">Rendement:</span>
          <span className="font-mono text-green-400 font-bold">
            +{yieldData.gainPercentage.toFixed(4)}%
          </span>
        </div>

        {/* APY */}
        <div className="flex justify-between items-center">
          <span className="text-gray-300">APY:</span>
          <span className="font-mono text-yellow-400">
            {(yieldData.apy * 100).toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Barre de progression visuelle */}
      <div className="mt-4">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Progression</span>
          <span>{yieldData.gainPercentage.toFixed(4)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-1000"
            style={{
              width: `${Math.min(yieldData.gainPercentage * 10, 100)}%`,
            }}
          ></div>
        </div>
      </div>

      <div className="text-xs text-gray-500 mt-4 text-center">
        ⚡ Mise à jour toutes les 0.5 secondes
      </div>
    </div>
  );
}

import React, { useState, useEffect, useCallback } from "react";
import { parseUnits, formatUnits } from "viem";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { CONTRACTS, ABIS, CONSTANTS } from "../../utils/contracts";

const USDC_DECIMALS = CONSTANTS.USDC_DECIMALS;

export default function VaultActions() {
  const { address, isConnected } = useAccount();
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [currentAction, setCurrentAction] = useState<
    "approve" | "deposit" | "withdraw" | "redeem" | null
  >(null);

  // Hook pour écrire sur le contrat
  const {
    writeContract,
    data: hash,
    isPending,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  // Suivi de la transaction
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  // Lire le solde USDC de l'utilisateur
  const { data: usdcBalance, refetch: refetchUsdcBalance } = useReadContract({
    address: CONTRACTS.USDC,
    abi: ABIS.ERC20,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Lire le solde rfUSDC de l'utilisateur
  const { data: rfUsdcBalance, refetch: refetchRfUsdcBalance } =
    useReadContract({
      address: CONTRACTS.RISEFI_VAULT,
      abi: ABIS.RISEFI_VAULT,
      functionName: "balanceOf",
      args: address ? [address] : undefined,
      query: { enabled: !!address },
    });

  // Lire l'allowance USDC -> vault
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: CONTRACTS.USDC,
    abi: ABIS.ERC20,
    functionName: "allowance",
    args: address ? [address, CONTRACTS.RISEFI_VAULT] : undefined,
    query: { enabled: !!address },
  });

  // Lire les stats du vault
  const { data: totalAssets, refetch: refetchTotalAssets } = useReadContract({
    address: CONTRACTS.RISEFI_VAULT,
    abi: ABIS.RISEFI_VAULT,
    functionName: "totalAssets",
    query: { enabled: !!address },
  });

  const { data: totalSupply, refetch: refetchTotalSupply } = useReadContract({
    address: CONTRACTS.RISEFI_VAULT,
    abi: ABIS.RISEFI_VAULT,
    functionName: "totalSupply",
    query: { enabled: !!address },
  });

  // Lire le montant maximum que l'utilisateur peut retirer
  const { data: maxWithdraw, refetch: refetchMaxWithdraw } = useReadContract({
    address: CONTRACTS.RISEFI_VAULT,
    abi: ABIS.RISEFI_VAULT,
    functionName: "maxWithdraw",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Fonction pour ajouter des logs de debug
  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo((prev) => [...prev.slice(-7), `[${timestamp}] ${message}`]);
    console.log(`[VaultActions] ${message}`);
  };

  // Calculer les valeurs
  const usdcBalanceFormatted = usdcBalance
    ? formatUnits(usdcBalance, USDC_DECIMALS)
    : "0";
  const rfUsdcBalanceFormatted = rfUsdcBalance
    ? formatUnits(rfUsdcBalance, 18)
    : "0";
  const currentAllowance = allowance || BigInt(0);
  const totalAssetsFormatted = totalAssets
    ? formatUnits(totalAssets, USDC_DECIMALS)
    : "0";
  const totalSupplyFormatted = totalSupply ? formatUnits(totalSupply, 18) : "0";

  // Validation des montants
  const depositAmountBN = depositAmount
    ? parseUnits(depositAmount, USDC_DECIMALS)
    : BigInt(0);
  const withdrawAmountBN = withdrawAmount
    ? parseUnits(withdrawAmount, USDC_DECIMALS)
    : BigInt(0);
  const maxUsdcBalance = usdcBalance || BigInt(0);
  // const maxRfUsdcBalance = rfUsdcBalance || BigInt(0); // supprimé car inutilisé

  // Calculer le nombre de shares nécessaires pour le montant à retirer
  const { data: sharesToRedeem, refetch: refetchSharesToRedeem } =
    useReadContract({
      address: CONTRACTS.RISEFI_VAULT,
      abi: ABIS.RISEFI_VAULT,
      functionName: "previewWithdraw",
      args: withdrawAmountBN > BigInt(0) ? [withdrawAmountBN] : undefined,
      query: { enabled: !!address && withdrawAmountBN > BigInt(0) },
    });

  const isDepositValid =
    depositAmountBN > BigInt(0) && depositAmountBN <= maxUsdcBalance;

  // Pour le withdraw, nous devons vérifier que l'utilisateur a suffisamment de shares rfUSDC
  // et que le montant ne dépasse pas maxWithdraw du vault
  const maxWithdrawAmount = maxWithdraw || BigInt(0);
  const isWithdrawValid =
    withdrawAmountBN > BigInt(0) && withdrawAmountBN <= maxWithdrawAmount;
  const needsApproval = isDepositValid && depositAmountBN > currentAllowance;

  // Rafraîchir les données
  const refetchAll = () => {
    refetchUsdcBalance();
    refetchRfUsdcBalance();
    refetchAllowance();
    refetchTotalAssets();
    refetchTotalSupply();
    refetchMaxWithdraw();
    refetchSharesToRedeem();
  };

  // Rafraîchir les statistiques du vault seulement
  const refetchVaultStats = useCallback(() => {
    refetchTotalAssets();
    refetchTotalSupply();
  }, [refetchTotalAssets, refetchTotalSupply]);

  // Rafraîchir les données utilisateur seulement
  const refetchUserData = () => {
    refetchUsdcBalance();
    refetchRfUsdcBalance();
    refetchAllowance();
    refetchMaxWithdraw();
    refetchSharesToRedeem();
  };

  // Handler principal pour le dépôt (gère approve + deposit automatiquement)
  const handleDepositFlow = async () => {
    if (!isDepositValid || !address) {
      addDebugLog("❌ Montant invalide ou wallet non connecté");
      return;
    }

    if (needsApproval) {
      // Étape 1: Approbation
      addDebugLog(`🔄 Début approbation: ${depositAmount} USDC`);
      setStatus("Approbation en cours...");
      setError(null);
      setCurrentAction("approve");

      try {
        writeContract({
          address: CONTRACTS.USDC,
          abi: ABIS.ERC20,
          functionName: "approve",
          args: [CONTRACTS.RISEFI_VAULT, depositAmountBN],
        });
        addDebugLog("📝 Transaction d'approbation envoyée");
      } catch (e: unknown) {
        const errorMsg =
          e instanceof Error
            ? "Erreur lors de l'approbation: " + e.message
            : "Erreur lors de l'approbation inconnue";
        addDebugLog(`❌ ${errorMsg}`);
        setError(errorMsg);
        setCurrentAction(null);
      }
    } else {
      // Étape 2: Dépôt direct (déjà approuvé)
      addDebugLog(`🔄 Début dépôt: ${depositAmount} USDC`);
      setStatus("Dépôt en cours...");
      setError(null);
      setCurrentAction("deposit");

      try {
        writeContract({
          address: CONTRACTS.RISEFI_VAULT,
          abi: ABIS.RISEFI_VAULT,
          functionName: "deposit",
          args: [depositAmountBN, address],
        });
        addDebugLog("📝 Transaction de dépôt envoyée");
      } catch (e: unknown) {
        const errorMsg =
          e instanceof Error
            ? "Erreur lors du dépôt: " + e.message
            : "Erreur lors du dépôt inconnue";
        addDebugLog(`❌ ${errorMsg}`);
        setError(errorMsg);
        setCurrentAction(null);
      }
    }
  };

  // Handler pour withdraw (utilise redeem pour éviter les problèmes de rounding)
  const handleWithdraw = async () => {
    if (!isWithdrawValid || !address) {
      addDebugLog("❌ Montant invalide ou wallet non connecté");
      addDebugLog(`   - withdrawAmountBN: ${withdrawAmountBN.toString()}`);
      addDebugLog(`   - maxWithdrawAmount: ${maxWithdrawAmount.toString()}`);
      addDebugLog(`   - isWithdrawValid: ${isWithdrawValid}`);
      addDebugLog(`   - address: ${address}`);
      return;
    }

    addDebugLog(`🔄 Début retrait: ${withdrawAmount} USDC`);
    addDebugLog(`   - withdrawAmountBN: ${withdrawAmountBN.toString()}`);
    addDebugLog(`   - maxWithdrawAmount: ${maxWithdrawAmount.toString()}`);
    addDebugLog(`   - rfUsdcBalance: ${rfUsdcBalance?.toString() || "0"}`);
    addDebugLog(
      `   - sharesToRedeem: ${sharesToRedeem?.toString() || "calculating..."}`
    );

    // Vérifier que nous avons les shares calculées
    if (!sharesToRedeem) {
      addDebugLog("❌ Impossible de calculer les shares à racheter");
      addDebugLog("🔄 Tentative de rafraîchissement des données...");
      await refetchSharesToRedeem();

      // Attendre un peu et réessayer
      setTimeout(() => {
        if (!sharesToRedeem) {
          setError(
            "Erreur: impossible de calculer les shares à racheter après rafraîchissement"
          );
          addDebugLog(
            "❌ Shares toujours non disponibles après rafraîchissement"
          );
        } else {
          addDebugLog(
            `✅ Shares calculées après rafraîchissement: ${sharesToRedeem.toString()}`
          );
          // Relancer le retrait avec les nouvelles données
          handleWithdraw();
        }
      }, 1000);
      return;
    }

    addDebugLog(`   - sharesToRedeem: ${sharesToRedeem.toString()}`);

    setStatus("Retrait en cours...");
    setError(null);
    setCurrentAction("withdraw");

    try {
      writeContract({
        address: CONTRACTS.RISEFI_VAULT,
        abi: ABIS.RISEFI_VAULT,
        functionName: "redeem",
        args: [sharesToRedeem, address, address],
      });
      addDebugLog("📝 Transaction de retrait (redeem) envoyée");
    } catch (e: unknown) {
      const errorMsg =
        e instanceof Error
          ? "Erreur lors du retrait: " + e.message
          : "Erreur lors du retrait inconnue";
      addDebugLog(`❌ ${errorMsg}`);
      setError(errorMsg);
      setCurrentAction(null);
    }
  };

  // Gérer le succès de la transaction
  useEffect(() => {
    if (isConfirmed && currentAction) {
      addDebugLog(`✅ ${currentAction} confirmé avec succès!`);

      if (currentAction === "approve") {
        // Après approbation réussie, lancer automatiquement le dépôt
        addDebugLog("🔄 Approbation terminée, lancement du dépôt...");
        setStatus("Approbation terminée, dépôt en cours...");

        // Rafraîchir l'allowance puis déposer
        refetchAllowance().then(() => {
          setCurrentAction("deposit");

          // Petit délai pour que l'allowance soit mise à jour
          setTimeout(() => {
            writeContract({
              address: CONTRACTS.RISEFI_VAULT,
              abi: ABIS.RISEFI_VAULT,
              functionName: "deposit",
              args: [depositAmountBN, address!],
            });
            addDebugLog("📝 Transaction de dépôt automatique envoyée");
          }, 500);
        });
      } else {
        // Dépôt ou retrait terminé
        const actionText = currentAction === "deposit" ? "Dépôt" : "Retrait";
        setStatus(`${actionText} confirmé ! 🎉 Mise à jour des données...`);

        // Pour le retrait, ajouter des logs détaillés
        if (currentAction === "withdraw") {
          addDebugLog("🔄 Retrait confirmé - Vérification des étapes...");
          addDebugLog(
            `   - Ancien rfUsdcBalance: ${rfUsdcBalance?.toString() || "0"}`
          );
          addDebugLog(
            `   - Ancien maxWithdraw: ${maxWithdraw?.toString() || "0"}`
          );
          setStatus("Retrait confirmé - Vérification des étapes Morpho...");
        }

        // Rafraîchir immédiatement les statistiques du vault
        addDebugLog("🔄 Rafraîchissement des statistiques du vault...");
        refetchVaultStats();

        // Rafraîchir les données utilisateur
        addDebugLog("🔄 Rafraîchissement des données utilisateur...");
        refetchUserData();

        // Nettoyer les formulaires
        setDepositAmount("");
        setWithdrawAmount("");
        setCurrentAction(null);

        // Rafraîchir toutes les données après un court délai pour s'assurer que tout est synchronisé
        setTimeout(() => {
          addDebugLog("🔄 Rafraîchissement complet après délai...");
          refetchAll();
          setStatus(`${actionText} terminé ! Données mises à jour 🔄`);
        }, 1000);

        // Nettoyer le statut après quelques secondes
        setTimeout(() => {
          setStatus(null);
          resetWrite();
        }, 4000);
      }
    }
  }, [
    isConfirmed,
    currentAction,
    depositAmountBN,
    address,
    writeContract,
    refetchAllowance,
    refetchVaultStats,
    refetchUserData,
    refetchAll,
    resetWrite,
    maxWithdraw,
    rfUsdcBalance,
  ]);

  // Rafraîchissement automatique périodique des statistiques du vault
  useEffect(() => {
    if (!isConnected) return;

    // Rafraîchir les statistiques toutes les 30 secondes
    const interval = setInterval(() => {
      refetchVaultStats();
    }, 30000);

    return () => clearInterval(interval);
  }, [isConnected, refetchVaultStats]);

  // Fonction pour rafraîchir manuellement
  const handleManualRefresh = () => {
    addDebugLog("🔄 Rafraîchissement manuel des données...");
    setStatus("Rafraîchissement des données...");
    refetchAll();
    setTimeout(() => {
      setStatus("Données mises à jour ! 🔄");
      setTimeout(() => setStatus(null), 2000);
    }, 1000);
  };

  // Gérer les erreurs
  useEffect(() => {
    if (writeError) {
      const errorMsg = "Erreur de transaction: " + writeError.message;
      addDebugLog(`❌ ${errorMsg}`);
      setError(errorMsg);
      setCurrentAction(null);
    }
  }, [writeError]);

  // Gérer les changements de hash
  useEffect(() => {
    if (hash) {
      addDebugLog(`📝 Hash reçu: ${hash}`);
    }
  }, [hash]);

  if (!isConnected || !address) {
    return (
      <div className="text-center my-8 text-gray-400">
        Connecte ton wallet pour interagir avec le vault.
      </div>
    );
  }

  // Déterminer le texte du bouton de dépôt
  const getDepositButtonText = () => {
    if (isPending || isConfirming) {
      if (currentAction === "approve") return "Approbation...";
      if (currentAction === "deposit") return "Dépôt...";
      return "En cours...";
    }

    if (needsApproval) {
      return "Approuver & Déposer";
    }
    return "Déposer";
  };

  return (
    <div className="max-w-2xl mx-auto bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-800">
      <h3 className="text-2xl font-bold text-yellow-400 mb-6 text-center">
        💰 RiseFi Vault Actions
      </h3>

      {/* Stats du vault */}
      <div className="mb-6 p-4 bg-gray-800 rounded-lg">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-lg font-semibold text-yellow-400">
            📊 Statistiques du Vault
          </h4>
          <button
            onClick={handleManualRefresh}
            className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1 rounded-md transition-colors duration-200 flex items-center gap-1"
            title="Rafraîchir les données"
          >
            🔄 Actualiser
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Total Assets (USDC):</span>
            <span className="font-mono text-green-400">
              {totalAssetsFormatted}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Total Supply (rfUSDC):</span>
            <span className="font-mono text-green-400">
              {totalSupplyFormatted}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Ton USDC:</span>
            <span className="font-mono text-yellow-300">
              {usdcBalanceFormatted}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Tes rfUSDC:</span>
            <span className="font-mono text-yellow-300">
              {rfUsdcBalanceFormatted}
            </span>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          📡 Rafraîchissement automatique toutes les 30 secondes
        </div>
      </div>

      {/* Section Dépôt */}
      <div className="mb-6 p-4 bg-gray-800 rounded-lg">
        <h4 className="text-lg font-semibold text-green-400 mb-3">
          📥 Déposer USDC
        </h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Montant USDC à déposer
            </label>
            <input
              type="number"
              min="0"
              step="0.000001"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="w-full rounded-lg px-3 py-2 bg-gray-700 text-yellow-200 focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder="Ex: 100"
            />
          </div>

          <button
            onClick={handleDepositFlow}
            disabled={!isDepositValid || isPending || isConfirming}
            className="w-full py-3 rounded-lg bg-green-500 text-white font-bold hover:bg-green-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {getDepositButtonText()}
          </button>

          {needsApproval && (
            <div className="text-xs text-yellow-400 bg-yellow-900/20 p-2 rounded">
              ℹ️ Ce bouton va d&apos;abord approuver, puis déposer
              automatiquement
            </div>
          )}
        </div>
      </div>

      {/* Section Retrait */}
      <div className="mb-6 p-4 bg-gray-800 rounded-lg">
        <h4 className="text-lg font-semibold text-red-400 mb-3">
          📤 Retirer USDC
        </h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Montant USDC à retirer
            </label>
            <input
              type="number"
              min="0"
              step="0.000001"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="w-full rounded-lg px-3 py-2 bg-gray-700 text-yellow-200 focus:outline-none focus:ring-2 focus:ring-red-400"
              placeholder="Ex: 50"
            />
            <div className="text-xs text-gray-400 mt-1">
              Maximum disponible:{" "}
              {maxWithdraw ? formatUnits(maxWithdraw, USDC_DECIMALS) : "0"} USDC
            </div>
          </div>

          <button
            onClick={handleWithdraw}
            disabled={!isWithdrawValid || isPending || isConfirming}
            className="w-full py-3 rounded-lg bg-red-500 text-white font-bold hover:bg-red-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending && currentAction === "withdraw"
              ? "Retrait..."
              : "Retirer"}
          </button>

          {withdrawAmountBN > BigInt(0) &&
            withdrawAmountBN > maxWithdrawAmount && (
              <div className="text-xs text-red-400 bg-red-900/20 p-2 rounded">
                ⚠️ Montant supérieur au maximum disponible (
                {formatUnits(maxWithdrawAmount, USDC_DECIMALS)} USDC)
              </div>
            )}
        </div>
      </div>

      {/* Messages de statut */}
      {isConfirming && (
        <div className="text-center text-blue-400 mb-4">
          ⏳ Confirmation en cours...
        </div>
      )}
      {status && (
        <div className="text-center text-green-400 mb-4">{status}</div>
      )}
      {error && <div className="text-center text-red-400 mb-4">{error}</div>}

      {/* Debug info */}
      {debugInfo.length > 0 && (
        <div className="mt-4 p-3 bg-gray-800 rounded-lg border border-gray-700">
          <h4 className="text-xs font-bold text-yellow-400 mb-2">
            🔧 Debug Logs
          </h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {debugInfo.map((log, index) => (
              <div key={index} className="text-xs text-gray-300 font-mono">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Informations pour MetaMask */}
      <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-yellow-500">
        <h4 className="text-sm font-bold text-yellow-400 mb-2">
          🦊 Ajouter rfUSDC dans MetaMask
        </h4>
        <div className="text-xs text-gray-300 space-y-1">
          <div>
            <strong>Adresse:</strong>{" "}
            <span className="font-mono">{CONTRACTS.RISEFI_VAULT}</span>
          </div>
          <div>
            <strong>Symbole:</strong> rfUSDC
          </div>
          <div>
            <strong>Décimales:</strong> 18
          </div>
        </div>
      </div>

      {/* Aide */}
      <div className="mt-4 text-xs text-gray-400">
        <p>
          <b>Comment ça marche ?</b>
          <br />
          💰 <strong>Dépôt:</strong> Un seul clic → Approbation automatique +
          Dépôt
          <br />
          💸 <strong>Retrait:</strong> Échange tes rfUSDC → Récupère tes USDC +
          rendements
          <br />
          📈 <strong>Rendement:</strong> Tes rfUSDC génèrent des intérêts via
          Morpho Blue
        </p>
      </div>
    </div>
  );
}

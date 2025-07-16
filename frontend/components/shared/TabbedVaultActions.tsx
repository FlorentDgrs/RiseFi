"use client";

import { useState } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { formatUnits, parseUnits } from "viem";
import { CONTRACTS, ABIS } from "../../utils/contracts";

// Constantes
const USDC_DECIMALS = 6;
const SHARE_DECIMALS = 18;

export default function TabbedVaultActions() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentAction, setCurrentAction] = useState<
    "approve" | "deposit" | "withdraw" | null
  >(null);

  // Lire les données du vault
  const { data: totalAssets, refetch: refetchTotalAssets } = useReadContract({
    address: CONTRACTS.RISEFI_VAULT,
    abi: ABIS.RISEFI_VAULT,
    functionName: "totalAssets",
  });

  const { data: totalSupply, refetch: refetchTotalSupply } = useReadContract({
    address: CONTRACTS.RISEFI_VAULT,
    abi: ABIS.RISEFI_VAULT,
    functionName: "totalSupply",
  });

  // Lire les données utilisateur
  const { data: usdcBalance, refetch: refetchUsdcBalance } = useReadContract({
    address: CONTRACTS.USDC,
    abi: ABIS.ERC20,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: rfUsdcBalance, refetch: refetchRfUsdcBalance } =
    useReadContract({
      address: CONTRACTS.RISEFI_VAULT,
      abi: ABIS.RISEFI_VAULT,
      functionName: "balanceOf",
      args: address ? [address] : undefined,
      query: { enabled: !!address },
    });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: CONTRACTS.USDC,
    abi: ABIS.ERC20,
    functionName: "allowance",
    args: address ? [address, CONTRACTS.RISEFI_VAULT] : undefined,
    query: { enabled: !!address },
  });

  const { data: maxWithdraw, refetch: refetchMaxWithdraw } = useReadContract({
    address: CONTRACTS.RISEFI_VAULT,
    abi: ABIS.RISEFI_VAULT,
    functionName: "maxWithdraw",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  // Calculer les shares pour le retrait
  const { data: sharesToRedeem, refetch: refetchSharesToRedeem } =
    useReadContract({
      address: CONTRACTS.RISEFI_VAULT,
      abi: ABIS.RISEFI_VAULT,
      functionName: "previewWithdraw",
      args: withdrawAmount
        ? [parseUnits(withdrawAmount, USDC_DECIMALS)]
        : undefined,
      query: { enabled: !!address && !!withdrawAmount },
    });

  // Write contract
  const {
    writeContract,
    data: hash,
    isPending,
    error: writeError,
  } = useWriteContract();
  const { isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  // Formater les données
  const totalAssetsFormatted = totalAssets
    ? formatUnits(totalAssets, USDC_DECIMALS)
    : "0";
  const totalSupplyFormatted = totalSupply
    ? formatUnits(totalSupply, SHARE_DECIMALS)
    : "0";
  const usdcBalanceFormatted = usdcBalance
    ? formatUnits(usdcBalance, USDC_DECIMALS)
    : "0";
  const rfUsdcBalanceFormatted = rfUsdcBalance
    ? formatUnits(rfUsdcBalance, SHARE_DECIMALS)
    : "0";

  // Validation des montants
  const depositAmountBN = depositAmount
    ? parseUnits(depositAmount, USDC_DECIMALS)
    : BigInt(0);
  const withdrawAmountBN = withdrawAmount
    ? parseUnits(withdrawAmount, USDC_DECIMALS)
    : BigInt(0);
  const maxUsdcBalance = usdcBalance || BigInt(0);
  const maxWithdrawAmount = maxWithdraw || BigInt(0);

  const isDepositValid =
    depositAmountBN > BigInt(0) && depositAmountBN <= maxUsdcBalance;
  const isWithdrawValid =
    withdrawAmountBN > BigInt(0) && withdrawAmountBN <= maxWithdrawAmount;
  const needsApproval =
    isDepositValid && depositAmountBN > (allowance || BigInt(0));

  // Rafraîchir les données
  const refetchAll = () => {
    refetchTotalAssets();
    refetchTotalSupply();
    refetchUsdcBalance();
    refetchRfUsdcBalance();
    refetchAllowance();
    refetchMaxWithdraw();
    refetchSharesToRedeem();
  };

  // Handler pour le dépôt
  const handleDeposit = async () => {
    if (!isDepositValid || !address) {
      setError("Montant invalide ou wallet non connecté");
      return;
    }

    if (needsApproval) {
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
      } catch (e: unknown) {
        if (e instanceof Error) {
          setError("Erreur lors de l'approbation: " + e.message);
        } else {
          setError("Erreur lors de l'approbation inconnue");
        }
        setCurrentAction(null);
      }
    } else {
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
      } catch (e: unknown) {
        if (e instanceof Error) {
          setError("Erreur lors du dépôt: " + e.message);
        } else {
          setError("Erreur lors du dépôt inconnue");
        }
        setCurrentAction(null);
      }
    }
  };

  // Handler pour le retrait
  const handleWithdraw = async () => {
    if (!isWithdrawValid || !address || !sharesToRedeem) {
      setError("Montant invalide ou impossible de calculer les shares");
      return;
    }

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
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError("Erreur lors du retrait: " + e.message);
      } else {
        setError("Erreur lors du retrait inconnue");
      }
      setCurrentAction(null);
    }
  };

  // Gérer le succès de la transaction
  const handleTransactionSuccess = () => {
    if (currentAction === "approve") {
      setStatus("Approbation terminée, dépôt en cours...");
      setCurrentAction("deposit");

      // Lancer le dépôt automatiquement
      setTimeout(() => {
        if (address) {
          writeContract({
            address: CONTRACTS.RISEFI_VAULT,
            abi: ABIS.RISEFI_VAULT,
            functionName: "deposit",
            args: [depositAmountBN, address],
          });
        }
      }, 500);
    } else {
      const actionText = currentAction === "deposit" ? "Dépôt" : "Retrait";
      setStatus(`${actionText} confirmé ! 🎉`);

      // Nettoyer les formulaires
      setDepositAmount("");
      setWithdrawAmount("");
      setCurrentAction(null);

      // Rafraîchir les données
      refetchAll();

      // Nettoyer le statut après quelques secondes
      setTimeout(() => {
        setStatus(null);
      }, 3000);
    }
  };

  // Gérer les erreurs
  const handleTransactionError = () => {
    if (writeError) {
      setError("Erreur de transaction: " + writeError.message);
      setCurrentAction(null);
    }
  };

  // Effets pour gérer les transactions
  if (isConfirmed && currentAction) {
    handleTransactionSuccess();
  }

  if (writeError) {
    handleTransactionError();
  }

  if (!isConnected || !address) {
    return (
      <div className="text-center my-8 text-gray-400">
        Connecte ton wallet pour interagir avec le vault.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-800">
      <h3 className="text-2xl font-bold text-yellow-400 mb-6 text-center">
        💰 RiseFi Vault
      </h3>

      {/* Stats du vault */}
      <div className="mb-6 p-4 bg-gray-800 rounded-lg">
        <h4 className="text-lg font-semibold text-yellow-400 mb-3">
          📊 Statistiques du Vault
        </h4>
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
      </div>

      {/* Onglets */}
      <div className="mb-6">
        <div className="flex bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("deposit")}
            className={`flex-1 py-3 px-6 text-center font-semibold rounded-md transition-all duration-200 ${
              activeTab === "deposit"
                ? "bg-gray-700 text-yellow-400 shadow-sm"
                : "text-gray-400 hover:text-gray-300 hover:bg-gray-700"
            }`}
          >
            Déposer
          </button>
          <button
            onClick={() => setActiveTab("withdraw")}
            className={`flex-1 py-3 px-6 text-center font-semibold rounded-md transition-all duration-200 ${
              activeTab === "withdraw"
                ? "bg-gray-700 text-yellow-400 shadow-sm"
                : "text-gray-400 hover:text-gray-300 hover:bg-gray-700"
            }`}
          >
            Retirer
          </button>
        </div>
      </div>

      {/* Contenu des onglets */}
      {activeTab === "deposit" && (
        <div className="space-y-6">
          {/* Section de dépôt avec design sobre */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center mr-4">
                <span className="text-lg">📥</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-200">
                  Déposer USDC
                </h3>
                <p className="text-sm text-gray-400">
                  Convertir vos USDC en rfUSDC pour commencer à gagner des
                  intérêts
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Montant USDC à déposer
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.000001"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="w-full rounded-lg px-4 py-3 bg-gray-700 text-gray-200 text-lg font-mono focus:outline-none focus:ring-2 focus:ring-yellow-400 border border-gray-600"
                    placeholder="0.00"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                    USDC
                  </div>
                </div>
              </div>

              {/* Balance disponible */}
              <div className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                <span className="text-sm text-gray-400">
                  Balance disponible:
                </span>
                <span className="text-sm font-mono text-yellow-300">
                  {usdcBalanceFormatted} USDC
                </span>
              </div>

              <button
                onClick={handleDeposit}
                disabled={!isDepositValid || isPending}
                className="w-full py-3 rounded-lg bg-yellow-500 text-gray-900 font-semibold text-lg hover:bg-yellow-400 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending
                  ? currentAction === "approve"
                    ? "Approbation en cours..."
                    : "Dépôt en cours..."
                  : needsApproval
                  ? "Approuver & Déposer"
                  : "Déposer USDC"}
              </button>

              {needsApproval && (
                <div className="flex items-center p-3 rounded-lg bg-gray-700 border border-gray-600">
                  <span className="text-yellow-400 mr-2">⚠️</span>
                  <span className="text-sm text-gray-300">
                    Une approbation est nécessaire pour ce montant
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Informations sur le dépôt */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h4 className="text-sm font-semibold text-gray-300 mb-2">
              ℹ️ Informations
            </h4>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Vous recevrez des rfUSDC en échange de vos USDC</li>
              <li>• Les rfUSDC représentent votre part du vault</li>
              <li>• Vous pouvez retirer vos fonds à tout moment</li>
              <li>• Aucun frais de dépôt</li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === "withdraw" && (
        <div className="space-y-6">
          {/* Section de retrait avec design sobre */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center mr-4">
                <span className="text-lg">📤</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-200">
                  Retirer USDC
                </h3>
                <p className="text-sm text-gray-400">
                  Convertir vos rfUSDC en USDC pour récupérer vos fonds
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Montant USDC à retirer
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.000001"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full rounded-lg px-4 py-3 bg-gray-700 text-gray-200 text-lg font-mono focus:outline-none focus:ring-2 focus:ring-yellow-400 border border-gray-600"
                    placeholder="0.00"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                    USDC
                  </div>
                </div>
              </div>

              {/* Balances disponibles */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-700 rounded-lg">
                  <div className="text-xs text-gray-400 mb-1">Vos rfUSDC:</div>
                  <div className="text-sm font-mono text-yellow-300">
                    {rfUsdcBalanceFormatted}
                  </div>
                </div>
                <div className="p-3 bg-gray-700 rounded-lg">
                  <div className="text-xs text-gray-400 mb-1">Retrait max:</div>
                  <div className="text-sm font-mono text-gray-200">
                    {maxWithdrawAmount
                      ? formatUnits(maxWithdrawAmount, USDC_DECIMALS)
                      : "0"}
                  </div>
                </div>
              </div>

              <button
                onClick={handleWithdraw}
                disabled={!isWithdrawValid || isPending}
                className="w-full py-3 rounded-lg bg-yellow-500 text-gray-900 font-semibold text-lg hover:bg-yellow-400 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? "Retrait en cours..." : "Retirer USDC"}
              </button>
            </div>
          </div>

          {/* Informations sur le retrait */}
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h4 className="text-sm font-semibold text-gray-300 mb-2">
              ℹ️ Informations
            </h4>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Vous recevrez des USDC en échange de vos rfUSDC</li>
              <li>• Le montant reçu dépend du prix actuel des parts</li>
              <li>• Retrait instantané (pas de délai d&apos;attente)</li>
              <li>• Aucun frais de retrait</li>
            </ul>
          </div>
        </div>
      )}

      {/* Statut et erreurs */}
      {status && (
        <div className="mt-6 p-4 rounded-xl bg-gray-800 border border-gray-700">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center mr-3">
              <span className="text-yellow-400">⏳</span>
            </div>
            <div>
              <p className="text-gray-200 font-medium">{status}</p>
              <p className="text-xs text-gray-400">Transaction en cours...</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-6 p-4 rounded-xl bg-gray-800 border border-gray-600">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center mr-3">
              <span className="text-gray-400">❌</span>
            </div>
            <div>
              <p className="text-gray-200 font-medium">Erreur</p>
              <p className="text-sm text-gray-400">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Message de succès */}
      {isConfirmed && !currentAction && (
        <div className="mt-6 p-4 rounded-xl bg-gray-800 border border-gray-700">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center mr-3">
              <span className="text-yellow-400">✅</span>
            </div>
            <div>
              <p className="text-gray-200 font-medium">Transaction réussie !</p>
              <p className="text-sm text-gray-400">
                Vos données ont été mises à jour
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

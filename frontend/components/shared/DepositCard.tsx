"use client";

import { useState, useEffect } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseUnits } from "viem";
import { toast } from "sonner";
import { ABIS, CONTRACTS, CONSTANTS } from "@/utils/contracts";

interface DepositCardProps {
  usdcBalanceStr: string;
  refetchStats: () => void;
}

const VAULT_ADDRESS = CONTRACTS.RISEFI_VAULT;
const VAULT_ABI = ABIS.RISEFI_VAULT;
const USDC_ADDRESS = CONTRACTS.USDC;
const USDC_ABI = ABIS.ERC20;

export default function DepositCard({
  usdcBalanceStr,
  refetchStats,
}: DepositCardProps) {
  const { address } = useAccount();
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);
  const [status, setStatus] = useState<
    "idle" | "approving" | "depositing" | "done" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Hydration fix
  useEffect(() => {
    setMounted(true);
  }, []);

  // Allowance pour dépôt
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: "allowance",
    args: address ? [address, VAULT_ADDRESS] : undefined,
    query: { enabled: !!address },
  });

  // Write hooks
  const { writeContractAsync: approveAsync } = useWriteContract();
  const { writeContractAsync: depositAsync } = useWriteContract();

  // Suivi de la confirmation
  const {
    isLoading: isConfirming,
    isSuccess,
    isError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: !!txHash },
  });

  // Console logs pour debug
  useEffect(() => {
    console.log("🔍 DEPOSIT DEBUG - Hook states:", {
      isConfirming,
      isSuccess,
      isError,
      txHash,
      status,
    });
  }, [isConfirming, isSuccess, isError, txHash, status]);

  // Reset après succès ou erreur
  useEffect(() => {
    if (isSuccess) {
      console.log("✅ DEPOSIT SUCCESS - Transaction confirmed!");
      toast.success("Dépôt confirmé !");
      setAmount("");
      setStatus("done");
      setTxHash(undefined);
      refetchAllowance?.();

      // Délai avant refetch
      setTimeout(() => {
        refetchStats();
      }, 3000);

      // Reset visuel après 2s
      setTimeout(() => {
        setStatus("idle");
        setSuccessMsg(null);
      }, 2000);
    }
    if (isError) {
      console.log("❌ DEPOSIT ERROR - Transaction failed on blockchain!");
      const errorMsg =
        "❌ Transaction échouée sur la blockchain. Vérifiez votre solde et réessayez.";
      setError(errorMsg);
      toast.error("Transaction échouée", {
        description:
          "La transaction a échoué sur la blockchain. Cela peut être dû à un solde insuffisant, une validation du contrat, ou un problème de slippage.",
        duration: 8000,
      });
      setStatus("error");
      setTxHash(undefined);
      // Reset visuel après 2s
      setTimeout(() => {
        setStatus("idle");
        setError(null);
      }, 2000);
    }
  }, [isSuccess, isError, refetchStats, refetchAllowance]);

  // Reset status si l'utilisateur modifie l'input
  useEffect(() => {
    if (status !== "idle" && !txHash) {
      setStatus("idle");
      setError(null);
      setSuccessMsg(null);
    }
  }, [amount, status, txHash]);

  // Handler de dépôt principal
  const handleDeposit = async () => {
    setError(null);
    setSuccessMsg(null);

    if (!address || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      const errorMsg = "Veuillez entrer un montant valide";
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    const amountNum = Number(amount);
    if (amountNum <= 1) {
      const errorMsg = "Minimum deposit is > 1 USDC";
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    const amountBN = parseUnits(amount, CONSTANTS.USDC_DECIMALS);
    console.log("💰 DEPOSIT - Amount details:", {
      amount,
      amountBN: amountBN.toString(),
      decimals: CONSTANTS.USDC_DECIMALS,
    });

    try {
      // Approve si nécessaire
      const safeAllowance =
        typeof allowance === "bigint" ? allowance : BigInt(0);

      if (safeAllowance < amountBN) {
        console.log("🔄 DEPOSIT - Starting approval process...");
        setStatus("approving");
        toast("Approbation requise", {
          description: "Signaturez l'approbation USDC dans Metamask.",
        });

        const approveTx = await approveAsync({
          address: USDC_ADDRESS,
          abi: USDC_ABI,
          functionName: "approve",
          args: [VAULT_ADDRESS, amountBN],
        });

        console.log("📝 DEPOSIT - Approval transaction sent:", approveTx);
        setTxHash(approveTx as `0x${string}`);
        toast("Approbation envoyée", {
          description: "En attente de confirmation on-chain...",
        });

        // Attendre la confirmation de l'approbation avec polling
        console.log("⏳ DEPOSIT - Waiting for approval confirmation...");
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Vérifier que l'allowance a été mise à jour
        await refetchAllowance?.();
        const updatedAllowance = await refetchAllowance?.();
        console.log("🔍 DEPOSIT - Allowance after approval:", {
          oldAllowance: safeAllowance.toString(),
          newAllowance: updatedAllowance?.data?.toString(),
          required: amountBN.toString(),
        });

        // Attendre encore si nécessaire
        if (updatedAllowance?.data && updatedAllowance.data < amountBN) {
          console.log(
            "⏳ DEPOSIT - Allowance not updated yet, waiting more..."
          );
          await new Promise((resolve) => setTimeout(resolve, 2000));
          await refetchAllowance?.();
        }
      }

      // Vérification finale avant dépôt
      const finalAllowanceCheck = await refetchAllowance?.();
      console.log("🔍 DEPOSIT - Final allowance check:", {
        allowance: finalAllowanceCheck?.data?.toString(),
        required: amountBN.toString(),
      });

      if (finalAllowanceCheck?.data && finalAllowanceCheck.data < amountBN) {
        throw new Error(
          "Allowance insuffisante après approbation. Veuillez réessayer."
        );
      }

      // Procéder au dépôt
      console.log("💰 DEPOSIT - Starting deposit process...");
      console.log("🔍 DEPOSIT - Vault state before deposit:", {
        userBalance: usdcBalanceStr,
        amountToDeposit: amount,
        amountBN: amountBN.toString(),
        userAddress: address,
      });

      setStatus("depositing");
      toast("Dépôt en cours", {
        description: "Signaturez le dépôt dans Metamask.",
      });

      const depositTx = await depositAsync({
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: "deposit",
        args: [amountBN, address],
      });

      console.log("📝 DEPOSIT - Deposit transaction sent:", depositTx);
      setTxHash(depositTx as `0x${string}`);
      toast("Transaction envoyée", {
        description: "En attente de confirmation on-chain...",
      });
    } catch (e: any) {
      console.log("💥 DEPOSIT - Error caught in handler:", e);
      console.log("💥 DEPOSIT - Error details:", {
        message: e?.message,
        shortMessage: e?.shortMessage,
        reason: e?.reason,
        code: e?.code,
        data: e?.data,
        error: e?.error,
        cause: e?.cause,
        stack: e?.stack,
      });

      // Gestion détaillée des erreurs
      let errorMessage = "Erreur lors du dépôt";

      if (e?.message) {
        errorMessage = e.message;
      } else if (e?.shortMessage) {
        errorMessage = e.shortMessage;
      } else if (e?.reason) {
        errorMessage = e.reason;
      } else if (typeof e === "string") {
        errorMessage = e;
      }

      console.log("💥 DEPOSIT - Final error message:", errorMessage);
      setStatus("error");
      setError(`❌ ${errorMessage}`);
      setTxHash(undefined);

      // Toast d'erreur
      toast.error("Erreur lors du dépôt", {
        description: errorMessage,
        duration: 5000,
      });
    }
  };

  // UI
  if (!mounted) return null;

  return (
    <div className="w-full max-w-sm mx-auto p-6 rounded-2xl bg-gray-900/90 border border-[#f5c249] shadow-xl">
      <h3 className="text-lg font-bold text-[#f5c249] mb-4">Dépôt</h3>

      {/* Input */}
      <div className="flex flex-col gap-3">
        <label htmlFor="depositAmount" className="text-sm text-gray-300">
          Montant :
        </label>
        <div className="flex gap-2">
          <input
            id="depositAmount"
            type="number"
            step="any"
            min="1.000001"
            placeholder="100"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={!address || (status !== "idle" && status !== "done")}
            className="flex-1 bg-gray-900 text-white border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-[#f5c249] transition font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            type="button"
            onClick={() => setAmount(Number(usdcBalanceStr).toFixed(2))}
            disabled={!address || (status !== "idle" && status !== "done")}
            className="bg-gray-700 hover:bg-gray-600 text-[#f5c249] font-bold py-2 px-3 rounded-lg transition duration-200 disabled:opacity-50"
          >
            MAX
          </button>
        </div>

        {/* Infos contextuelles */}
        <div className="flex flex-col gap-1 text-xs text-gray-400 font-mono">
          <span>
            Solde USDC :{" "}
            <span className="text-[#f5c249]">{usdcBalanceStr}</span>
          </span>
          <span className="text-gray-500">Min: &gt; 1 USDC</span>
        </div>

        {/* Bouton principal */}
        <button
          onClick={handleDeposit}
          disabled={!address || (status !== "idle" && status !== "done")}
          className="bg-[#f5c249] hover:bg-[#e6b142] text-gray-900 font-bold py-2 rounded-xl transition disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
        >
          {/* Spinner pendant transaction */}
          {(status === "approving" ||
            status === "depositing" ||
            isConfirming) && (
            <>
              {console.log(
                "🔄 DEPOSIT - Spinner is showing! Status:",
                status,
                "isConfirming:",
                isConfirming
              )}
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </>
          )}

          {status === "approving"
            ? "Approbation en cours..."
            : status === "depositing"
            ? "Dépôt en cours..."
            : isConfirming
            ? "Confirmation blockchain..."
            : "Déposer"}
        </button>

        {/* Feedback transaction */}
        {txHash && (
          <>
            {console.log("📝 DEPOSIT - Transaction hash is displayed:", txHash)}
            <div className="text-xs text-gray-400 break-all bg-gray-800 p-2 rounded">
              <span className="font-semibold">Transaction :</span> {txHash}
            </div>
          </>
        )}

        {/* Feedback erreur/succès visuel */}
        {error && (
          <div className="text-red-400 text-sm font-medium bg-red-900/20 border border-red-500/30 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </div>
          </div>
        )}
        {successMsg && (
          <div className="text-green-400 text-sm font-medium bg-green-900/20 border border-green-500/30 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              {successMsg}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

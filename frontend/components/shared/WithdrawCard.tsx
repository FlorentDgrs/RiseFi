"use client";

import { useState, useEffect } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseUnits } from "viem";
import { toast } from "sonner";
import { ABIS, CONTRACTS, CONSTANTS } from "@/utils/contracts";

interface WithdrawCardProps {
  maxWithdrawStr: string;
  refetchStats: () => void;
}

const VAULT_ADDRESS = CONTRACTS.RISEFI_VAULT;
const VAULT_ABI = ABIS.RISEFI_VAULT;

export default function WithdrawCard({
  maxWithdrawStr,
  refetchStats,
}: WithdrawCardProps) {
  const { address } = useAccount();
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);
  const [status, setStatus] = useState<
    "idle" | "withdrawing" | "done" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Hydration fix
  useEffect(() => {
    setMounted(true);
  }, []);

  // Write hooks
  const { writeContractAsync: redeemAsync } = useWriteContract();

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
    console.log("🔍 WITHDRAW DEBUG - Hook states:", {
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
      console.log("✅ WITHDRAW SUCCESS - Transaction confirmed!");
      setSuccessMsg("✅ Retrait confirmé !");
      toast.success("Retrait confirmé !");
      setAmount("");
      setStatus("done");
      setTxHash(undefined);

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
      console.log("❌ WITHDRAW ERROR - Transaction failed on blockchain!");
      setError("❌ Transaction échouée ou annulée");
      toast.error("Erreur lors de la transaction !");
      setStatus("error");
      setTxHash(undefined);
      // Reset visuel après 2s
      setTimeout(() => {
        setStatus("idle");
        setError(null);
      }, 2000);
    }
  }, [isSuccess, isError, refetchStats]);

  // Reset status si l'utilisateur modifie l'input
  useEffect(() => {
    if (status !== "idle" && !txHash) {
      setStatus("idle");
      setError(null);
      setSuccessMsg(null);
    }
  }, [amount, status, txHash]);

  // Handler de retrait
  const handleWithdraw = async () => {
    setError(null);
    setSuccessMsg(null);

    if (!address || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError("Veuillez entrer un montant valide");
      return;
    }

    const amountNum = Number(amount);
    if (amountNum <= 0.001) {
      setError("Minimum withdrawal is > 0.001 USDC");
      return;
    }

    const amountBN = parseUnits(amount, CONSTANTS.USDC_DECIMALS);
    console.log("💰 WITHDRAW - Amount details:", {
      amount,
      amountBN: amountBN.toString(),
      decimals: CONSTANTS.USDC_DECIMALS,
    });

    try {
      console.log("💰 WITHDRAW - Starting withdraw process...");
      setStatus("withdrawing");
      toast("Retrait en cours", {
        description: "Signaturez le retrait dans Metamask.",
      });

      const redeemTx = await redeemAsync({
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: "redeem",
        args: [amountBN, address, address],
      });

      console.log("📝 WITHDRAW - Withdraw transaction sent:", redeemTx);
      setTxHash(redeemTx as `0x${string}`);
      toast("Transaction envoyée", {
        description: "En attente de confirmation on-chain...",
      });
    } catch (e: any) {
      console.log("💥 WITHDRAW - Error caught in handler:", e);
      console.log("💥 WITHDRAW - Error details:", {
        message: e?.message,
        shortMessage: e?.shortMessage,
        reason: e?.reason,
        code: e?.code,
        data: e?.data,
        error: e?.error,
      });

      setStatus("error");
      setError(e?.message || "Erreur lors du retrait");
      setTxHash(undefined);
      toast.error("Erreur lors du retrait", { description: e?.message });
    }
  };

  // UI
  if (!mounted) return null;

  return (
    <div className="w-full max-w-sm mx-auto p-6 rounded-2xl bg-gray-900/90 border border-[#f5c249] shadow-xl">
      <h3 className="text-lg font-bold text-[#f5c249] mb-4">Retrait</h3>

      {/* Input */}
      <div className="flex flex-col gap-3">
        <label htmlFor="withdrawAmount" className="text-sm text-gray-300">
          Montant :
        </label>
        <div className="flex gap-2">
          <input
            id="withdrawAmount"
            type="number"
            step="any"
            min="0.001001"
            placeholder="100"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={!address || (status !== "idle" && status !== "done")}
            className="flex-1 bg-gray-900 text-white border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-[#f5c249] transition font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            type="button"
            onClick={() => setAmount(Number(maxWithdrawStr).toFixed(2))}
            disabled={!address || (status !== "idle" && status !== "done")}
            className="bg-gray-700 hover:bg-gray-600 text-[#f5c249] font-bold py-2 px-3 rounded-lg transition duration-200 disabled:opacity-50"
          >
            MAX
          </button>
        </div>

        {/* Infos contextuelles */}
        <div className="flex flex-col gap-1 text-xs text-gray-400 font-mono">
          <span>
            Max withdraw :{" "}
            <span className="text-[#f5c249]">{maxWithdrawStr}</span>
          </span>
          <span className="text-gray-500">Min: &gt; 0.001 USDC</span>
        </div>

        {/* Bouton principal */}
        <button
          onClick={handleWithdraw}
          disabled={!address || (status !== "idle" && status !== "done")}
          className="bg-[#f5c249] hover:bg-[#e6b142] text-gray-900 font-bold py-2 rounded-xl transition disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
        >
          {/* Spinner pendant transaction */}
          {(status === "withdrawing" || isConfirming) && (
            <>
              {console.log(
                "🔄 WITHDRAW - Spinner is showing! Status:",
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

          {status === "withdrawing"
            ? "Retrait en cours..."
            : isConfirming
            ? "Confirmation blockchain..."
            : "Retirer"}
        </button>

        {/* Feedback transaction */}
        {txHash && (
          <>
            {console.log(
              "📝 WITHDRAW - Transaction hash is displayed:",
              txHash
            )}
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

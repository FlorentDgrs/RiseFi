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

interface ActionCardV2Props {
  usdcBalanceStr: string;
  maxWithdrawStr: string;
  investedAmountStr: string;
  refetchStats: () => void;
}

const VAULT_ADDRESS = CONTRACTS.RISEFI_VAULT;
const VAULT_ABI = ABIS.RISEFI_VAULT;
const USDC_ADDRESS = CONTRACTS.USDC;
const USDC_ABI = ABIS.ERC20;

export default function ActionCardV2({
  usdcBalanceStr,
  maxWithdrawStr,
  investedAmountStr,
  refetchStats,
}: ActionCardV2Props) {
  const { address } = useAccount();
  const [tab, setTab] = useState<"deposit" | "withdraw">("deposit");
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);
  const [status, setStatus] = useState<
    "idle" | "approving" | "depositing" | "withdrawing" | "done" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false); // Pour éviter l'hydratation SSR

  // Reset du state lors du changement de tab (SANS refetch automatique)
  useEffect(() => {
    setStatus("idle");
    setError(null);
    setSuccessMsg(null);
    setTxHash(undefined);
    setAmount("");
    // Suppression du refetch automatique pour éviter la désynchronisation
  }, [tab]);

  // Hydration fix: n'afficher le composant qu'après le montage côté client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Allowance (pour dépôt)
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: "allowance",
    args: address ? [address, VAULT_ADDRESS] : undefined,
    query: { enabled: !!address && tab === "deposit" },
  });

  // Write hooks
  const { writeContractAsync: approveAsync } = useWriteContract();
  const { writeContractAsync: depositAsync } = useWriteContract();
  const { writeContractAsync: redeemAsync } = useWriteContract();

  // Suivi de la confirmation (pour withdraw et deposit)
  const {
    isLoading: isConfirming,
    isSuccess,
    isError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: !!txHash },
  });

  // Reset status/txHash après succès ou erreur (UX fluide)
  useEffect(() => {
    if (isSuccess) {
      setSuccessMsg(
        tab === "deposit" ? "✅ Dépôt confirmé !" : "✅ Retrait confirmé !"
      );
      toast.success(
        tab === "deposit" ? "Dépôt confirmé !" : "Retrait confirmé !"
      );
      setAmount("");
      setStatus("done");
      setTxHash(undefined);
      refetchAllowance?.();

      // Délai avant refetch pour laisser la blockchain se synchroniser
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
  }, [isSuccess, isError, tab, refetchStats, refetchAllowance]);

  // Reset status si l'utilisateur modifie l'input (UX fluide)
  // MAIS seulement si aucune transaction n'est en cours
  useEffect(() => {
    if (status !== "idle" && !txHash) {
      setStatus("idle");
      setError(null);
      setSuccessMsg(null);
    }
  }, [amount, tab, status, txHash]);

  // Handler principal
  const handleAction = async () => {
    setError(null);
    setSuccessMsg(null);
    if (!address || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError("Veuillez entrer un montant valide");
      return;
    }
    const amountNum = Number(amount);
    if (tab === "deposit" && amountNum <= 1) {
      setError("Minimum deposit is > 1 USDC");
      return;
    }
    if (tab === "withdraw" && amountNum <= 0.001) {
      setError("Minimum withdrawal is > 0.001 USDC");
      return;
    }
    const amountBN = parseUnits(amount, CONSTANTS.USDC_DECIMALS);
    if (tab === "deposit") {
      // Approve si nécessaire
      const safeAllowance =
        typeof allowance === "bigint" ? allowance : BigInt(0);
      try {
        if (safeAllowance < amountBN) {
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
          setTxHash(approveTx as `0x${string}`);
          toast("Approbation envoyée", {
            description: "En attente de confirmation on-chain...",
          });
          // Attendre la confirmation de l'approbation avant de continuer
          await new Promise((resolve) => setTimeout(resolve, 2000));
          await refetchAllowance?.();
        }
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
        setTxHash(depositTx as `0x${string}`);
        toast("Transaction envoyée", {
          description: "En attente de confirmation on-chain...",
        });
      } catch (e: any) {
        setStatus("error");
        setError(e?.message || "Erreur lors du dépôt");
        setTxHash(undefined);
        toast.error("Erreur lors du dépôt", { description: e?.message });
      }
    } else {
      // Retrait (redeem)
      try {
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
        setTxHash(redeemTx as `0x${string}`);
        toast("Transaction envoyée", {
          description: "En attente de confirmation on-chain...",
        });
      } catch (e: any) {
        setStatus("error");
        setError(e?.message || "Erreur lors du retrait");
        setTxHash(undefined);
        toast.error("Erreur lors du retrait", { description: e?.message });
      }
    }
  };

  // UI (rendu seulement après montage pour éviter l'hydratation)
  if (!mounted) return null;

  return (
    <div className="w-full max-w-sm mx-auto p-6 rounded-2xl bg-gray-900/90 border border-[#f5c249] shadow-xl">
      {/* Tabs */}
      <div className="flex mb-6">
        <button
          className={`flex-1 py-3 transition text-sm font-medium
            ${
              tab === "deposit"
                ? "text-[#f5c249] font-bold border-b-2 border-[#f5c249]"
                : "text-gray-400 hover:text-gray-300"
            }
          `}
          onClick={() => setTab("deposit")}
          disabled={status !== "idle" && status !== "done"}
        >
          Dépôt
        </button>
        <button
          className={`flex-1 py-3 transition text-sm font-medium
            ${
              tab === "withdraw"
                ? "text-[#f5c249] font-bold border-b-2 border-[#f5c249]"
                : "text-gray-400 hover:text-gray-300"
            }
          `}
          onClick={() => setTab("withdraw")}
          disabled={status !== "idle" && status !== "done"}
        >
          Retrait
        </button>
      </div>
      {/* Input */}
      <div className="flex flex-col gap-3">
        <label htmlFor="actionAmount" className="text-sm text-gray-300">
          Montant :
        </label>
        <div className="flex gap-2">
          <input
            id={`actionAmount-${tab}`}
            type="number"
            step="any"
            min={tab === "deposit" ? "1.000001" : "0.001001"}
            placeholder="100"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={!address || (status !== "idle" && status !== "done")}
            className="flex-1 bg-gray-900 text-white border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-[#f5c249] transition font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            type="button"
            onClick={() => {
              if (tab === "deposit")
                setAmount(Number(usdcBalanceStr).toFixed(2));
              else setAmount(Number(maxWithdrawStr).toFixed(2));
            }}
            disabled={!address || (status !== "idle" && status !== "done")}
            className="bg-gray-700 hover:bg-gray-600 text-[#f5c249] font-bold py-2 px-3 rounded-lg transition duration-200 disabled:opacity-50"
          >
            MAX
          </button>
        </div>
        {/* Infos contextuelles */}
        <div className="flex flex-col gap-1 text-xs text-gray-400 font-mono">
          {tab === "deposit" ? (
            <span>
              Solde USDC :{" "}
              <span className="text-[#f5c249]">{usdcBalanceStr}</span>
              <span className="block text-gray-500">Min: &gt; 1 USDC</span>
            </span>
          ) : (
            <span>
              Max withdraw :{" "}
              <span className="text-[#f5c249]">{maxWithdrawStr}</span>
              <span className="block text-gray-500">Min: &gt; 0.001 USDC</span>
            </span>
          )}
        </div>
        {/* Bouton principal */}
        <button
          onClick={handleAction}
          disabled={!address || (status !== "idle" && status !== "done")}
          className={`font-bold py-2 rounded-xl transition disabled:opacity-50 mt-2
            ${
              tab === "deposit"
                ? "bg-[#f5c249] hover:bg-[#e6b142] text-gray-900"
                : "bg-[#f5c249] hover:bg-[#e6b142] text-gray-900"
            }
          `}
        >
          {status === "approving"
            ? "Approbation..."
            : status === "depositing"
            ? "Dépôt en cours..."
            : status === "withdrawing"
            ? "Retrait en cours..."
            : isConfirming
            ? "Confirmation blockchain..."
            : tab === "deposit"
            ? "Déposer"
            : "Retirer"}
        </button>
        {/* Feedback transaction */}
        {txHash && (
          <div className="text-xs text-gray-400 break-all">Tx: {txHash}</div>
        )}
        {/* Feedback erreur/succès visuel */}
        {error && (
          <div className="text-red-400 text-sm font-medium">{error}</div>
        )}
        {successMsg && (
          <div className="text-green-400 text-sm font-medium">{successMsg}</div>
        )}
      </div>
    </div>
  );
}

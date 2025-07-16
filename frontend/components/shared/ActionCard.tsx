"use client";

import { useState, useEffect } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import { parseUnits } from "viem";
import { ABIS, CONTRACTS, CONSTANTS } from "@/utils/contracts";

interface ActionCardProps {
  usdcBalanceStr: string;
  maxWithdrawStr: string;
  refetchStats: () => void;
}

const VAULT_ADDRESS = CONTRACTS.RISEFI_VAULT;
const VAULT_ABI = ABIS.RISEFI_VAULT;
const USDC_ADDRESS = CONTRACTS.USDC;
const USDC_ABI = ABIS.ERC20;

export default function ActionCard({
  usdcBalanceStr,
  maxWithdrawStr,
  refetchStats,
}: ActionCardProps) {
  const { address } = useAccount();
  const [tab, setTab] = useState<"deposit" | "withdraw">("deposit");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<
    "idle" | "approving" | "depositing" | "withdrawing" | "done" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);

  // Functions to handle MAX button
  const handleMaxDeposit = () => {
    const balance = parseFloat(usdcBalanceStr);
    if (!isNaN(balance) && balance > 0) {
      setAmount(balance.toString());
    }
  };

  const handleMaxWithdraw = () => {
    const maxWithdraw = parseFloat(maxWithdrawStr);
    if (!isNaN(maxWithdraw) && maxWithdraw > 0) {
      setAmount(maxWithdraw.toString());
    }
  };

  // Allowance (pour dépôt)
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: "allowance",
    args: address ? [address, VAULT_ADDRESS] : undefined,
    query: { enabled: !!address && tab === "deposit" },
  });

  // Write hooks
  const { writeContract: writeApprove } = useWriteContract();
  const { writeContract: writeDeposit } = useWriteContract();
  const { writeContract: writeWithdraw } = useWriteContract();

  // Suivi de la confirmation (pour withdraw et deposit)
  const {
    isLoading: isConfirming,
    isSuccess,
    error: errorConfirmation,
  } = useWaitForTransactionReceipt({
    hash: txHash as `0x${string}` | undefined,
  });

  // Rafraîchir les stats et reset l'input après succès
  useEffect(() => {
    if (isSuccess) {
      console.log("Transaction successful, refetching stats...");
      refetchStats();
      setAmount("");
      setStatus("done");
      setTxHash(undefined); // Reset txHash
    }
  }, [isSuccess, refetchStats]);

  // Gérer les erreurs de confirmation
  useEffect(() => {
    if (errorConfirmation) {
      console.log("Transaction failed:", errorConfirmation);
      setStatus("error");
      setError(
        `Transaction failed: ${
          (errorConfirmation as any).shortMessage || errorConfirmation.message
        }`
      );
      setTxHash(undefined); // Reset txHash
    }
  }, [errorConfirmation]);

  // Handler principal
  const handleAction = async () => {
    setError(null);
    setStatus("idle");
    if (!address || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError("Please enter a valid positive number");
      return;
    }

    // Validation des minimums
    const amountNum = Number(amount);
    if (tab === "deposit" && amountNum <= 1) {
      setError("Minimum deposit is > 1 USDC");
      return;
    }

    // Pour les retraits, on vérifie qu'il y a strictement plus de 0.001 USDC (pour éviter les dust amounts)
    if (tab === "withdraw" && amountNum <= 0.001) {
      setError("Minimum withdrawal is > 0.001 USDC");
      return;
    }

    const amountBN = parseUnits(amount, CONSTANTS.USDC_DECIMALS);
    if (tab === "deposit") {
      // Dépôt avec auto-approve si nécessaire
      const safeAllowance =
        typeof allowance === "bigint" ? allowance : BigInt(0);
      try {
        if (safeAllowance < amountBN) {
          setStatus("approving");
          await writeApprove({
            address: USDC_ADDRESS,
            abi: USDC_ABI,
            functionName: "approve",
            args: [VAULT_ADDRESS, amountBN],
          });
          await new Promise((resolve) => setTimeout(resolve, 2000));
          await refetchAllowance?.();
        }
        setStatus("depositing");
        const tx = await writeDeposit({
          address: VAULT_ADDRESS,
          abi: VAULT_ABI,
          functionName: "deposit",
          args: [amountBN, address],
        });
        setTxHash(typeof tx === "string" ? (tx as `0x${string}`) : undefined);
        console.log("Deposit transaction sent:", tx);
        // On attend la confirmation via useWaitForTransactionReceipt
      } catch (e: any) {
        console.error("Deposit error:", e);
        setStatus("error");
        setError(e?.message || "Error during deposit");
        setTxHash(undefined);
      }
    } else {
      // Retrait
      try {
        setStatus("withdrawing");
        const tx = await writeWithdraw({
          address: VAULT_ADDRESS,
          abi: VAULT_ABI,
          functionName: "withdraw",
          args: [amountBN, address, address],
        });
        setTxHash(typeof tx === "string" ? (tx as `0x${string}`) : undefined);
        console.log("Withdraw transaction sent:", tx);
        // On attend la confirmation via useWaitForTransactionReceipt
      } catch (e: any) {
        console.error("Withdraw error:", e);
        setStatus("error");
        setError(e?.message || "Error during withdrawal");
        setTxHash(undefined);
      }
    }
  };

  const isLoading =
    status === "approving" ||
    status === "depositing" ||
    status === "withdrawing" ||
    isConfirming;

  // Reset status to idle after a delay if done
  useEffect(() => {
    if (status === "done") {
      const timer = setTimeout(() => {
        setStatus("idle");
      }, 3000); // Reset after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [status]);

  // UI
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
          disabled={isLoading}
        >
          Deposit
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
          disabled={isLoading}
        >
          Withdraw
        </button>
      </div>
      {/* Input */}
      <div className="flex flex-col gap-3">
        <label htmlFor="actionAmount" className="text-sm text-gray-300">
          Amount:
        </label>
        <div className="flex gap-2">
          <input
            id="actionAmount"
            type="number"
            step="any"
            min={tab === "deposit" ? "1.000001" : "0.001001"}
            placeholder="100"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={!address || isLoading}
            className="flex-1 bg-gray-900 text-white border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-[#f5c249] transition font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            type="button"
            onClick={tab === "deposit" ? handleMaxDeposit : handleMaxWithdraw}
            disabled={!address || isLoading}
            className="bg-gray-700 hover:bg-gray-600 text-[#f5c249] font-bold py-2 px-3 rounded-lg transition duration-200 disabled:opacity-50"
          >
            MAX
          </button>
        </div>
        {/* Contextual info */}
        <div className="flex flex-col gap-1 text-xs text-gray-400 font-mono">
          {tab === "deposit" ? (
            <span>
              USDC balance:{" "}
              <span className="text-[#f5c249]">{usdcBalanceStr}</span>
              <span className="block text-gray-500">Min: &gt; 1 USDC</span>
            </span>
          ) : (
            <span>
              Max withdraw:{" "}
              <span className="text-[#f5c249]">{maxWithdrawStr}</span>
              <span className="block text-gray-500">Min: &gt; 0.001 USDC</span>
            </span>
          )}
        </div>
        {/* Dynamic button */}
        <button
          onClick={handleAction}
          disabled={
            !address ||
            !amount ||
            isLoading ||
            (tab === "deposit" && Number(amount) <= 1) ||
            (tab === "withdraw" && Number(amount) <= 0.001)
          }
          className={`font-bold py-2 rounded-xl transition disabled:opacity-50 mt-2
            ${
              tab === "deposit"
                ? "bg-[#f5c249] hover:bg-[#e6b142] text-gray-900"
                : "bg-[#f5c249] hover:bg-[#e6b142] text-gray-900"
            }
          `}
        >
          {status === "approving" ? (
            "Approving..."
          ) : status === "depositing" ? (
            "Depositing..."
          ) : status === "withdrawing" ? (
            "Withdrawing..."
          ) : isConfirming ? (
            <span className="flex items-center gap-2 justify-center">
              <svg
                className="animate-spin h-4 w-4 text-[#f5c249]"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
              Waiting for confirmation...
            </span>
          ) : tab === "deposit" ? (
            "Deposit"
          ) : (
            "Withdraw"
          )}
        </button>
        {/* Transaction feedback */}
        {txHash && (
          <div className="text-xs text-gray-400 break-all">Tx: {txHash}</div>
        )}
        {/* Error/success feedback */}
        {error && (
          <div className="text-red-400 text-sm font-medium">{error}</div>
        )}
        {isSuccess && status === "done" && !error && (
          <div className="text-green-400 text-sm font-medium">
            {tab === "deposit" ? "Deposit successful!" : "Withdraw successful!"}
          </div>
        )}
        {errorConfirmation && (
          <div className="text-red-400 text-sm font-medium">
            Transaction failed:{" "}
            {(errorConfirmation as any).shortMessage ||
              errorConfirmation.message}
          </div>
        )}
      </div>
    </div>
  );
}

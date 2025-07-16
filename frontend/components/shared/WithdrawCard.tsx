"use client";

import { useState } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseUnits } from "viem";
import { ABIS, CONTRACTS, CONSTANTS } from "@/utils/contracts";

const VAULT_ADDRESS = CONTRACTS.RISEFI_VAULT;
const VAULT_ABI = ABIS.RISEFI_VAULT;

export default function WithdrawCard() {
  const { address } = useAccount();
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<
    "idle" | "withdrawing" | "done" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const { writeContract } = useWriteContract();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);

  // Suivi de la confirmation
  const {
    isLoading: isConfirming,
    isSuccess,
    error: errorConfirmation,
  } = useWaitForTransactionReceipt({
    hash: txHash as `0x${string}` | undefined,
  });

  // Handler
  const handleWithdraw = async () => {
    setError(null);
    if (!address || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError("Please enter a valid positive number");
      return;
    }
    const amountBN = parseUnits(amount, CONSTANTS.USDC_DECIMALS);
    try {
      setStatus("withdrawing");
      const tx = await writeContract({
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: "withdraw",
        args: [amountBN, address, address],
      });
      setTxHash(typeof tx === "string" ? (tx as `0x${string}`) : undefined);
      setStatus("done");
      setAmount("");
    } catch (e: any) {
      setStatus("error");
      setError(e?.message || "Erreur lors du retrait");
    }
  };

  const isLoading = status === "withdrawing" || isConfirming;

  return (
    <div className="w-full max-w-sm mx-auto p-6 rounded-2xl bg-gray-800/90 border border-yellow-500 shadow-xl">
      <h3 className="text-lg font-bold text-yellow-400 mb-4">Withdraw USDC</h3>
      <div className="flex flex-col gap-3">
        <label htmlFor="withdrawAmount" className="text-sm text-gray-300">
          Amount
        </label>
        <input
          id="withdrawAmount"
          type="number"
          step="any"
          min="0"
          placeholder="100"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={!address || isLoading}
          className="bg-gray-900 text-white border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-500 transition"
        />
        <button
          onClick={handleWithdraw}
          disabled={!address || !amount || isLoading}
          className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold py-2 rounded-xl transition disabled:opacity-50"
        >
          {isLoading ? "Withdrawing…" : "Withdraw"}
        </button>
        {txHash && (
          <div className="text-xs text-gray-400 break-all">Tx: {txHash}</div>
        )}
        {error && (
          <div className="text-red-500 text-sm font-medium">{error}</div>
        )}
        {status === "done" && isSuccess && (
          <div className="text-green-400 text-sm font-medium">
            Withdraw successful!
          </div>
        )}
        {errorConfirmation && (
          <div className="text-red-500 text-sm font-medium">
            Error:{" "}
            {(errorConfirmation as any).shortMessage ||
              errorConfirmation.message}
          </div>
        )}
      </div>
    </div>
  );
}

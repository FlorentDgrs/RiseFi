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

export default function EmergencyWithdraw() {
  const { address } = useAccount();
  const [shares, setShares] = useState("");
  const [status, setStatus] = useState<
    "idle" | "withdrawing" | "done" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);

  const { writeContract } = useWriteContract();

  // Transaction confirmation tracking
  const { isSuccess, error: errorConfirmation } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const handleEmergencyWithdraw = async () => {
    setError(null);
    if (!address || !shares || isNaN(Number(shares)) || Number(shares) <= 0) {
      setError("Please enter a valid positive number of shares");
      return;
    }

    const sharesBN = parseUnits(shares, CONSTANTS.VAULT_SHARES_DECIMALS);

    try {
      setStatus("withdrawing");
      const tx = await writeContract({
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: "emergencyWithdraw",
        args: [sharesBN, address],
      });
      setTxHash(typeof tx === "string" ? (tx as `0x${string}`) : undefined);
    } catch (e: unknown) {
      setStatus("error");
      setError(
        e instanceof Error ? e.message : "Error during emergency withdrawal"
      );
      setTxHash(undefined);
    }
  };

  // Reset status after success
  if (isSuccess && status !== "done") {
    setStatus("done");
    setShares("");
    setTimeout(() => setStatus("idle"), 3000);
  }

  return (
    <div className="w-full max-w-sm mx-auto p-4 rounded-xl bg-red-900/20 border border-red-500/50 shadow-lg">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-red-400 mb-2">
          ⚠️ Emergency Withdraw
        </h3>
        <p className="text-sm text-red-300">
          Use only in emergencies. Bypasses normal safety checks and slippage
          protection.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <label htmlFor="emergencyShares" className="text-sm text-gray-300">
          Shares to withdraw:
        </label>
        <input
          id="emergencyShares"
          type="number"
          step="any"
          min="0"
          placeholder="0.0"
          value={shares}
          onChange={(e) => setShares(e.target.value)}
          disabled={true}
          className="bg-gray-900 text-white border border-red-500/50 rounded-lg px-3 py-2 focus:outline-none focus:border-red-400 transition font-mono opacity-50"
        />

        <button
          onClick={handleEmergencyWithdraw}
          disabled={true}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-xl transition disabled:opacity-50 cursor-not-allowed"
        >
          Emergency Withdraw (Disabled)
        </button>

        <div className="text-xs text-gray-400 text-center">
          Emergency withdrawal is currently disabled for security reasons.
        </div>

        {txHash && (
          <div className="text-xs text-gray-400 break-all">Tx: {txHash}</div>
        )}

        {error && (
          <div className="text-red-400 text-sm font-medium">{error}</div>
        )}

        {isSuccess && status === "done" && (
          <div className="text-green-400 text-sm font-medium">
            Emergency withdrawal successful!
          </div>
        )}

        {errorConfirmation && (
          <div className="text-red-400 text-sm font-medium">
            Transaction failed:{" "}
            {errorConfirmation instanceof Error
              ? errorConfirmation.message
              : String(errorConfirmation)}
          </div>
        )}
      </div>
    </div>
  );
}

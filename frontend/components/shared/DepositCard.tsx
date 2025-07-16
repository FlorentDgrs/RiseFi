"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useReadContract } from "wagmi";
import { parseUnits } from "viem";
import { ABIS, CONTRACTS, CONSTANTS } from "@/utils/contracts";

const VAULT_ADDRESS = CONTRACTS.RISEFI_VAULT;
const VAULT_ABI = ABIS.RISEFI_VAULT;
const USDC_ADDRESS = CONTRACTS.USDC;
const USDC_ABI = ABIS.ERC20;

export default function DepositCard() {
  const { address } = useAccount();
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<
    "idle" | "approving" | "depositing" | "done" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  // Read allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: "allowance",
    args: address ? [address, VAULT_ADDRESS] : undefined,
    query: { enabled: !!address },
  });

  // Write hooks
  const { writeContract: writeApprove } = useWriteContract();
  const { writeContract: writeDeposit } = useWriteContract();

  // Handler
  const handleDeposit = async () => {
    setError(null);
    if (!address || !amount) return;
    const amountBN = parseUnits(amount, CONSTANTS.USDC_DECIMALS);
    const safeAllowance = typeof allowance === "bigint" ? allowance : BigInt(0);

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
      await writeDeposit({
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: "deposit",
        args: [amountBN, address],
      });
      setStatus("done");
      setAmount("");
      await refetchAllowance?.();
    } catch (e: any) {
      setStatus("error");
      setError(e?.message || "Erreur lors du dépôt");
    }
  };

  const isLoading = status === "approving" || status === "depositing";

  return (
    <div className="w-full max-w-sm mx-auto p-6 rounded-2xl bg-gray-800/90 border border-yellow-500 shadow-xl">
      <h3 className="text-lg font-bold text-yellow-400 mb-4">Deposit USDC</h3>
      <div className="flex flex-col gap-3">
        <label htmlFor="depositAmount" className="text-sm text-gray-300">
          Amount
        </label>
        <input
          id="depositAmount"
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
          onClick={handleDeposit}
          disabled={!address || !amount || isLoading}
          className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold py-2 rounded-xl transition disabled:opacity-50"
        >
          {status === "approving"
            ? "Approving…"
            : status === "depositing"
            ? "Depositing…"
            : "Deposit"}
        </button>
        {error && (
          <div className="text-red-500 text-sm font-medium">{error}</div>
        )}
        {status === "done" && (
          <div className="text-green-400 text-sm font-medium">
            Deposit successful!
          </div>
        )}
      </div>
    </div>
  );
}

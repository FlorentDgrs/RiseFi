"use client";

import { useState, useEffect, useCallback } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { ABIS, CONTRACTS, CONSTANTS } from "@/utils/contracts";
import { toast } from "sonner";
import React from "react";

interface ActionCardProps {
  usdcBalanceStr: string;
  maxWithdrawStr: string;
  usdcBalanceExact: string;
  maxWithdrawExact: string;
  userShares: bigint;
  refetchStats: () => void;
}

const VAULT_ADDRESS = CONTRACTS.RISEFI_VAULT;
const VAULT_ABI = ABIS.RISEFI_VAULT;
const USDC_ADDRESS = CONTRACTS.USDC;
const USDC_ABI = ABIS.ERC20;

// Custom toast functions with elegant styling and colored borders
const showSuccessToast = (message: string, description?: string) => {
  toast.success(message, {
    description,
    duration: 4000,
    style: {
      background: "#1f2937", // Solid gray-800
      color: "#f9fafb", // Solid gray-50
      border: "1px solid #4b5563", // Solid gray-600
      borderLeft: "4px solid hsl(142 76% 36%)",
      borderRadius: "var(--radius)",
      backdropFilter: "blur(8px)",
      fontWeight: "500",
      boxShadow: "0 4px 12px -2px rgba(0, 0, 0, 0.1)",
    },
  });
};

const showErrorToast = (message: string, description?: string) => {
  toast.error(message, {
    description,
    duration: 6000,
    style: {
      background: "#1f2937", // Solid gray-800
      color: "#f9fafb", // Solid gray-50
      border: "1px solid #4b5563", // Solid gray-600
      borderLeft: "4px solid #ef4444", // Solid red-500
      borderRadius: "var(--radius)",
      backdropFilter: "blur(8px)",
      fontWeight: "500",
      boxShadow: "0 4px 12px -2px rgba(0, 0, 0, 0.1)",
    },
  });
};

const showInfoToast = (message: string, description?: string) => {
  toast.info(message, {
    description,
    duration: 3000,
    style: {
      background: "#1f2937", // Solid gray-800
      color: "#f9fafb", // Solid gray-50
      border: "1px solid #4b5563", // Solid gray-600
      borderLeft: "4px solid #f5c249", // Solid RiseFi yellow
      borderRadius: "var(--radius)",
      backdropFilter: "blur(8px)",
      fontWeight: "500",
      boxShadow: "0 4px 12px -2px rgba(0, 0, 0, 0.1)",
    },
  });
};

const showLoadingToast = (message: string, description?: string) => {
  return toast.loading(message, {
    description,
    duration: Infinity, // Toast stays until manually closed
    closeButton: true, // Add close button
    style: {
      background: "#1f2937", // Solid gray-800
      color: "#f9fafb", // Solid gray-50
      border: "1px solid #4b5563", // Solid gray-600
      borderLeft: "4px solid #9ca3af", // Solid gray-400
      borderRadius: "var(--radius)",
      backdropFilter: "blur(8px)",
      fontWeight: "500",
      boxShadow: "0 4px 12px -2px rgba(0, 0, 0, 0.1)",
      cursor: "pointer", // Indicates it's clickable
    },
  });
};

// Memoized component to prevent unnecessary re-renders
const ActionCard: React.FC<ActionCardProps> = React.memo(function ActionCard({
  usdcBalanceStr,
  maxWithdrawStr,
  usdcBalanceExact,
  maxWithdrawExact,
  userShares,
  refetchStats,
}: ActionCardProps) {
  const { address } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<"deposit" | "withdraw">("deposit");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<
    "idle" | "approving" | "depositing" | "withdrawing" | "done" | "error"
  >("idle");
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);
  const [currentToastId, setCurrentToastId] = useState<string | number | null>(
    null
  );

  // Avoid hydration error
  useEffect(() => {
    setMounted(true);
  }, []);

  // Write hooks
  const { writeContractAsync: writeApproveAsync } = useWriteContract();
  const { writeContractAsync: writeDepositAsync } = useWriteContract();
  const { writeContractAsync: writeRedeemAsync } = useWriteContract();

  // Transaction confirmation tracking (for withdraw and deposit)
  const { isSuccess, error: errorConfirmation } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: !!txHash },
  });

  // Allowance (for deposit)
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: "allowance",
    args: address ? [address, VAULT_ADDRESS] : undefined,
    query: { enabled: !!address && tab === "deposit" },
  }) as { data: bigint | undefined; refetch: () => void };

  // Convert USDC to shares for withdraw
  const { data: sharesToRedeem } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "convertToShares",
    args: amount ? [parseUnits(amount, CONSTANTS.USDC_DECIMALS)] : undefined,
    query: {
      enabled:
        !!address && tab === "withdraw" && !!amount && Number(amount) > 0,
    },
  }) as { data: bigint | undefined };

  // Check if vault is paused
  const { data: isPaused } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "isPaused",
  }) as { data: boolean | undefined };

  // Success/error handling with improved toasts
  useEffect(() => {
    if (isSuccess) {
      // Dismiss loading toast
      if (currentToastId) {
        toast.dismiss(currentToastId);
        setCurrentToastId(null);
      }

      // Show success toast - ONLY final confirmation is green
      const successMessage =
        tab === "deposit" ? "Deposit confirmed" : "Withdrawal confirmed";
      const successDescription =
        tab === "deposit"
          ? `${amount} USDC have been successfully deposited into the vault`
          : `${amount} USDC have been successfully withdrawn from the vault`;

      showSuccessToast(successMessage, successDescription);

      setAmount("");
      setStatus("done");
      setTxHash(undefined);
      refetchAllowance?.();

      // Delay before refetch
      setTimeout(() => {
        refetchStats();
      }, 2000);

      // Visual reset after 3s
      setTimeout(() => {
        setStatus("idle");
      }, 3000);
    }

    if (errorConfirmation) {
      // Dismiss loading toast
      if (currentToastId) {
        toast.dismiss(currentToastId);
        setCurrentToastId(null);
      }

      const errorMsg = "Transaction failed";
      const errorDescription =
        "The transaction was rejected or failed on the blockchain. Check your balance and try again.";

      showErrorToast(errorMsg, errorDescription);
      setStatus("error");
      setTxHash(undefined);

      // Visual reset after 5s
      setTimeout(() => {
        setStatus("idle");
      }, 5000);
    }
  }, [
    isSuccess,
    errorConfirmation,
    tab,
    refetchStats,
    refetchAllowance,
    amount,
    currentToastId,
  ]);

  // Reset status if user modifies input
  useEffect(() => {
    if (status === "error" || status === "done") {
      setStatus("idle");
    }
  }, [amount, status]);

  // Optimized MAX handlers - use exact values to prevent reverts
  const handleMaxDeposit = useCallback(() => {
    setAmount(usdcBalanceExact);
    showInfoToast("Maximum amount selected", `${usdcBalanceStr} USDC`);
  }, [usdcBalanceExact, usdcBalanceStr]);

  const handleMaxWithdraw = useCallback(() => {
    // If maxWithdrawExact is 0 (paused state), use userShares directly
    if (Number(maxWithdrawExact) === 0 && userShares > BigInt(0)) {
      // Calculate max withdraw from userShares
      const userSharesStr = formatUnits(userShares, CONSTANTS.USDC_DECIMALS);
      setAmount(userSharesStr);
      showInfoToast(
        "Maximum amount selected",
        `${userSharesStr} USDC (all shares)`
      );
    } else {
      setAmount(maxWithdrawExact);
      showInfoToast("Maximum amount selected", `${maxWithdrawStr} USDC`);
    }
  }, [maxWithdrawExact, maxWithdrawStr, userShares]);

  // Handler principal
  const handleAction = async () => {
    setStatus("idle");

    // Basic validation
    if (!address) {
      showErrorToast(
        "Wallet not connected",
        "Please connect your wallet to continue"
      );
      return;
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      showErrorToast(
        "Invalid amount",
        "Please enter a valid amount greater than 0"
      );
      return;
    }

    const amountBN = parseUnits(amount, CONSTANTS.USDC_DECIMALS);

    if (tab === "deposit") {
      // Check if vault is paused
      if (isPaused) {
        showErrorToast(
          "Deposits disabled",
          "The vault is currently paused. Deposits are not allowed, but withdrawals are still available."
        );
        return;
      }

      // Deposit with auto-approve if needed
      const safeAllowance =
        typeof allowance === "bigint" ? allowance : BigInt(0);

      try {
        if (safeAllowance < amountBN) {
          setStatus("approving");

          const approveToastId = showLoadingToast(
            "Approval required",
            "Please sign the USDC approval in your wallet"
          );
          setCurrentToastId(approveToastId);

          await writeApproveAsync({
            address: USDC_ADDRESS,
            abi: USDC_ABI,
            functionName: "approve",
            args: [VAULT_ADDRESS, amountBN],
            gas: BigInt(100000),
          });

          refetchAllowance?.();

          // Update toast for deposit
          toast.dismiss(approveToastId);
          const depositToastId = showLoadingToast(
            "Deposit in progress",
            `Depositing ${amount} USDC into the vault...`
          );
          setCurrentToastId(depositToastId);
        } else {
          setStatus("depositing");

          const depositToastId = showLoadingToast(
            "Deposit in progress",
            `Depositing ${amount} USDC into the vault...`
          );
          setCurrentToastId(depositToastId);
        }

        const tx = await writeDepositAsync({
          address: VAULT_ADDRESS,
          abi: VAULT_ABI,
          functionName: "deposit",
          args: [amountBN, address],
          gas: BigInt(500000),
        });

        setTxHash(tx as `0x${string}`);

        // Update toast to show transaction sent
        toast.dismiss(currentToastId!);
        const confirmToastId = showLoadingToast(
          "Transaction sent",
          "Waiting for blockchain confirmation..."
        );
        setCurrentToastId(confirmToastId);
      } catch (e: unknown) {
        // Dismiss any loading toast
        if (currentToastId) {
          toast.dismiss(currentToastId);
          setCurrentToastId(null);
        }

        setStatus("error");
        setTxHash(undefined);

        // Different message based on error type
        const errorMessage = e instanceof Error ? e.message : String(e);
        if (
          errorMessage.includes("User rejected") ||
          errorMessage.includes("User denied")
        ) {
          // Replace loading toast with cancellation toast
          showErrorToast(
            "Transaction cancelled",
            "You cancelled the transaction"
          );
        } else {
          showErrorToast(
            "Oops! Something went wrong",
            "Please try again later"
          );
        }
      }
    } else {
      // Withdrawal
      try {
        setStatus("withdrawing");

        const withdrawToastId = showLoadingToast(
          "Withdrawal in progress",
          `Withdrawing ${amount} USDC from the vault...`
        );
        setCurrentToastId(withdrawToastId);

        // For withdraw, we need to convert USDC to shares
        if (!userShares || userShares === BigInt(0)) {
          throw new Error("No shares to redeem");
        }

        if (!sharesToRedeem) {
          throw new Error("Failed to calculate shares to redeem");
        }

        const tx = await writeRedeemAsync({
          address: VAULT_ADDRESS,
          abi: VAULT_ABI,
          functionName: "redeem",
          args: [sharesToRedeem, address, address],
          gas: BigInt(500000),
        });

        setTxHash(tx as `0x${string}`);

        // Update toast to show transaction sent
        toast.dismiss(withdrawToastId);
        const confirmToastId = showLoadingToast(
          "Transaction sent",
          "Waiting for blockchain confirmation..."
        );
        setCurrentToastId(confirmToastId);
      } catch (e: unknown) {
        // Dismiss any loading toast
        if (currentToastId) {
          toast.dismiss(currentToastId);
          setCurrentToastId(null);
        }

        setStatus("error");
        setTxHash(undefined);

        // Different message based on error type
        const errorMessage = e instanceof Error ? e.message : String(e);
        if (
          errorMessage.includes("User rejected") ||
          errorMessage.includes("User denied")
        ) {
          // Replace loading toast with cancellation toast
          showErrorToast(
            "Transaction cancelled",
            "You cancelled the transaction"
          );
        } else {
          showErrorToast(
            "Oops! Something went wrong",
            "Please try again later"
          );
        }
      }
    }
  };

  // Determine if button is loading
  const isLoading =
    status === "approving" ||
    status === "depositing" ||
    status === "withdrawing";

  // Clean up toasts if user changes tab or modifies input during action
  useEffect(() => {
    if (isLoading && currentToastId) {
      // If user changes something during loading, close the toast
      toast.dismiss(currentToastId);
      setCurrentToastId(null);
      setStatus("idle");
    }
  }, [tab, amount, isLoading, currentToastId]);

  // UI
  if (!mounted) return null;

  return (
    <div className="w-full max-w-sm mx-auto pt-2 pb-4 px-4 rounded-2xl bg-gray-900/90 shadow-xl">
      {/* Tabs */}
      <div className="flex mb-3">
        <button
          className={`flex-1 py-3 transition text-base font-semibold
            ${
              tab === "deposit"
                ? "text-[#f5c249] border-b-2 border-[#f5c249]"
                : "text-white opacity-80 hover:opacity-100"
            }
          `}
          onClick={() => setTab("deposit")}
          disabled={isLoading}
        >
          Deposit
        </button>
        <button
          className={`flex-1 py-3 transition text-base font-semibold
            ${
              tab === "withdraw"
                ? "text-[#f5c249] border-b-2 border-[#f5c249]"
                : "text-white opacity-80 hover:opacity-100"
            }
          `}
          onClick={() => setTab("withdraw")}
          disabled={isLoading}
        >
          Withdraw
        </button>
      </div>

      {/* Input */}
      <div className="flex flex-col gap-2">
        <label htmlFor="actionAmount" className="text-sm text-gray-300">
          Amount:
        </label>
        <div className="flex gap-2">
          <input
            id="actionAmount"
            type="number"
            step="any"
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
            className="bg-gray-700 hover:bg-gray-600 text-[#f5c249] font-medium text-sm py-1.5 px-2.5 rounded-lg transition duration-200 disabled:opacity-50"
          >
            MAX
          </button>
        </div>

        {/* Validation messages */}
        <div className="min-h-[20px] flex items-center">
          {amount && Number(amount) > 0 && (
            <>
              {tab === "deposit" && Number(amount) < 1 && (
                <span className="text-red-400 text-xs">
                  Minimum deposit is 1 USDC
                </span>
              )}
              {tab === "deposit" &&
                Number(amount) > Number(usdcBalanceExact) && (
                  <span className="text-red-400 text-xs">
                    Insufficient USDC balance
                  </span>
                )}
              {tab === "withdraw" &&
                Number(amount) > Number(maxWithdrawExact) &&
                Number(maxWithdrawExact) > 0 && (
                  <span className="text-red-400 text-xs">
                    Amount exceeds maximum withdrawal
                  </span>
                )}
            </>
          )}
        </div>

        {/* Pause warning for deposits */}
        {isPaused && tab === "deposit" && (
          <div className="p-2 bg-red-900/20 border border-red-500/50 rounded-lg">
            <p className="text-xs text-red-400 text-center">
              ⚠️ Deposits are disabled while vault is paused
            </p>
          </div>
        )}

        {/* Dynamic button */}
        <button
          onClick={handleAction}
          disabled={!address || isLoading || (isPaused && tab === "deposit")}
          className={`w-full font-semibold text-base py-2.5 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
            isPaused && tab === "deposit"
              ? "bg-gray-600 text-gray-400 cursor-not-allowed"
              : "bg-[#f5c249] hover:bg-[#e6b142] text-gray-900"
          }`}
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
              {status === "approving" && "Approving..."}
              {status === "depositing" && "Depositing..."}
              {status === "withdrawing" && "Withdrawing..."}
            </>
          ) : (
            <span>
              {isPaused && tab === "deposit"
                ? "Deposits Disabled"
                : tab === "deposit"
                ? "Deposit"
                : "Withdraw"}
            </span>
          )}
        </button>
      </div>
    </div>
  );
});

export default ActionCard;

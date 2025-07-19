"use client";

import { useState, useEffect } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { ABIS, CONTRACTS } from "@/utils/contracts";
import { toast } from "sonner";
import EnhancedVaultInfo from "./EnhancedVaultInfo";

const VAULT_ADDRESS = CONTRACTS.RISEFI_VAULT;
const VAULT_ABI = ABIS.RISEFI_VAULT;

// Custom toast functions with elegant styling
const showSuccessToast = (message: string, description?: string) => {
  toast.success(message, {
    description,
    duration: 4000,
    style: {
      background: "#1f2937",
      color: "#f9fafb",
      border: "1px solid #4b5563",
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
      background: "#1f2937",
      color: "#f9fafb",
      border: "1px solid #4b5563",
      borderLeft: "4px solid #ef4444",
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
    style: {
      background: "#1f2937",
      color: "#f9fafb",
      border: "1px solid #4b5563",
      borderLeft: "4px solid #9ca3af",
      borderRadius: "var(--radius)",
      backdropFilter: "blur(8px)",
      fontWeight: "500",
      boxShadow: "0 4px 12px -2px rgba(0, 0, 0, 0.1)",
    },
  });
};

export default function AdminDashboard() {
  const { address } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>(undefined);
  const [currentToastId, setCurrentToastId] = useState<string | number | null>(
    null
  );

  // Write hooks
  const { writeContractAsync: writePauseAsync } = useWriteContract();
  const { writeContractAsync: writeUnpauseAsync } = useWriteContract();

  // Read owner
  const { data: owner } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "owner",
  }) as { data: string | undefined };

  // Read pause status
  const { data: isPaused, refetch: refetchPauseStatus } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "isPaused",
  }) as { data: boolean | undefined; refetch: () => void };

  // Transaction confirmation tracking
  const {
    isLoading: isConfirming,
    isSuccess,
    error: errorConfirmation,
  } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: !!txHash },
  });

  // Check if user is owner
  useEffect(() => {
    if (address && owner) {
      setIsOwner(address.toLowerCase() === owner.toLowerCase());
    } else {
      setIsOwner(false);
    }
  }, [address, owner]);

  // Handle transaction success/error
  useEffect(() => {
    if (isSuccess) {
      // Dismiss loading toast
      if (currentToastId) {
        toast.dismiss(currentToastId);
        setCurrentToastId(null);
      }

      showSuccessToast(
        "Admin action confirmed",
        "The operation was successfully executed"
      );
      setTxHash(undefined);
      refetchPauseStatus?.();

      // Reset after 3s
      setTimeout(() => {
        setTxHash(undefined);
      }, 3000);
    }

    if (errorConfirmation) {
      // Dismiss loading toast
      if (currentToastId) {
        toast.dismiss(currentToastId);
        setCurrentToastId(null);
      }

      const errorMsg = "Admin action failed";
      const errorDescription =
        "The transaction was rejected or failed on the blockchain.";

      showErrorToast(errorMsg, errorDescription);
      setTxHash(undefined);
    }
  }, [isSuccess, errorConfirmation, refetchPauseStatus, currentToastId]);

  // Avoid hydration error
  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePause = async () => {
    if (!isOwner) {
      showErrorToast(
        "Access denied",
        "Only the contract owner can perform this action"
      );
      return;
    }

    try {
      const pauseToastId = showLoadingToast(
        "Pausing vault",
        "Pausing all deposit and withdrawal operations..."
      );
      setCurrentToastId(pauseToastId);

      const tx = await writePauseAsync({
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: "pause",
        gas: BigInt(100000),
      });

      setTxHash(tx as `0x${string}`);

      // Update toast
      toast.dismiss(pauseToastId);
      const confirmToastId = showLoadingToast(
        "Transaction sent",
        "Waiting for blockchain confirmation..."
      );
      setCurrentToastId(confirmToastId);
    } catch (e: unknown) {
      if (currentToastId) {
        toast.dismiss(currentToastId);
        setCurrentToastId(null);
      }

      const errorMessage =
        e instanceof Error ? e.message : "Error pausing vault";
      showErrorToast("Pause failed", errorMessage);
      setTxHash(undefined);
    }
  };

  const handleUnpause = async () => {
    if (!isOwner) {
      showErrorToast(
        "Access denied",
        "Only the contract owner can perform this action"
      );
      return;
    }

    try {
      const unpauseToastId = showLoadingToast(
        "Unpausing vault",
        "Resuming normal deposit and withdrawal operations..."
      );
      setCurrentToastId(unpauseToastId);

      const tx = await writeUnpauseAsync({
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: "unpause",
        gas: BigInt(100000),
      });

      setTxHash(tx as `0x${string}`);

      // Update toast
      toast.dismiss(unpauseToastId);
      const confirmToastId = showLoadingToast(
        "Transaction sent",
        "Waiting for blockchain confirmation..."
      );
      setCurrentToastId(confirmToastId);
    } catch (e: unknown) {
      if (currentToastId) {
        toast.dismiss(currentToastId);
        setCurrentToastId(null);
      }

      const errorMessage =
        e instanceof Error ? e.message : "Error unpausing vault";
      showErrorToast("Unpause failed", errorMessage);
      setTxHash(undefined);
    }
  };

  // Don't render if not mounted or not owner
  if (!mounted || !isOwner) {
    return null;
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Admin Header */}
      <div className="w-full text-center mb-8">
        <h1 className="text-4xl font-bold text-[#f5c249] mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-400">
          Contract owner controls - Use with extreme caution
        </p>
        <div className="mt-2 text-sm text-green-400">
          Connected as owner: {address?.slice(0, 6)}...{address?.slice(-4)}
        </div>
      </div>

      {/* Main Content Grid - All components with equal width */}
      <div className="grid grid-cols-1 gap-6">
        {/* Vault Information */}
        <div className="w-full">
          <EnhancedVaultInfo />
        </div>

        {/* Easy Vest Strategy Details */}
        <div className="p-6 rounded-2xl bg-gray-900/90 border border-gray-700 shadow-xl">
          <h2 className="text-xl font-bold text-gray-200 mb-4">
            Easy Vest Strategy Details
          </h2>
          <div className="text-sm text-gray-300 space-y-2">
            <p>
              <strong>Strategy:</strong> Automated yield optimization through
              Morpho Blue vaults
            </p>
            <p>
              <strong>Target Asset:</strong> USDC (6 decimals) with cbBTC
              collateral exposure
            </p>
            <p>
              <strong>Risk Profile:</strong> Conservative with enhanced yield
              through Morpho&apos;s capital efficiency
            </p>
            <p>
              <strong>Rebalancing:</strong> Dynamic allocation based on market
              conditions and yield opportunities
            </p>
            <p>
              <strong>Fees:</strong> No performance fees - all yield goes to
              users
            </p>
          </div>
        </div>

        {/* Pause Controls */}
        <div className="p-6 rounded-2xl bg-gray-900/90 border border-gray-700 shadow-xl">
          <h2 className="text-xl font-bold text-gray-200 mb-4">
            Pause Controls
          </h2>

          <div className="mb-4 p-3 rounded-lg bg-gray-800/50 border border-gray-600">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Vault Status:</span>
              <span
                className={
                  isPaused
                    ? "text-red-400 font-bold"
                    : "text-green-400 font-bold"
                }
              >
                {isPaused ? "PAUSED" : "ACTIVE"}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handlePause}
              disabled={isPaused || isConfirming}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConfirming ? "Pausing..." : "Pause Vault"}
            </button>

            <button
              onClick={handleUnpause}
              disabled={!isPaused || isConfirming}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConfirming ? "Unpausing..." : "Unpause Vault"}
            </button>
          </div>

          <div className="mt-3 text-xs text-gray-400">
            <p>• Pausing stops deposits but allows withdrawals</p>
            <p>• Users can still redeem their shares when paused</p>
            <p>• Use only in case of security issues</p>
          </div>
        </div>
      </div>
    </div>
  );
}

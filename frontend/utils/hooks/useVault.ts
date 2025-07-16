import { useState, useCallback, useEffect } from "react";
import {
  useAccount,
  useBalance,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import { CONTRACTS, ABIS, CONSTANTS } from "../contracts";
import { parseUnits, formatUnits } from "viem";

export function useVault() {
  const { address } = useAccount();

  // Solde USDC wallet
  const { data: usdcBalance, refetch: refetchUsdc } = useBalance({
    address,
    token: CONTRACTS.USDC,
  });

  // Solde rfUSDC (shares du vault)
  const { data: rfUsdcBalance, refetch: refetchRfUsdc } = useBalance({
    address,
    token: CONTRACTS.RISEFI_VAULT,
  });

  // Total assets (USDC dans le vault)
  const { data: totalAssets, refetch: refetchTotalAssets } = useReadContract({
    address: CONTRACTS.RISEFI_VAULT,
    abi: ABIS.RISEFI_VAULT,
    functionName: "totalAssets",
  });

  // Total supply (shares du vault)
  const { data: totalSupply, refetch: refetchTotalSupply } = useReadContract({
    address: CONTRACTS.RISEFI_VAULT,
    abi: ABIS.RISEFI_VAULT,
    functionName: "totalSupply",
  });

  // State pour le suivi des transactions
  const [lastTxHash, setLastTxHash] = useState<`0x${string}` | undefined>(
    undefined
  );
  const [isVaultPending, setIsVaultPending] = useState(false);
  const [isVaultConfirming, setIsVaultConfirming] = useState(false);
  const [vaultError, setVaultError] = useState<string | null>(null);

  // Write contract (dépôt/retrait)
  const {
    writeContract,
    isPending,
    error: writeError,
    data: writeData,
    reset: resetWrite,
  } = useWriteContract();

  // Suivi de la transaction
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    isError: isTxError,
  } = useWaitForTransactionReceipt({
    hash: lastTxHash,
    query: { enabled: !!lastTxHash },
  });

  // Dépôt USDC -> vault
  const handleDeposit = useCallback(
    async (amount: string) => {
      setVaultError(null);
      setIsVaultPending(true);
      setIsVaultConfirming(false);
      try {
        const amountBN = parseUnits(amount, CONSTANTS.USDC_DECIMALS);
        console.log(
          "[Vault] Dépôt demandé:",
          amount,
          "USDC (",
          amountBN.toString(),
          ")"
        );
        writeContract({
          address: CONTRACTS.RISEFI_VAULT,
          abi: ABIS.RISEFI_VAULT,
          functionName: "deposit",
          args: [amountBN, address!],
        });
      } catch (e) {
        setVaultError("Erreur lors du dépôt");
        setIsVaultPending(false);
        console.error("[Vault] Erreur dépôt:", e);
      }
    },
    [address, writeContract]
  );

  // Retrait rfUSDC -> USDC
  const handleWithdraw = useCallback(
    async (amount: string) => {
      setVaultError(null);
      setIsVaultPending(true);
      setIsVaultConfirming(false);
      try {
        const amountBN = parseUnits(amount, CONSTANTS.USDC_DECIMALS);
        console.log(
          "[Vault] Retrait demandé:",
          amount,
          "USDC (",
          amountBN.toString(),
          ")"
        );
        writeContract({
          address: CONTRACTS.RISEFI_VAULT,
          abi: ABIS.RISEFI_VAULT,
          functionName: "withdraw",
          args: [amountBN, address!, address!],
        });
      } catch (e) {
        setVaultError("Erreur lors du retrait");
        setIsVaultPending(false);
        console.error("[Vault] Erreur retrait:", e);
      }
    },
    [address, writeContract]
  );

  // Sur écriture, stocker le hash pour le suivi
  useEffect(() => {
    if (writeData && typeof writeData === "object" && "hash" in writeData) {
      setLastTxHash((writeData as any).hash);
      setIsVaultPending(false);
      setIsVaultConfirming(true);
      console.log("[Vault] Transaction envoyée:", (writeData as any).hash);
    }
  }, [writeData]);

  // Sur confirmation, reset et refetch
  useEffect(() => {
    if (isConfirmed) {
      setIsVaultConfirming(false);
      setLastTxHash(undefined);
      resetWrite();
      refetchAll();
      console.log("[Vault] Transaction confirmée !");
    }
    if (isTxError) {
      setVaultError("Erreur lors de la transaction");
      setIsVaultConfirming(false);
      setLastTxHash(undefined);
      resetWrite();
      console.error("[Vault] Erreur transaction !");
    }
  }, [isConfirmed, isTxError, resetWrite]);

  // Refetch toutes les balances et stats
  const refetchAll = useCallback(() => {
    refetchUsdc();
    refetchRfUsdc();
    refetchTotalAssets();
    refetchTotalSupply();
    console.log("[Vault] Refetch de toutes les données");
  }, [refetchUsdc, refetchRfUsdc, refetchTotalAssets, refetchTotalSupply]);

  return {
    userTokenBalance: usdcBalance?.formatted || "0",
    userShares: rfUsdcBalance?.formatted || "0",
    totalAssets: totalAssets
      ? formatUnits(totalAssets as bigint, CONSTANTS.USDC_DECIMALS)
      : "0",
    totalSupply: totalSupply
      ? formatUnits(totalSupply as bigint, CONSTANTS.VAULT_SHARES_DECIMALS)
      : "0",
    handleDeposit,
    handleWithdraw,
    isVaultPending: isVaultPending || isPending,
    isVaultConfirming,
    lastTxHash,
    vaultError,
    refetchAll,
  };
}

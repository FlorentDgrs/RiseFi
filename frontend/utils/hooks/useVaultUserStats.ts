import { useAccount, useReadContracts } from "wagmi";
import { formatUnits } from "viem";
import { ABIS, CONTRACTS, CONSTANTS } from "@/utils/contracts";
import { useState, useCallback, useMemo } from "react";

export function useVaultUserStats() {
  const { address } = useAccount();
  const [forceRefreshKey, setForceRefreshKey] = useState(0);

  // Batch read : USDC balance, rfUSDC balance, maxWithdraw, convertToAssets(userShares)
  const { data, isLoading, refetch } = useReadContracts({
    contracts: [
      {
        address: CONTRACTS.USDC,
        abi: ABIS.ERC20,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
      },
      {
        address: CONTRACTS.RISEFI_VAULT,
        abi: ABIS.RISEFI_VAULT,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
      },
      {
        address: CONTRACTS.RISEFI_VAULT,
        abi: ABIS.RISEFI_VAULT,
        functionName: "maxRedeem",
        args: address ? [address] : undefined,
      },
    ],
    allowFailure: false,
    query: {
      enabled: !!address,
      staleTime: 5000, // Cache for 5 seconds to reduce re-renders
      refetchInterval: 0, // Disable auto refetch
      refetchOnWindowFocus: false, // Disable aggressive refetch
      refetchOnMount: true, // Refetch on component mount
      refetchOnReconnect: true, // Refetch on network reconnect
    },
  });

  // userShares = rfUSDC balance
  const usdcBalance = data?.[0] ?? BigInt(0);
  const userShares = data?.[1] ?? BigInt(0);
  const maxRedeem = data?.[2] ?? BigInt(0);

  // Montant investi = convertToAssets(userShares)
  // On lit convertToAssets uniquement si userShares > 0
  const { data: investedAmount, refetch: refetchInvestedAmount } =
    useReadContracts({
      contracts:
        userShares > BigInt(0)
          ? [
              {
                address: CONTRACTS.RISEFI_VAULT,
                abi: ABIS.RISEFI_VAULT,
                functionName: "convertToAssets",
                args: [userShares],
              },
            ]
          : [],
      allowFailure: false,
      query: {
        enabled: !!address && userShares > BigInt(0),
        staleTime: 5000, // Cache for 5 seconds to reduce re-renders
        refetchInterval: 0, // Disable auto refetch
        refetchOnWindowFocus: false, // Disable aggressive refetch
        refetchOnMount: true, // Refetch on component mount
        refetchOnReconnect: true, // Refetch on network reconnect
      },
    });

  // Optimized computed values with useMemo to prevent unnecessary re-renders
  const computedValues = useMemo(() => {
    return {
      usdcBalanceStr: formatUnits(usdcBalance, CONSTANTS.USDC_DECIMALS),
      userSharesStr: formatUnits(userShares, CONSTANTS.USDC_DECIMALS),
      maxWithdrawStr: formatUnits(maxRedeem, CONSTANTS.USDC_DECIMALS),
      investedAmountStr: Number(
        formatUnits(investedAmount?.[0] || BigInt(0), CONSTANTS.USDC_DECIMALS)
      ).toFixed(2),
    };
  }, [usdcBalance, userShares, maxRedeem, investedAmount]);

  // Simplified refetch function
  const forceRefetch = useCallback(async () => {
    try {
      // Increment key to force refresh
      setForceRefreshKey((prev) => prev + 1);

      // Refetch main data
      await refetch();

      // Refetch invested amount if needed
      if (userShares > BigInt(0)) {
        await refetchInvestedAmount();
      }
    } catch (error) {
      // Silently handle errors - could be logged to error monitoring service
    }
  }, [refetch, refetchInvestedAmount, userShares]);

  return {
    isLoading,
    refetch: forceRefetch,
    usdcBalance,
    userShares,
    maxRedeem,
    investedAmount: investedAmount?.[0],
    ...computedValues,
    forceRefreshKey,
  };
}

import { useAccount, useReadContracts } from "wagmi";
import { formatUnits } from "viem";
import { ABIS, CONTRACTS, CONSTANTS } from "@/utils/contracts";

export function useVaultUserStats() {
  const { address } = useAccount();

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
        functionName: "maxWithdraw",
        args: address ? [address] : undefined,
      },
    ],
    allowFailure: false,
    query: {
      enabled: !!address,
      staleTime: 0, // Force refetch every time
      refetchInterval: 0, // Disable auto refetch
      refetchOnWindowFocus: true, // Refetch when user comes back to tab
      refetchOnMount: true, // Refetch on component mount
    },
  });

  // userShares = rfUSDC balance
  const usdcBalance = data?.[0] ?? BigInt(0);
  const userShares = data?.[1] ?? BigInt(0);
  const maxWithdraw = data?.[2] ?? BigInt(0);

  // Montant investi = convertToAssets(userShares)
  // On lit convertToAssets uniquement si userShares > 0
  const { data: investedAmount } = useReadContracts({
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
      staleTime: 0, // Force refetch every time
      refetchInterval: 0, // Disable auto refetch
      refetchOnWindowFocus: true, // Refetch when user comes back to tab
      refetchOnMount: true, // Refetch on component mount
    },
  });

  return {
    isLoading,
    refetch,
    usdcBalance,
    userShares,
    maxWithdraw,
    investedAmount: investedAmount?.[0] ?? BigInt(0),
    usdcBalanceStr: formatUnits(usdcBalance, CONSTANTS.USDC_DECIMALS),
    userSharesStr: formatUnits(userShares, CONSTANTS.USDC_DECIMALS),
    maxWithdrawStr: formatUnits(maxWithdraw, CONSTANTS.USDC_DECIMALS),
    investedAmountStr: formatUnits(
      investedAmount?.[0] ?? BigInt(0),
      CONSTANTS.USDC_DECIMALS
    ),
  };
}

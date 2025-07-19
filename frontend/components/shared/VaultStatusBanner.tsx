"use client";

import { useReadContract } from "wagmi";
import { ABIS, CONTRACTS } from "@/utils/contracts";

const VAULT_ADDRESS = CONTRACTS.RISEFI_VAULT;
const VAULT_ABI = ABIS.RISEFI_VAULT;

export default function VaultStatusBanner() {
  const { data: isPaused } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: "isPaused",
  });

  // Don't render if vault is active
  if (!isPaused) {
    return null;
  }

  return (
    <div className="w-full mb-6 p-4 rounded-lg bg-gray-900/90 border-l-4 border-red-500">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-200 mb-2">
            Vault Temporarily Paused
          </h3>
          <div className="text-sm text-gray-300 space-y-2">
            <p>
              The RiseFi vault has been temporarily paused by the administrator.
              This is typically done in response to security concerns or
              technical issues.
            </p>
            <div className="bg-gray-800/50 p-3 rounded border border-gray-700">
              <p className="font-semibold mb-1 text-gray-200">
                What this means for you:
              </p>
              <ul className="text-xs space-y-1 text-gray-300">
                <li>
                  • <strong>Deposits are disabled</strong> - You cannot add new
                  funds to the vault
                </li>
                <li>
                  • <strong>Withdrawals are still available</strong> - You can
                  still redeem your shares (ERC4626 standard)
                </li>
                <li>
                  • <strong>Your funds are safe</strong> - All assets remain in
                  the vault and continue earning yield
                </li>
              </ul>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              The vault will be unpaused once the issue is resolved. Check back
              regularly for updates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

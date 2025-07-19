"use client";

import { useEffect, useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { useRouter } from "next/navigation";
import { ABIS, CONTRACTS } from "@/utils/contracts";

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const [mounted, setMounted] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { address, isConnected } = useAccount();
  const router = useRouter();

  // Read owner
  const { data: owner, isLoading: isLoadingOwner } = useReadContract({
    address: CONTRACTS.RISEFI_VAULT,
    abi: ABIS.RISEFI_VAULT,
    functionName: "owner",
  }) as { data: string | undefined; isLoading: boolean };

  // Check if user is owner
  useEffect(() => {
    if (address && owner) {
      setIsOwner(address.toLowerCase() === owner.toLowerCase());
    } else {
      setIsOwner(false);
    }
  }, [address, owner]);

  // Handle mounting and access control
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoadingOwner) {
      if (!isConnected) {
        // Not connected - redirect to home
        router.push("/");
        return;
      }

      if (!isOwner) {
        // Connected but not owner - redirect to dashboard
        router.push("/dashboard");
        return;
      }

      // Owner confirmed - allow access
      setIsLoading(false);
    }
  }, [mounted, isConnected, isOwner, isLoadingOwner, router]);

  // Show loading while checking permissions
  if (!mounted || isLoading || isLoadingOwner) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f5c249] mx-auto mb-4"></div>
          <p className="text-gray-400">Checking admin permissions...</p>
        </div>
      </div>
    );
  }

  // If not owner, don't render anything (redirect will happen)
  if (!isOwner) {
    return null;
  }

  // Render admin content
  return <>{children}</>;
}

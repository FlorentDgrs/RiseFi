"use client";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import NetworkValidator from "@/components/shared/NetworkValidator";
import NetworkSwitcher from "@/components/shared/NetworkSwitcher";
import VaultInfo from "@/components/VaultInfo";
import { NetworkEnforcer } from "@/components/NetworkEnforcer";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const [isMounted, setIsMounted] = useState(false);
  const { isConnected } = useAccount();
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !isConnected) {
      router.push("/");
    }
  }, [isMounted, isConnected, router]);

  if (!isMounted) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-yellow-400 mb-4">
              Dashboard RiseFi
            </h1>
            <p className="text-gray-400">Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isConnected) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <NetworkEnforcer />
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-2xl space-y-6">
          <h1 className="text-3xl font-bold text-yellow-400 text-center mb-8">
            Dashboard RiseFi
          </h1>

          {/* Switcher de réseau */}
          <NetworkSwitcher />

          {/* Validation de la connexion au fork */}
          <NetworkValidator />

          {/* Informations du vault */}
          <VaultInfo className="bg-gray-800 border-gray-700" />
        </div>
      </main>
      <Footer />
    </div>
  );
}

"use client";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import NetworkValidator from "@/components/shared/NetworkValidator";
import NetworkSwitcher from "@/components/shared/NetworkSwitcher";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Dashboard() {
  const { isConnected } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (!isConnected) {
      router.push("/");
    }
  }, [isConnected, router]);

  if (!isConnected) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-black">
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

          {/* Placeholder pour les données du vault */}
          <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">
              Données du Vault
            </h2>
            <p className="text-gray-300">
              Les données du vault seront affichées ici...
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

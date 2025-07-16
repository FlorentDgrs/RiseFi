"use client";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const { isConnected } = useAccount();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && isConnected) {
      // Redirection immédiate sans rechargement
      router.replace("/dashboard");
    }
  }, [isMounted, isConnected, router]);

  // Afficher un loader pendant la vérification de connexion
  if (!isMounted) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-4"></div>
            <p className="text-gray-400">Chargement...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Si déjà connecté, ne pas afficher la page (redirection en cours)
  if (isConnected) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-4"></div>
            <p className="text-gray-400">Redirection vers le dashboard...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-yellow-400 mb-6">
            Bienvenue sur RiseFi
          </h1>
          <p className="text-gray-300 mb-8">
            Connecte ton wallet pour accéder au dashboard et interagir avec le
            vault.
          </p>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <p className="text-gray-400 text-sm mb-4">
              🔗 Connecte ton wallet MetaMask pour commencer
            </p>
            <p className="text-gray-500 text-xs">
              Réseau local : Chain ID 31337
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

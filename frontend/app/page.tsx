"use client";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { isConnected } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (isConnected) {
      router.push("/dashboard");
    }
  }, [isConnected, router]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold text-blue-600">
          Bienvenue sur RiseFi
        </h1>
        <p className="text-gray-300 mt-4">
          Votre plateforme DeFi simple et sécurisée.
        </p>
        <div className="mt-8">
          <ConnectButton />
        </div>
      </main>
      <Footer />
    </div>
  );
}

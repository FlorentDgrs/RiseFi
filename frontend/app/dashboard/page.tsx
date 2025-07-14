"use client";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Dashboard() {
  const { isConnected, address } = useAccount();
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
      <main className="flex-1 flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold text-yellow-400">
          Bienvenue, {address?.slice(0, 6)}...{address?.slice(-4)}
        </h1>
        {/* Ajoute ici les infos utilisateur, vaults, etc. */}
      </main>
      <Footer />
    </div>
  );
}

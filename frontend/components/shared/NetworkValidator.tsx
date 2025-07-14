"use client";
import { useAccount, useBalance, useChainId } from "wagmi";
import { formatEther } from "viem";
import { useEffect, useState } from "react";

export default function NetworkValidator() {
  const [isMounted, setIsMounted] = useState(false);
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: balance } = useBalance({
    address,
  });

  // Debug: Afficher la variable d'environnement
  const wcProjectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="bg-gray-900/20 border border-gray-500/50 rounded-lg p-4 mb-4">
        <h3 className="text-gray-400 font-semibold mb-2">🔄 Chargement...</h3>
        <p className="text-gray-300 text-sm">
          Initialisation de la connexion wallet...
        </p>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4 mb-4">
        <h3 className="text-yellow-400 font-semibold mb-2">
          🔌 Connexion requise
        </h3>
        <p className="text-yellow-300 text-sm">
          Connectez-vous avec MetaMask pour continuer
        </p>
        <p className="text-gray-400 text-xs mt-2">
          WC Project ID: {wcProjectId ? "✅ Configuré" : "❌ Manquant"}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-4 mb-4">
      <h3 className="text-green-400 font-semibold mb-2">
        ✅ Connexion établie
      </h3>
      <div className="space-y-2 text-sm">
        <p className="text-green-300">
          <span className="font-medium">Adresse:</span> {address?.slice(0, 6)}
          ...{address?.slice(-4)}
        </p>
        <p className="text-green-300">
          <span className="font-medium">Réseau:</span> Chain ID {chainId}
        </p>
        <p className="text-green-300">
          <span className="font-medium">Solde ETH:</span>{" "}
          {balance ? formatEther(balance.value) : "..."} ETH
        </p>
        <p className="text-gray-400 text-xs">
          WC Project ID: {wcProjectId ? "✅ Configuré" : "❌ Manquant"}
        </p>
      </div>
    </div>
  );
}

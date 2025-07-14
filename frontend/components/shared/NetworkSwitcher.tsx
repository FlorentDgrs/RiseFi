"use client";
import { useChainId, useSwitchChain } from "wagmi";
import { localhost } from "wagmi/chains";

export default function NetworkSwitcher() {
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  const isCorrectNetwork = chainId === 31337;

  if (isCorrectNetwork) {
    return null; // Pas besoin d'afficher le bouton si déjà sur le bon réseau
  }

  return (
    <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-yellow-400">
            Réseau incorrect
          </h3>
          <p className="text-sm text-yellow-300">
            Veuillez vous connecter au réseau Anvil Fork
          </p>
        </div>
        <button
          onClick={() => switchChain({ chainId: localhost.id })}
          disabled={isPending}
          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 font-medium"
        >
          {isPending ? "Changement..." : "Changer de réseau"}
        </button>
      </div>
    </div>
  );
}

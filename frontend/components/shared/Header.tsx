import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Header() {
  return (
    <header className="bg-gray-800 shadow-lg border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center py-4">
          <div className="flex flex-row items-center gap-2">
            {/* Escalier stylisé en SVG, jaune RainbowKit */}
            <svg width="28" height="28" viewBox="0 0 48 48">
              <rect x="0" y="32" width="16" height="16" rx="4" fill="#f5c249" />
              <rect
                x="16"
                y="16"
                width="16"
                height="16"
                rx="4"
                fill="#f5c249"
              />
              <rect x="32" y="0" width="16" height="16" rx="4" fill="#f5c249" />
            </svg>
            <span className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 bg-clip-text text-transparent">
              RiseFi
            </span>
          </div>
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}

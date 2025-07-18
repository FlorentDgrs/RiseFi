"use client";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount, useReadContract } from "wagmi";
import { ABIS, CONTRACTS } from "@/utils/contracts";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const pathname = usePathname();
  const { isConnected, address } = useAccount();

  // Read owner to check if current user is admin
  const { data: owner } = useReadContract({
    address: CONTRACTS.RISEFI_VAULT,
    abi: ABIS.RISEFI_VAULT,
    functionName: "owner",
  });

  // Check if user is owner
  useEffect(() => {
    if (address && owner) {
      setIsOwner(address.toLowerCase() === owner.toLowerCase());
    } else {
      setIsOwner(false);
    }
  }, [address, owner]);

  // Avoid hydration error by waiting for client-side mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Academy", href: "/academy" },
    ...(mounted && isConnected
      ? [{ name: "Dashboard", href: "/dashboard" }]
      : []),
    ...(mounted && isConnected && isOwner
      ? [{ name: "Admin", href: "/admin" }]
      : []),
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <header className="bg-gray-800 shadow-lg border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
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
            <span className="text-3xl font-bold bg-gradient-to-r from-[#f5c249] via-[#e6b142] to-[#f5c249] bg-clip-text text-transparent">
              RiseFi
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`font-medium transition duration-200 ${
                  isActive(item.href)
                    ? item.name === "Admin"
                      ? "text-red-400 border-b-2 border-red-400"
                      : "text-[#f5c249] border-b-2 border-[#f5c249]"
                    : item.name === "Admin"
                    ? "text-red-400 hover:text-red-300"
                    : "text-gray-300 hover:text-[#f5c249]"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Connect Button */}
          <div className="flex items-center gap-4">
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                mounted,
              }) => {
                const ready = mounted;
                const connected = ready && account && chain;

                return (
                  <div
                    {...(!ready && {
                      "aria-hidden": true,
                      style: {
                        opacity: 0,
                        pointerEvents: "none",
                        userSelect: "none",
                      },
                    })}
                  >
                    {(() => {
                      if (!connected) {
                        return (
                          <button
                            onClick={openConnectModal}
                            type="button"
                            className="bg-[#f5c249] hover:bg-[#e6b142] text-gray-900 font-bold py-2 px-4 rounded-lg transition duration-200"
                          >
                            Connect Wallet
                          </button>
                        );
                      }

                      if (chain.unsupported) {
                        return (
                          <button
                            onClick={openChainModal}
                            type="button"
                            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
                          >
                            Wrong network
                          </button>
                        );
                      }

                      return (
                        <button
                          onClick={openAccountModal}
                          type="button"
                          className="bg-gray-700 hover:bg-gray-600 text-white font-mono py-2 px-3 rounded-lg transition duration-200"
                        >
                          {account.displayName}
                        </button>
                      );
                    })()}
                  </div>
                );
              }}
            </ConnectButton.Custom>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-300 hover:text-[#f5c249] hover:bg-gray-700 transition duration-200"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-700">
            <nav className="flex flex-col space-y-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`font-medium transition duration-200 py-2 px-4 rounded-lg ${
                    isActive(item.href)
                      ? item.name === "Admin"
                        ? "text-red-400 bg-red-900/20"
                        : "text-[#f5c249] bg-gray-700"
                      : item.name === "Admin"
                      ? "text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      : "text-gray-300 hover:text-[#f5c249] hover:bg-gray-700"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

"use client";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import VaultApyDisplay from "@/components/shared/VaultApyDisplay";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Home() {
  const { isConnected } = useAccount();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // No auto-redirect - allow connected users to access home page
  // Users can manually navigate to dashboard using the "Access Dashboard" button

  const handleGoToDashboard = () => {
    router.push("/dashboard");
  };

  // Show loader while checking connection
  if (!isMounted) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f5c249] mx-auto mb-4"></div>
            <p className="text-gray-400">Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-6xl md:text-7xl font-bold text-[#f5c249] mb-8 tracking-tight">
              RiseFi
            </h1>
            <p className="text-2xl md:text-3xl text-gray-300 mb-6 leading-relaxed">
              DeFi Made Simple
            </p>
            <p className="text-lg text-gray-400 mb-8 max-w-3xl mx-auto leading-relaxed">
              Start earning better returns than your traditional savings
              account. No complex jargon, just simple strategies that work.
            </p>

            {isConnected ? (
              <button
                onClick={handleGoToDashboard}
                className="bg-[#f5c249] hover:bg-[#e6b142] text-gray-900 font-bold py-4 px-8 rounded-xl text-lg transition duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Access Dashboard
              </button>
            ) : (
              <div className="flex flex-col items-center gap-6">
                <ConnectButton.Custom>
                  {({ openConnectModal }) => {
                    return (
                      <button
                        onClick={openConnectModal}
                        className="bg-[#f5c249] hover:bg-[#e6b142] text-gray-900 font-bold py-4 px-8 rounded-xl text-lg transition duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        Connect Wallet to Start Earning
                      </button>
                    );
                  }}
                </ConnectButton.Custom>
                <div className="text-center">
                  <p className="text-gray-400 text-sm mb-3">
                    Don&apos;t have a wallet yet? No worries, we explain
                    everything in our Academy section
                  </p>
                  <button
                    onClick={() => router.push("/academy")}
                    className="text-[#f5c249] hover:text-[#e6b142] font-medium py-2 px-6 rounded-lg transition duration-200 border border-[#f5c249]/30 hover:border-[#f5c249] bg-transparent"
                  >
                    Learn More About DeFi →
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* EasyVest Strategy Section */}
        <section className="py-20 px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center text-white mb-16">
              EasyVest - Perfect for Beginners
            </h2>
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-semibold text-[#f5c249] mb-6">
                  Your First Step into DeFi
                </h3>
                <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                  EasyVest is our beginner-friendly strategy that automatically
                  manages your investments to earn better returns than
                  traditional savings accounts.
                </p>
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 mb-6">
                  <h4 className="text-white font-semibold mb-3">
                    Why EasyVest?
                  </h4>
                  <ul className="space-y-3 text-gray-400">
                    <li className="flex items-start gap-3">
                      <span className="text-[#f5c249] mt-1">✓</span>
                      <span>Better returns than Livret A (0.5% → 4%+ APY)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#f5c249] mt-1">✓</span>
                      <span>No complex decisions - we handle everything</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#f5c249] mt-1">✓</span>
                      <span>Start with any amount, withdraw anytime</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#f5c249] mt-1">✓</span>
                      <span>Learn DeFi at your own pace</span>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="text-center">
                <VaultApyDisplay />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-8 bg-gray-800/30">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-bold text-center text-white mb-16">
              Why Choose RiseFi?
            </h2>
            <div className="grid md:grid-cols-3 gap-10">
              <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700 hover:border-[#f5c249]/50 transition-all duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <svg width="24" height="24" viewBox="0 0 24 24">
                    <rect
                      x="4"
                      y="4"
                      width="16"
                      height="16"
                      rx="4"
                      fill="#f5c249"
                    />
                  </svg>
                  <h3 className="text-2xl font-semibold text-white">
                    Education First
                  </h3>
                </div>
                <p className="text-gray-400 leading-relaxed">
                  Learn DeFi step by step. No confusing jargon, just clear
                  explanations of how your money works for you.
                </p>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700 hover:border-[#f5c249]/50 transition-all duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <svg width="24" height="24" viewBox="0 0 24 24">
                    <rect
                      x="4"
                      y="4"
                      width="16"
                      height="16"
                      rx="4"
                      fill="#f5c249"
                    />
                  </svg>
                  <h3 className="text-2xl font-semibold text-white">
                    Integrated Strategies
                  </h3>
                </div>
                <p className="text-gray-400 leading-relaxed">
                  Our strategies work together seamlessly. Start with EasyVest,
                  then explore more advanced options as you learn.
                </p>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700 hover:border-[#f5c249]/50 transition-all duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <svg width="24" height="24" viewBox="0 0 24 24">
                    <rect
                      x="4"
                      y="4"
                      width="16"
                      height="16"
                      rx="4"
                      fill="#f5c249"
                    />
                  </svg>
                  <h3 className="text-2xl font-semibold text-white">Simple</h3>
                </div>
                <p className="text-gray-400 leading-relaxed">
                  Intuitive interface, secure smart contracts, and full control
                  of your funds. DeFi doesn't have to be complicated.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-8">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-white mb-8">
              Ready to Earn Better Returns?
            </h2>
            <p className="text-gray-400 mb-12 text-xl leading-relaxed">
              Join thousands of users who've discovered how easy it is to earn
              more with RiseFi.
            </p>
            {isConnected ? (
              <button
                onClick={handleGoToDashboard}
                className="bg-[#f5c249] hover:bg-[#e6b142] text-gray-900 font-bold py-4 px-8 rounded-xl text-lg transition duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Access Dashboard
              </button>
            ) : (
              <div className="flex justify-center">
                <ConnectButton.Custom>
                  {({ openConnectModal }) => {
                    return (
                      <button
                        onClick={openConnectModal}
                        className="bg-[#f5c249] hover:bg-[#e6b142] text-gray-900 font-bold py-4 px-8 rounded-xl text-lg transition duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        Connect Wallet to Start Earning
                      </button>
                    );
                  }}
                </ConnectButton.Custom>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

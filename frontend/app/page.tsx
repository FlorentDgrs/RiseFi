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

  // Mounting optimization - faster
  useEffect(() => {
    // Immediate mounting to avoid latency
    setIsMounted(true);
  }, []);

  const handleGoToDashboard = () => {
    router.push("/dashboard");
  };

  // Show minimal loader only if not mounted yet
  if (!isMounted) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#f5c249] mx-auto mb-2"></div>
            <p className="text-gray-400 text-sm">Loading...</p>
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
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={() => router.push("/academy?section=wallet")}
                      className="text-[#f5c249] hover:text-[#e6b142] font-medium py-2 px-6 rounded-lg transition duration-200 border border-[#f5c249]/30 hover:border-[#f5c249] bg-transparent"
                    >
                      Get a Web3 Wallet →
                    </button>
                    <button
                      onClick={() => router.push("/academy")}
                      className="text-gray-400 hover:text-[#f5c249] font-medium py-2 px-6 rounded-lg transition duration-200 border border-gray-600/30 hover:border-[#f5c249]/30 bg-transparent"
                    >
                      Learn More About DeFi →
                    </button>
                  </div>
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
                      <span>
                        Better returns than Livret A (0.5% → 4%+ APY)
                        <button
                          onClick={() =>
                            router.push("/academy?section=understanding-apy")
                          }
                          className="ml-2 text-[#f5c249] hover:text-[#e6b142] text-sm underline transition-colors"
                        >
                          Learn about APY
                        </button>
                      </span>
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
                      <span>
                        Learn DeFi at your own pace
                        <button
                          onClick={() => router.push("/academy")}
                          className="ml-2 text-[#f5c249] hover:text-[#e6b142] text-sm underline transition-colors"
                        >
                          Start learning
                        </button>
                      </span>
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
              <div
                className="bg-gray-800/50 rounded-xl p-8 border border-gray-700 hover:border-[#f5c249]/50 transition-all duration-300 cursor-pointer group"
                onClick={() => router.push("/academy")}
              >
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
                  <h3 className="text-2xl font-semibold text-white group-hover:text-[#f5c249] transition-colors">
                    Education First
                  </h3>
                </div>
                <p className="text-gray-400 leading-relaxed mb-4">
                  Learn DeFi step by step. No confusing jargon, just clear
                  explanations of how your money works for you.
                </p>
                <div className="text-[#f5c249] text-sm font-medium group-hover:text-[#e6b142] transition-colors">
                  Visit RiseFi Academy →
                </div>
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
                  <h3 className="text-2xl font-semibold text-white">
                    Security & Transparency
                  </h3>
                </div>
                <p className="text-gray-400 leading-relaxed">
                  All our smart contracts are open source and audited. Your
                  funds are always under your control.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Start Earning?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of users who are already earning better returns
              with RiseFi.
            </p>
            {isConnected ? (
              <button
                onClick={handleGoToDashboard}
                className="bg-[#f5c249] hover:bg-[#e6b142] text-gray-900 font-bold py-4 px-8 rounded-xl text-lg transition duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Go to Dashboard
              </button>
            ) : (
              <ConnectButton.Custom>
                {({ openConnectModal }) => {
                  return (
                    <button
                      onClick={openConnectModal}
                      className="bg-[#f5c249] hover:bg-[#e6b142] text-gray-900 font-bold py-4 px-8 rounded-xl text-lg transition duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      Connect Wallet & Start Earning
                    </button>
                  );
                }}
              </ConnectButton.Custom>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

/* eslint-disable react/no-unescaped-entities */
"use client";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import { useAccount } from "wagmi";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

interface CourseSection {
  id: string;
  title: string;
  description: string;
  content: React.ReactNode;
  completed?: boolean;
  locked?: boolean;
}

interface CourseCategory {
  id: string;
  name: string;
  description: string;
  sections: CourseSection[];
}

// Function to generate course categories with proper connection state
function getCourseCategories(
  isMounted: boolean,
  isConnected: boolean
): CourseCategory[] {
  const isWalletConnected = isMounted && isConnected;

  return [
    {
      id: "getting-started",
      name: "Getting Started",
      description: "Essential steps to begin your DeFi journey",
      sections: [
        {
          id: "overview",
          title: "Welcome to RiseFi",
          description: "Introduction to RiseFi and DeFi basics",
          content: (
            <div className="space-y-6">
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-semibold text-[#f5c249] mb-4">
                  Welcome to RiseFi Academy
                </h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  RiseFi is a DeFi protocol that makes earning yield simple and
                  accessible. We use advanced strategies to generate better
                  returns than traditional savings accounts.
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                      <div className="bg-[#f5c249] text-gray-900 rounded-lg p-1">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                          />
                        </svg>
                      </div>
                      Simple & Safe
                    </h4>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      Deposit USDC and start earning immediately. No complex
                      strategies to understand.
                    </p>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                      <div className="bg-[#f5c249] text-gray-900 rounded-lg p-1">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                          />
                        </svg>
                      </div>
                      Better Returns
                    </h4>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      Earn significantly higher yields than traditional savings
                      accounts.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ),
        },
        {
          id: "wallet",
          title: "Get a Web3 Wallet",
          description: "Understanding and setting up your digital wallet",
          content: (
            <div className="space-y-6">
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-semibold text-[#f5c249] mb-4">
                  Why Do You Need a Web3 Wallet?
                </h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  A Web3 wallet is your digital identity and bank account in the
                  decentralized world. Unlike traditional banking where
                  institutions control your money, Web3 wallets give you
                  complete control over your digital assets.
                </p>
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-2">
                      Traditional Banking
                    </h4>
                    <ul className="space-y-1 text-gray-400 text-sm">
                      <li>• Banks control your money</li>
                      <li>• Limited access hours</li>
                      <li>• High fees</li>
                      <li>• Requires permission</li>
                      <li>• Slow transactions</li>
                    </ul>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-2">
                      Web3 Wallets
                    </h4>
                    <ul className="space-y-1 text-gray-400 text-sm">
                      <li>• You control your money</li>
                      <li>• 24/7 access</li>
                      <li>• Lower fees</li>
                      <li>• Permissionless</li>
                      <li>• Instant transactions</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-semibold text-[#f5c249] mb-4">
                  Recommended Wallets
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-[#f5c249]/10 rounded-lg border border-[#f5c249]/30">
                    <div className="bg-[#f5c249] text-gray-900 rounded-lg p-2">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                        Rabby Wallet (Recommended)
                        <span className="bg-[#f5c249] text-gray-900 text-xs px-2 py-1 rounded-full font-bold">
                          BEST
                        </span>
                      </h4>
                      <p className="text-gray-400 text-sm leading-relaxed mb-3">
                        Rabby is a DeFi-native wallet with advanced security
                        features, transaction simulation, and built-in risk
                        detection. Perfect for DeFi users.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded">
                          Security First
                        </span>
                        <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded">
                          DeFi Optimized
                        </span>
                        <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded">
                          Risk Detection
                        </span>
                      </div>
                      <a
                        href="https://rabby.io/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-3 bg-[#f5c249] hover:bg-[#e6b142] text-gray-900 font-bold py-2 px-4 rounded-lg transition duration-200 text-sm"
                      >
                        Download Rabby →
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-gray-900/30 rounded-lg">
                    <div className="bg-gray-600 text-white rounded-lg p-2">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-2">
                        MetaMask
                      </h4>
                      <p className="text-gray-400 text-sm leading-relaxed mb-3">
                        The most popular Web3 wallet with a large user base and
                        extensive ecosystem support.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded">
                          Popular
                        </span>
                        <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded">
                          Wide Support
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-gray-900/30 rounded-lg">
                    <div className="bg-gray-600 text-white rounded-lg p-2">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-2">
                        WalletConnect
                      </h4>
                      <p className="text-gray-400 text-sm leading-relaxed mb-3">
                        Connect any wallet to dApps using QR codes. Works with
                        mobile wallets like Trust Wallet.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded">
                          Mobile Friendly
                        </span>
                        <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded">
                          Universal
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-semibold text-[#f5c249] mb-4">
                  Security Best Practices
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-2">
                      Essential Security
                    </h4>
                    <ul className="space-y-2 text-gray-400 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-[#f5c249] mt-1">✓</span>
                        <span>Never share your private key or seed phrase</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#f5c249] mt-1">✓</span>
                        <span>Use a strong, unique password</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#f5c249] mt-1">✓</span>
                        <span>Store seed phrase offline (paper/steel)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#f5c249] mt-1">✓</span>
                        <span>Start with small amounts to test</span>
                      </li>
                    </ul>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-2">
                      Advanced Security
                    </h4>
                    <ul className="space-y-2 text-gray-400 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-[#f5c249] mt-1">✓</span>
                        <span>Use hardware wallets for large amounts</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#f5c249] mt-1">✓</span>
                        <span>Enable transaction simulation</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#f5c249] mt-1">✓</span>
                        <span>Verify contract addresses</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#f5c249] mt-1">✓</span>
                        <span>Use separate wallets for DeFi</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ),
        },
        {
          id: "usdc",
          title: "Get USDC",
          description: "Understanding and acquiring USDC",
          content: (
            <div className="space-y-6">
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-semibold text-[#f5c249] mb-4">
                  What is USDC?
                </h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  USDC is a stablecoin pegged to the US dollar. It's the
                  currency we use for all our strategies because it maintains a
                  stable value of $1 USD.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-2">
                      Buy from Exchanges
                    </h4>
                    <ul className="space-y-1 text-gray-400 text-sm">
                      <li>• Coinbase</li>
                      <li>• Binance</li>
                      <li>• Kraken</li>
                      <li>• Any major exchange</li>
                    </ul>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-2">
                      Bridge from Other Networks
                    </h4>
                    <ul className="space-y-1 text-gray-400 text-sm">
                      <li>• Use Base Bridge</li>
                      <li>• Transfer from Ethereum</li>
                      <li>• Use LayerZero</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ),
        },
        {
          id: "start-earning",
          title: "Start Earning",
          description: "Connect and deposit to begin earning",
          content: (
            <div className="space-y-6">
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-semibold text-[#f5c249] mb-4">
                  Ready to Start Earning
                </h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Once you have USDC in your wallet, you're ready to start
                  earning with RiseFi.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-[#f5c249] text-gray-900 rounded-lg p-2">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-2">
                        Connect Your Wallet
                      </h4>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        Click "Connect Wallet" on RiseFi and approve the
                        connection in your wallet.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="bg-[#f5c249] text-gray-900 rounded-lg p-2">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-2">
                        Deposit USDC
                      </h4>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        Enter the amount you want to deposit and click
                        "Deposit". Approve the transaction in your wallet.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="bg-[#f5c249] text-gray-900 rounded-lg p-2">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-2">
                        Watch Your Money Grow
                      </h4>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        Your USDC will start earning yield immediately. You can
                        withdraw anytime.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ),
        },
      ],
    },
    {
      id: "what-is-defi",
      name: "What is DeFi",
      description: "Understanding decentralized finance",
      sections: [
        {
          id: "defi-basics",
          title: "DeFi Fundamentals",
          description: "Core concepts of decentralized finance",
          content: (
            <div className="space-y-6">
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-semibold text-[#f5c249] mb-4">
                  What is DeFi?
                </h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  DeFi (Decentralized Finance) is a financial system built on
                  blockchain technology that operates without traditional
                  intermediaries like banks. It enables peer-to-peer financial
                  services that are open, permissionless, and transparent.
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-2">
                      Traditional Finance
                    </h4>
                    <ul className="space-y-1 text-gray-400 text-sm">
                      <li>• Banks control your money</li>
                      <li>• Limited access hours</li>
                      <li>• High fees</li>
                      <li>• Slow transactions</li>
                      <li>• Requires permission</li>
                    </ul>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-2">DeFi</h4>
                    <ul className="space-y-1 text-gray-400 text-sm">
                      <li>• You control your money</li>
                      <li>• 24/7 access</li>
                      <li>• Lower fees</li>
                      <li>• Fast transactions</li>
                      <li>• Permissionless</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ),
        },
        {
          id: "yield-farming",
          title: "Yield Farming Explained",
          description: "How DeFi generates returns",
          content: (
            <div className="space-y-6">
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-semibold text-[#f5c249] mb-4">
                  How Does Yield Farming Work?
                </h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Yield farming is the process of lending or staking your
                  cryptocurrencies to earn interest or rewards. DeFi protocols
                  use your deposited funds to provide loans to borrowers, and
                  you earn a portion of the interest paid.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-[#f5c249] text-gray-900 rounded-lg p-2">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-2">
                        You Deposit USDC
                      </h4>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        You provide USDC to the protocol's liquidity pool.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="bg-[#f5c249] text-gray-900 rounded-lg p-2">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-2">
                        Protocol Lends to Borrowers
                      </h4>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        The protocol uses your USDC to provide loans to
                        borrowers who pay interest.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="bg-[#f5c249] text-gray-900 rounded-lg p-2">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-2">
                        You Earn Interest
                      </h4>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        You receive a portion of the interest paid by borrowers,
                        typically much higher than traditional savings.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ),
        },
        {
          id: "understanding-apy",
          title: "Understanding APY",
          description: "What APY means and how it affects your returns",
          content: (
            <div className="space-y-6">
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-semibold text-[#f5c249] mb-4">
                  What is APY?
                </h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  APY stands for "Annual Percentage Yield" and represents the
                  total return you can expect to earn on your investment over
                  one year, including compound interest.
                </p>
                <div className="bg-[#f5c249]/10 rounded-lg p-4 border border-[#f5c249]/30 mb-6">
                  <h4 className="text-white font-semibold mb-2">
                    Key Takeaway
                  </h4>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    APY shows you the real earning potential of your investment,
                    taking into account how often your interest is compounded
                    (reinvested).
                  </p>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-semibold text-[#f5c249] mb-4">
                  APY vs APR: What's the Difference?
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-2">
                      APR (Annual Percentage Rate)
                    </h4>
                    <ul className="space-y-1 text-gray-400 text-sm">
                      <li>• Simple interest rate</li>
                      <li>• No compound interest</li>
                      <li>• Lower total returns</li>
                      <li>• Example: 4% APR = 4% total</li>
                    </ul>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-2">
                      APY (Annual Percentage Yield)
                    </h4>
                    <ul className="space-y-1 text-gray-400 text-sm">
                      <li>• Includes compound interest</li>
                      <li>• Interest on interest</li>
                      <li>• Higher total returns</li>
                      <li>• Example: 4% APY = 4.08% total</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-semibold text-[#f5c249] mb-4">
                  How Compound Interest Works
                </h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Compound interest is when your earned interest is reinvested,
                  allowing you to earn interest on your interest. This creates
                  exponential growth over time.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-[#f5c249] text-gray-900 rounded-lg p-2">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-2">
                        Initial Investment
                      </h4>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        You deposit $1,000 USDC at 4% APY
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="bg-[#f5c249] text-gray-900 rounded-lg p-2">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-2">
                        Interest Earned
                      </h4>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        After 1 year: $1,040 (4% interest earned)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="bg-[#f5c249] text-gray-900 rounded-lg p-2">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-2">
                        Compound Growth
                      </h4>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        Interest is reinvested, so you earn interest on $1,050
                        in year 2
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-semibold text-[#f5c249] mb-4">
                  Why APY Matters for Your Returns
                </h3>
                <div className="space-y-4">
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-2">
                      Real Return Calculation
                    </h4>
                    <p className="text-gray-300 text-sm leading-relaxed mb-3">
                      Let's compare different APY rates on a $1,000 investment
                      over 5 years:
                    </p>
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-[#f5c249] font-bold text-lg">
                          2% APY
                        </div>
                        <div className="text-gray-400">
                          $1,104 after 5 years
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-[#f5c249] font-bold text-lg">
                          4% APY
                        </div>
                        <div className="text-gray-400">
                          $1,276 after 5 years
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-[#f5c249] font-bold text-lg">
                          10% APY
                        </div>
                        <div className="text-gray-400">
                          $1,611 after 5 years
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-2">
                      The Power of Higher APY
                    </h4>
                    <ul className="space-y-1 text-gray-400 text-sm">
                      <li>
                        • Small differences in APY create huge differences over
                        time
                      </li>
                      <li>• 4% vs 2% APY = 100% more money after 5 years</li>
                      <li>
                        • Compound interest accelerates your wealth building
                      </li>
                      <li>• Time is your greatest ally in investing</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-semibold text-[#f5c249] mb-4">
                  RiseFi's APY Advantage
                </h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  RiseFi's EasyVest strategy delivers 4%+ APY, significantly
                  outperforming traditional savings accounts while maintaining
                  safety and simplicity.
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-2">
                      Traditional Savings
                    </h4>
                    <ul className="space-y-1 text-gray-400 text-sm">
                      <li>• Livret A: 0.5% APY</li>
                      <li>• Bank savings: 0.1-1% APY</li>
                      <li>• Money market: 1-2% APY</li>
                      <li>• Inflation eats your returns</li>
                    </ul>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-2">
                      RiseFi EasyVest
                    </h4>
                    <ul className="space-y-1 text-gray-400 text-sm">
                      <li>• 4%+ APY average</li>
                      <li>• 10x better than traditional</li>
                      <li>• Beats inflation</li>
                      <li>• Compound growth</li>
                    </ul>
                  </div>
                </div>

                {/* Disclaimer */}
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mt-6">
                  <div className="flex items-start gap-3">
                    <div className="bg-yellow-500 text-gray-900 rounded-lg p-1 mt-0.5">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-yellow-400 font-semibold mb-2">
                        Important Information
                      </h4>
                      <ul className="text-gray-300 text-sm space-y-1">
                        <li>
                          • APY rates are variable and subject to change in
                          real-time
                        </li>
                        <li>
                          • Past performance does not guarantee future returns
                        </li>
                        <li>
                          • Management fees may apply and reduce net returns
                        </li>
                        <li>
                          • Current rates are for illustrative purposes only
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ),
        },
      ],
    },
    {
      id: "defi-strategy",
      name: "DeFi Strategy 101",
      description: "Advanced DeFi strategies and concepts",
      sections: [
        {
          id: "strategy-overview",
          title: "How DeFi Lending Works",
          description: "Understanding the basics of lending and borrowing",
          locked: true,
          content: (
            <div className="space-y-6">
              {!isWalletConnected ? (
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-red-500 text-white rounded-lg p-2">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-red-400">
                      This section requires a connected wallet
                    </h3>
                  </div>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    To access advanced DeFi strategy content, please connect
                    your wallet first. This ensures you have the necessary
                    context to understand these concepts.
                  </p>
                  <div className="flex justify-center">
                    <ConnectButton.Custom>
                      {({ openConnectModal }) => {
                        return (
                          <button
                            onClick={openConnectModal}
                            className="bg-[#f5c249] hover:bg-[#e6b142] text-gray-900 font-bold py-3 px-6 rounded-xl transition duration-200 shadow-lg hover:shadow-xl"
                          >
                            Connect Wallet to Continue
                          </button>
                        );
                      }}
                    </ConnectButton.Custom>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                    <h3 className="text-xl font-semibold text-[#f5c249] mb-4">
                      The DeFi Lending Revolution
                    </h3>
                    <p className="text-gray-300 leading-relaxed mb-4">
                      DeFi lending eliminates traditional banks by connecting
                      lenders directly with borrowers through smart contracts.
                      This creates a more efficient system where you can earn
                      higher yields.
                    </p>
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="bg-[#f5c249] text-gray-900 rounded-lg p-2">
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                            />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-white font-semibold mb-2">
                            You Deposit Assets
                          </h4>
                          <p className="text-gray-400 text-sm leading-relaxed">
                            You provide USDC to the lending pool and receive
                            interest-bearing tokens representing your share.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="bg-[#f5c249] text-gray-900 rounded-lg p-2">
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                            />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-white font-semibold mb-2">
                            Borrowers Use Your Funds
                          </h4>
                          <p className="text-gray-400 text-sm leading-relaxed">
                            Borrowers deposit collateral and borrow your USDC,
                            paying interest on their loans.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="bg-[#f5c249] text-gray-900 rounded-lg p-2">
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                            />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-white font-semibold mb-2">
                            You Earn Interest
                          </h4>
                          <p className="text-gray-400 text-sm leading-relaxed">
                            The interest paid by borrowers is distributed to
                            lenders like you, typically much higher than
                            traditional savings.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                    <h3 className="text-xl font-semibold text-[#f5c249] mb-4">
                      Why DeFi Lending is Better
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-gray-900/50 rounded-lg p-4">
                        <h4 className="text-white font-semibold mb-2">
                          Traditional Savings
                        </h4>
                        <ul className="space-y-1 text-gray-400 text-sm">
                          <li>• 0.5% APY (Livret A)</li>
                          <li>• Banks take most profits</li>
                          <li>• Limited access</li>
                          <li>• High fees</li>
                          <li>• Slow transactions</li>
                        </ul>
                      </div>
                      <div className="bg-gray-900/50 rounded-lg p-4">
                        <h4 className="text-white font-semibold mb-2">
                          DeFi Lending
                        </h4>
                        <ul className="space-y-1 text-gray-400 text-sm">
                          <li>• 4%+ APY average</li>
                          <li>• You keep all profits</li>
                          <li>• 24/7 access</li>
                          <li>• Minimal fees</li>
                          <li>• Instant transactions</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ),
        },
        {
          id: "morpho-integration",
          title: "EasyVest Strategy",
          description: "Why USDC and RiseFi's approach work so well",
          locked: true,
          content: (
            <div className="space-y-6">
              {!isWalletConnected ? (
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-red-500 text-white rounded-lg p-2">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-red-400">
                      This section requires a connected wallet
                    </h3>
                  </div>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    To access advanced DeFi strategy content, please connect
                    your wallet first. This ensures you have the necessary
                    context to understand these concepts.
                  </p>
                  <div className="flex justify-center">
                    <ConnectButton.Custom>
                      {({ openConnectModal }) => {
                        return (
                          <button
                            onClick={openConnectModal}
                            className="bg-[#f5c249] hover:bg-[#e6b142] text-gray-900 font-bold py-3 px-6 rounded-xl transition duration-200 shadow-lg hover:shadow-xl"
                          >
                            Connect Wallet to Continue
                          </button>
                        );
                      }}
                    </ConnectButton.Custom>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                    <h3 className="text-xl font-semibold text-[#f5c249] mb-4">
                      EasyVest: Your Perfect DeFi Strategy
                    </h3>
                    <p className="text-gray-300 leading-relaxed mb-4">
                      EasyVest is RiseFi's flagship strategy designed for
                      beginners and experienced users alike. It combines the
                      stability of USDC with advanced DeFi lending to generate
                      consistent, high yields.
                    </p>
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="bg-[#f5c249] text-gray-900 rounded-lg p-2">
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-white font-semibold mb-2">
                            Simple & Safe
                          </h4>
                          <p className="text-gray-400 text-sm leading-relaxed">
                            Deposit USDC and start earning immediately. No
                            complex strategies to understand or manage.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="bg-[#f5c249] text-gray-900 rounded-lg p-2">
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                            />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-white font-semibold mb-2">
                            High Yields
                          </h4>
                          <p className="text-gray-400 text-sm leading-relaxed">
                            Earn 4%+ APY on average, much higher than
                            traditional savings accounts.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="bg-[#f5c249] text-gray-900 rounded-lg p-2">
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                            />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-white font-semibold mb-2">
                            Liquidity
                          </h4>
                          <p className="text-gray-400 text-sm leading-relaxed">
                            Withdraw your funds anytime without penalties or
                            waiting periods.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                    <h3 className="text-xl font-semibold text-[#f5c249] mb-4">
                      Why USDC is Perfect for Yield Generation
                    </h3>
                    <p className="text-gray-300 leading-relaxed mb-4">
                      USDC (USD Coin) is the ideal asset for DeFi lending
                      strategies. Here's why it's our preferred choice:
                    </p>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-gray-900/50 rounded-lg p-4">
                        <h4 className="text-white font-semibold mb-2">
                          Stability
                        </h4>
                        <ul className="space-y-1 text-gray-400 text-sm">
                          <li>• Pegged to USD (1 USDC = $1)</li>
                          <li>• No price volatility</li>
                          <li>• Predictable returns</li>
                          <li>• No impermanent loss</li>
                        </ul>
                      </div>
                      <div className="bg-gray-900/50 rounded-lg p-4">
                        <h4 className="text-white font-semibold mb-2">
                          Liquidity
                        </h4>
                        <ul className="space-y-1 text-gray-400 text-sm">
                          <li>• Highest trading volume</li>
                          <li>• Available on all exchanges</li>
                          <li>• Easy to buy/sell</li>
                          <li>• Low slippage</li>
                        </ul>
                      </div>
                      <div className="bg-gray-900/50 rounded-lg p-4">
                        <h4 className="text-white font-semibold mb-2">
                          DeFi Integration
                        </h4>
                        <ul className="space-y-1 text-gray-400 text-sm">
                          <li>• Supported by all protocols</li>
                          <li>• High demand from borrowers</li>
                          <li>• Competitive lending rates</li>
                          <li>• Efficient capital utilization</li>
                        </ul>
                      </div>
                      <div className="bg-gray-900/50 rounded-lg p-4">
                        <h4 className="text-white font-semibold mb-2">
                          Regulation
                        </h4>
                        <ul className="space-y-1 text-gray-400 text-sm">
                          <li>• Backed by real USD reserves</li>
                          <li>• Regular audits</li>
                          <li>• Regulatory compliance</li>
                          <li>• Trusted by institutions</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                    <h3 className="text-xl font-semibold text-[#f5c249] mb-4">
                      How EasyVest Maximizes Your Returns
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="bg-[#f5c249] text-gray-900 rounded-lg p-2">
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-white font-semibold mb-2">
                            Smart Allocation
                          </h4>
                          <p className="text-gray-400 text-sm leading-relaxed">
                            Our algorithms automatically allocate your USDC
                            across the best lending opportunities to maximize
                            yields.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="bg-[#f5c249] text-gray-900 rounded-lg p-2">
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-white font-semibold mb-2">
                            Risk Management
                          </h4>
                          <p className="text-gray-400 text-sm leading-relaxed">
                            We only use established, audited protocols with
                            proven track records to ensure your capital is safe.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="bg-[#f5c249] text-gray-900 rounded-lg p-2">
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                            />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-white font-semibold mb-2">
                            Compound Interest
                          </h4>
                          <p className="text-gray-400 text-sm leading-relaxed">
                            Your earnings are automatically reinvested, creating
                            exponential growth over time.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ),
        },
      ],
    },
  ];
}

export default function AcademyContent() {
  const { isConnected } = useAccount();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMounted, setIsMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState("getting-started");
  const [activeSection, setActiveSection] = useState("overview");

  useEffect(() => {
    setIsMounted(true);

    // Check for section parameter in URL
    const sectionParam = searchParams.get("section");
    if (sectionParam) {
      // Find the category and section
      for (const category of getCourseCategories(isMounted, isConnected)) {
        const section = category.sections.find((s) => s.id === sectionParam);
        if (section) {
          setActiveCategory(category.id);
          setActiveSection(section.id);
          break;
        }
      }
    }
  }, [searchParams, isMounted, isConnected]);

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

  // Get course categories with proper connection state
  const courseCategories = getCourseCategories(isMounted, isConnected);

  const activeCategoryData = courseCategories.find(
    (cat) => cat.id === activeCategory
  );
  const activeSectionData = activeCategoryData?.sections.find(
    (sec) => sec.id === activeSection
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 px-8 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-[#f5c249] mb-8 tracking-tight">
              RiseFi Academy
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-6 leading-relaxed">
              Master DeFi in Simple Steps
            </p>
            <p className="text-lg text-gray-400 mb-8 max-w-3xl mx-auto leading-relaxed">
              New to DeFi? No worries! This comprehensive course will teach you
              everything you need to know about RiseFi and how to start earning
              better returns than traditional savings.
            </p>

            {isMounted && isConnected ? (
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

        {/* Course Content with Sidebar */}
        <section className="py-16 px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Sidebar */}
              <div className="lg:w-80 flex-shrink-0">
                <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6 sticky top-8">
                  <h3 className="text-xl font-bold text-white mb-6">
                    Course Categories
                  </h3>

                  {courseCategories.map((category) => (
                    <div key={category.id} className="mb-6">
                      <button
                        onClick={() => {
                          setActiveCategory(category.id);
                          setActiveSection(category.sections[0]?.id || "");
                        }}
                        className={`w-full text-left p-3 rounded-lg transition duration-200 ${
                          activeCategory === category.id
                            ? "bg-[#f5c249] text-gray-900"
                            : "text-gray-300 hover:bg-gray-700 hover:text-white"
                        }`}
                      >
                        <div className="font-semibold">{category.name}</div>
                        <div className="text-sm opacity-75">
                          {category.description}
                        </div>
                      </button>

                      {activeCategory === category.id && (
                        <div className="mt-3 ml-4 space-y-2">
                          {category.sections.map((section) => (
                            <button
                              key={section.id}
                              onClick={() => setActiveSection(section.id)}
                              disabled={
                                section.locked && !(isMounted && isConnected)
                              }
                              className={`w-full text-left p-2 rounded transition duration-200 text-sm flex items-center gap-2 ${
                                activeSection === section.id
                                  ? "text-[#f5c249] bg-gray-700"
                                  : section.locked &&
                                    !(isMounted && isConnected)
                                  ? "text-gray-500 cursor-not-allowed"
                                  : "text-gray-400 hover:text-gray-300 hover:bg-gray-700"
                              }`}
                            >
                              {section.locked &&
                                !(isMounted && isConnected) && (
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                    />
                                  </svg>
                                )}
                              {section.title}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1">
                {activeSectionData && (
                  <div className="space-y-8">
                    <div className="mb-8">
                      <h2 className="text-3xl font-bold text-white mb-4">
                        {activeSectionData.title}
                      </h2>
                      <p className="text-gray-400 text-lg">
                        {activeSectionData.description}
                      </p>
                    </div>
                    {activeSectionData.content}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

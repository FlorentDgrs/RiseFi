"use client";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import ActionCard from "@/components/shared/ActionCard";
import { useVaultUserStats } from "@/utils/hooks/useVaultUserStats";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import Link from "next/link";

const VAULT_ADDRESS_APY = "0x7BfA7C4f149E7415b73bdeDfe609237e29CBF34A";
const CHAIN_ID = 8453; // Base
const MORPHO_API_URL = "https://api.morpho.org/graphql";

export default function Dashboard() {
  const stats = useVaultUserStats();
  const { isConnected } = useAccount();
  const router = useRouter();

  // Redirect to home if not connected
  useEffect(() => {
    if (!isConnected) {
      router.push("/");
    }
  }, [isConnected, router]);

  // APY state
  const [apy, setApy] = useState<number | null>(null);
  const [apyLoading, setApyLoading] = useState<boolean>(true);

  // Fetch APY
  useEffect(() => {
    const fetchApy = async () => {
      setApyLoading(true);
      try {
        const query = `
          query {
            vaultByAddress(
              address: "${VAULT_ADDRESS_APY}"
              chainId: ${CHAIN_ID}
            ) {
              address
              state {
                netApy
                apy
              }
            }
          }
        `;
        const response = await fetch(MORPHO_API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });
        const data = await response.json();
        const vault = data?.data?.vaultByAddress;
        const netApy = vault?.state?.netApy ?? vault?.state?.apy;
        if (typeof netApy === "number") {
          setApy(netApy);
        } else {
          setApy(null);
        }
      } catch {
        setApy(null);
      } finally {
        setApyLoading(false);
      }
    };
    fetchApy();
    const interval = setInterval(fetchApy, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-5xl mx-auto flex flex-col items-center md:items-start justify-center">
          {/* Dashboard Title */}
          <div className="w-full text-center mb-8">
            <h1 className="text-4xl font-bold text-[#f5c249]">Dashboard</h1>
          </div>
          {/* Carte unique : Wallet + EasyInvest + Actions */}
          <div className="w-full max-w-md bg-gray-900/90 rounded-2xl p-8 shadow-xl border border-gray-700 flex flex-col gap-6 mx-auto">
            {/* Strategy header */}
            <div className="flex items-center justify-between">
              <span className="text-gray-200 font-semibold text-lg">
                Strategy: EasyInvest
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[#f5c249] text-lg font-bold">
                  {apyLoading
                    ? "...%"
                    : apy !== null
                    ? `${(apy * 100).toFixed(2)}%`
                    : "-"}
                </span>
                <Link
                  href="/academy?section=understanding-apy"
                  className="group relative"
                >
                  <svg
                    className="w-4 h-4 text-gray-400 hover:text-[#f5c249] transition-colors cursor-help"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                    What is APY? Learn more
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                </Link>
              </div>
            </div>
            <div className="mb-2">
              <span className="font-mono text-green-400 text-sm">
                Invested: {stats.investedAmountStr} USDC
              </span>
            </div>
            {/* EasyInvest + Actions */}
            <ActionCard
              usdcBalanceStr={stats.usdcBalanceStr}
              maxWithdrawStr={stats.maxWithdrawStr}
              refetchStats={stats.refetch}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

import React, { useEffect, useState } from "react";
import Link from "next/link";

const VAULT_ADDRESS = "0x7BfA7C4f149E7415b73bdeDfe609237e29CBF34A";
const CHAIN_ID = 8453; // Base
const MORPHO_API_URL = "https://api.morpho.org/graphql";

const VaultApyDisplay: React.FC = () => {
  const [apy, setApy] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApy = async () => {
    setLoading(true);
    setError(null);
    try {
      const query = `
        query {
          vaultByAddress(
            address: "${VAULT_ADDRESS}"
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
      console.log("Morpho API Response:", data);

      const vault = data?.data?.vaultByAddress;
      const netApy = vault?.state?.netApy ?? vault?.state?.apy;
      if (typeof netApy === "number") {
        setApy(netApy);
      } else {
        setApy(null);
        setError("APY not available");
      }
    } catch (e) {
      setError("Error fetching APY");
      setApy(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApy();
    const interval = setInterval(fetchApy, 60000); // Refresh every 60s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8 rounded-xl bg-gray-800/30">
      <h3 className="font-semibold mb-6 text-white text-2xl text-center">
        EasyVest Current Yield
      </h3>
      {loading ? (
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#f5c249]"></div>
          <span className="text-gray-300">Loading yield...</span>
        </div>
      ) : error ? (
        <span className="text-red-400">{error}</span>
      ) : apy !== null ? (
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-[#f5c249] text-4xl font-bold">
              {(apy * 100).toFixed(2)}%
            </span>
            <Link
              href="/academy?section=understanding-apy"
              className="group relative"
            >
              <svg
                className="w-5 h-5 text-gray-400 hover:text-[#f5c249] transition-colors cursor-help"
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
          <p className="text-gray-400 text-sm mt-2">Annual Percentage Yield</p>
        </div>
      ) : (
        <span className="text-gray-400">Not available</span>
      )}
      <div className="text-xs text-gray-500 mt-6 text-center">
        Live performance data
      </div>
    </div>
  );
};

export default VaultApyDisplay;

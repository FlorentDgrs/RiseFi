import { ethers } from "hardhat";

async function main() {
  console.log("🔍 Test d'intégration Morpho sur Base mainnet...");

  // Récupérer le provider Hardhat (fork de Base)
  const provider = ethers.provider;

  // Vérifier que nous sommes sur Base
  const network = await provider.getNetwork();
  console.log("🌐 Réseau:", network.name, "ChainId:", network.chainId);

  // Récupérer un compte de test
  const [deployer] = await ethers.getSigners();
  console.log("👤 Compte de test:", deployer.address);

  // Vérifier le solde ETH
  const balance = await provider.getBalance(deployer.address);
  console.log("💰 Solde ETH:", ethers.formatEther(balance), "ETH");

  // Adresses importantes sur Base
  const addresses = {
    USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    WETH: "0x4200000000000000000000000000000000000006",
    // Morpho addresses (à compléter)
    MORPHO_BLUE: "0x64c7044050ba6c5b8c4c3b3b8c4c3b3b8c4c3b3b", // Placeholder
  };

  console.log("\n📋 Adresses importantes sur Base:");
  console.log("USDC:", addresses.USDC);
  console.log("WETH:", addresses.WETH);
  console.log("Morpho Blue:", addresses.MORPHO_BLUE);

  // Test de lecture d'un contrat (USDC)
  try {
    const usdcContract = new ethers.Contract(
      addresses.USDC,
      [
        "function name() view returns (string)",
        "function symbol() view returns (string)",
      ],
      provider
    );

    const name = await usdcContract.name();
    const symbol = await usdcContract.symbol();
    console.log("✅ USDC contract accessible:", name, "(", symbol, ")");
  } catch (error) {
    console.log("❌ Erreur lecture USDC:", (error as Error).message);
  }

  console.log("\n🎉 Test de base terminé !");
  console.log("📝 Prochaine étape: Intégration SDK Morpho");
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exitCode = 1;
});

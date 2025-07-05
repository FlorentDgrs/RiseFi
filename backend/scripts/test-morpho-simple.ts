import { ethers } from "hardhat";

async function main() {
  console.log("🔍 Test simple d'intégration Morpho...");

  // Récupérer le provider Hardhat (réseau local)
  const provider = ethers.provider;

  // Vérifier le réseau
  const network = await provider.getNetwork();
  console.log("🌐 Réseau:", network.name, "ChainId:", network.chainId);

  // Récupérer un compte de test
  const [deployer] = await ethers.getSigners();
  console.log("👤 Compte de test:", deployer.address);

  // Vérifier le solde ETH
  const balance = await provider.getBalance(deployer.address);
  console.log("💰 Solde ETH:", ethers.formatEther(balance), "ETH");

  // Test de déploiement de MockUSDC
  console.log("\n🚀 Test de déploiement MockUSDC...");

  try {
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUSDC = await MockUSDC.deploy();
    await mockUSDC.waitForDeployment();

    const mockUSDCAddress = await mockUSDC.getAddress();
    console.log("✅ MockUSDC déployé à:", mockUSDCAddress);

    // Test de mint
    const mintAmount = ethers.parseUnits("1000", 6);
    const mintTx = await mockUSDC.mint(deployer.address, mintAmount);
    await mintTx.wait();

    const usdcBalance = await mockUSDC.balanceOf(deployer.address);
    console.log("✅ Mint réussi:", ethers.formatUnits(usdcBalance, 6), "USDC");
  } catch (error) {
    console.log("❌ Erreur déploiement MockUSDC:", (error as Error).message);
  }

  console.log("\n🎉 Test simple terminé !");
  console.log("📝 Prochaine étape: Intégration avec Base mainnet");
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exitCode = 1;
});

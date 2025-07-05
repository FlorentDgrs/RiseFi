import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Configuration de l'environnement de développement...");

  const [deployer] = await ethers.getSigners();
  console.log("👤 Deployer:", deployer.address);

  // 1. Déployer MockUSDC
  console.log("\n📦 Déploiement MockUSDC...");
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy();
  await mockUSDC.waitForDeployment();
  const mockUSDCAddress = await mockUSDC.getAddress();
  console.log("✅ MockUSDC déployé à:", mockUSDCAddress);

  // 2. Mint des USDC pour les tests
  const mintAmount = ethers.parseUnits("1000000", 6); // 1M USDC
  const mintTx = await mockUSDC.mint(deployer.address, mintAmount);
  await mintTx.wait();
  console.log("✅ Mint de", ethers.formatUnits(mintAmount, 6), "USDC");

  // 3. Déployer RiseFiUSDCVault
  console.log("\n🏦 Déploiement RiseFiUSDCVault...");
  const RiseFiUSDCVault = await ethers.getContractFactory("RiseFiUSDCVault");
  const vault = await RiseFiUSDCVault.deploy(mockUSDCAddress);
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("✅ RiseFiUSDCVault déployé à:", vaultAddress);

  // 4. Afficher les adresses pour les tests
  console.log("\n📋 Adresses de développement:");
  console.log("MockUSDC:", mockUSDCAddress);
  console.log("RiseFiUSDCVault:", vaultAddress);
  console.log("Deployer:", deployer.address);

  // 5. Test de base du vault
  console.log("\n🧪 Test de base du vault...");
  const depositAmount = ethers.parseUnits("1000", 6);

  // Approve USDC pour le vault
  const approveTx = await mockUSDC.approve(vaultAddress, depositAmount);
  await approveTx.wait();
  console.log("✅ USDC approuvé pour le vault");

  // Dépôt dans le vault
  const depositTx = await vault.deposit(depositAmount, deployer.address);
  await depositTx.wait();
  console.log(
    "✅ Dépôt de",
    ethers.formatUnits(depositAmount, 6),
    "USDC dans le vault"
  );

  // Vérifier les shares
  const shares = await vault.balanceOf(deployer.address);
  console.log("✅ Shares reçues:", ethers.formatUnits(shares, 18));

  console.log("\n🎉 Configuration de développement terminée !");
  console.log("📝 Prêt pour l'intégration SDK Morpho");
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exitCode = 1;
});

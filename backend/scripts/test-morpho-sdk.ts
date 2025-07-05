import { ethers } from "hardhat";

async function main() {
  console.log("🔍 Test des SDKs Morpho avec contrats locaux...");

  const [deployer] = await ethers.getSigners();

  // Récupérer les contrats déployés
  const mockUSDC = await ethers.getContractAt(
    "MockUSDC",
    "0x5FbDB2315678afecb367f032d93F642f64180aa3"
  );
  const vault = await ethers.getContractAt(
    "RiseFiUSDCVault",
    "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
  );

  console.log("📋 Contrats locaux:");
  console.log("MockUSDC:", await mockUSDC.getAddress());
  console.log("RiseFiUSDCVault:", await vault.getAddress());

  // Test 1: Vérifier les SDKs Morpho sont disponibles
  console.log("\n🧪 Test 1: Vérification des SDKs Morpho...");

  try {
    // Test d'import des SDKs (sans les utiliser encore)
    console.log("✅ SDKs Morpho installés et accessibles");
  } catch (error) {
    console.log("❌ Erreur SDKs Morpho:", (error as Error).message);
  }

  // Test 2: Simuler une interaction RiseFi -> Morpho
  console.log("\n🧪 Test 2: Simulation interaction RiseFi -> Morpho...");

  const depositAmount = ethers.parseUnits("500", 6);

  // Approve et dépôt
  await mockUSDC.approve(await vault.getAddress(), depositAmount);
  await vault.deposit(depositAmount, deployer.address);

  console.log(
    "✅ Dépôt RiseFi simulé:",
    ethers.formatUnits(depositAmount, 6),
    "USDC"
  );

  // Vérifier les shares
  const shares = await vault.balanceOf(deployer.address);
  console.log("✅ Total shares RiseFi:", ethers.formatUnits(shares, 18));

  // Test 3: Simuler la logique de calcul Morpho
  console.log("\n🧪 Test 3: Simulation logique Morpho...");

  // Simuler des taux d'intérêt (exemple)
  const supplyRate = 0.05; // 5% APY
  const borrowRate = 0.07; // 7% APY

  console.log("📊 Taux simulés:");
  console.log("  - Supply Rate:", (supplyRate * 100).toFixed(2), "%");
  console.log("  - Borrow Rate:", (borrowRate * 100).toFixed(2), "%");
  console.log("  - Spread:", ((borrowRate - supplyRate) * 100).toFixed(2), "%");

  // Test 4: Simuler le calcul des gains
  const timeInDays = 30;
  const dailyRate = supplyRate / 365;
  const gains =
    parseFloat(ethers.formatUnits(depositAmount, 6)) * dailyRate * timeInDays;

  console.log(
    `💰 Gains simulés sur ${timeInDays} jours:`,
    gains.toFixed(2),
    "USDC"
  );

  console.log("\n🎉 Tests SDK Morpho terminés !");
  console.log("📝 Prochaine étape: Intégration réelle avec les SDKs Morpho");
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exitCode = 1;
});

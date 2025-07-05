import { ethers } from "hardhat";

async function main() {
  console.log("🧪 Test de la logique des shares...");

  const [deployer] = await ethers.getSigners();

  // Récupérer les contrats
  const mockUSDC = await ethers.getContractAt(
    "MockUSDC",
    "0x5FbDB2315678afecb367f032d93F642f64180aa3"
  );
  const vault = await ethers.getContractAt(
    "RiseFiUSDCVault",
    "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
  );

  console.log("📊 État initial:");
  console.log(
    "Total shares:",
    ethers.formatUnits(await vault.totalSupply(), 18)
  );
  console.log(
    "Total assets:",
    ethers.formatUnits(await vault.totalAssets(), 6)
  );

  // Premier dépôt
  const deposit1 = ethers.parseUnits("1000", 6);
  await mockUSDC.approve(await vault.getAddress(), deposit1);
  await vault.deposit(deposit1, deployer.address);

  console.log("\n📊 Après premier dépôt (1000 USDC):");
  console.log(
    "Total shares:",
    ethers.formatUnits(await vault.totalSupply(), 18)
  );
  console.log(
    "Total assets:",
    ethers.formatUnits(await vault.totalAssets(), 6)
  );
  console.log(
    "Shares utilisateur:",
    ethers.formatUnits(await vault.balanceOf(deployer.address), 18)
  );

  // Deuxième dépôt
  const deposit2 = ethers.parseUnits("500", 6);
  await mockUSDC.approve(await vault.getAddress(), deposit2);
  await vault.deposit(deposit2, deployer.address);

  console.log("\n📊 Après deuxième dépôt (500 USDC):");
  console.log(
    "Total shares:",
    ethers.formatUnits(await vault.totalSupply(), 18)
  );
  console.log(
    "Total assets:",
    ethers.formatUnits(await vault.totalAssets(), 6)
  );
  console.log(
    "Shares utilisateur:",
    ethers.formatUnits(await vault.balanceOf(deployer.address), 18)
  );

  // Test de conversion
  const shares = await vault.balanceOf(deployer.address);
  const assets = await vault.convertToAssets(shares);

  console.log("\n🔄 Test de conversion:");
  console.log("Shares -> Assets:", ethers.formatUnits(assets, 6), "USDC");
  console.log(
    "Assets -> Shares:",
    ethers.formatUnits(await vault.convertToShares(assets), 18),
    "Shares"
  );

  console.log("\n✅ Test des shares terminé !");
}

main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exitCode = 1;
});

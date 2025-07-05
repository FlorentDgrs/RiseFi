import { ethers } from "hardhat";

async function main() {
  console.log("🧪 Test de la logique des shares (version corrigée)...");

  const [deployer] = await ethers.getSigners();

  // 1. Déployer MockUSDC
  console.log("\n📦 Déploiement MockUSDC...");
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy();
  await mockUSDC.waitForDeployment();
  const mockUSDCAddress = await mockUSDC.getAddress();
  console.log("✅ MockUSDC déployé à:", mockUSDCAddress);

  // 2. Mint des USDC
  const mintAmount = ethers.parseUnits("1000000", 6);
  await mockUSDC.mint(deployer.address, mintAmount);
  console.log("✅ Mint de", ethers.formatUnits(mintAmount, 6), "USDC");

  // 3. Déployer RiseFiUSDCVault
  console.log("\n🏦 Déploiement RiseFiUSDCVault...");
  const RiseFiUSDCVault = await ethers.getContractFactory("RiseFiUSDCVault");
  const vault = await RiseFiUSDCVault.deploy(mockUSDCAddress);
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("✅ RiseFiUSDCVault déployé à:", vaultAddress);

  // 4. Test des shares
  console.log("\n📊 État initial:");
  console.log(
    "Total shares:",
    ethers.formatUnits(await vault.totalSupply(), 18)
  );
  console.log(
    "Total assets:",
    ethers.formatUnits(await vault.totalAssets(), 6)
  );

  // Premier dépôt - Montant plus grand
  const deposit1 = ethers.parseUnits("100000", 6); // 100,000 USDC
  await mockUSDC.approve(vaultAddress, deposit1);
  await vault.deposit(deposit1, deployer.address);

  console.log("\n📊 Après premier dépôt (100,000 USDC):");
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

  // Deuxième dépôt - Montant plus grand
  const deposit2 = ethers.parseUnits("50000", 6); // 50,000 USDC
  await mockUSDC.approve(vaultAddress, deposit2);
  await vault.deposit(deposit2, deployer.address);

  console.log("\n📊 Après deuxième dépôt (50,000 USDC):");
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

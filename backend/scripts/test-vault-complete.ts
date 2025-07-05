import { ethers } from "hardhat";

async function main() {
  const [deployer, user] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("User:", user.address);

  // Deploy MockUSDC
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUsdc = await MockUSDC.deploy();
  await mockUsdc.waitForDeployment();
  const usdcAddress = await mockUsdc.getAddress();
  console.log("MockUSDC:", usdcAddress);

  // Deploy MockMorphoToken
  const MockMorphoToken = await ethers.getContractFactory("MockMorphoToken");
  const mockMorphoToken = await MockMorphoToken.deploy(
    "Morpho USDC",
    "morphoUSDC",
    usdcAddress
  );
  await mockMorphoToken.waitForDeployment();
  const morphoTokenAddress = await mockMorphoToken.getAddress();
  console.log("MockMorphoToken:", morphoTokenAddress);

  // Deploy MockMorpho
  const MockMorpho = await ethers.getContractFactory("MockMorpho");
  const mockMorpho = await MockMorpho.deploy();
  await mockMorpho.waitForDeployment();
  const morphoAddress = await mockMorpho.getAddress();
  console.log("MockMorpho:", morphoAddress);

  // Configure MockMorphoToken
  await mockMorphoToken.setMorphoContract(morphoAddress);
  console.log("MockMorphoToken configured");

  // Create USDC market on Morpho
  await mockMorpho.createMarket(usdcAddress, 50, 200); // 0.5% supply, 2% borrow
  console.log("USDC market created on Morpho");

  // Set morpho token for USDC market
  await mockMorpho.setMorphoToken(usdcAddress, morphoTokenAddress);
  console.log("Morpho token set for USDC market");

  // Deploy Vault
  const Vault = await ethers.getContractFactory("RiseFiUSDCVault");
  const vault = await Vault.deploy(usdcAddress);
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("Vault:", vaultAddress);

  // Configure vault
  await vault.setMorpho(morphoAddress, morphoTokenAddress);
  console.log("Vault configured with Morpho");

  // Mint USDC to user
  const mintAmount = ethers.parseUnits("1000", 6); // 1000 USDC
  await mockUsdc.mint(user.address, mintAmount);
  console.log(`Minted ${mintAmount} USDC to user`);

  // User approves vault for USDC
  const userUsdc = mockUsdc.connect(user);
  await userUsdc.approve(vaultAddress, mintAmount);
  console.log("User approved vault for USDC");

  // Check initial vault info
  const initialInfo = await vault.getVaultInfo();
  console.log("\n📊 Initial Vault Info:");
  console.log("- Total Assets:", initialInfo.totalAssetsValue.toString());
  console.log("- Total Shares:", initialInfo.totalShares.toString());
  console.log("- Vault Balance:", initialInfo.vaultBalance.toString());
  console.log("- Morpho Balance:", initialInfo.morphoBalance.toString());

  // User deposits into vault
  const userVault = vault.connect(user);
  const depositAmount = ethers.parseUnits("500", 6); // 500 USDC
  await userVault.deposit(depositAmount, user.address);
  console.log(`User deposited ${depositAmount} USDC in vault`);

  // Check vault info after deposit
  const afterDepositInfo = await vault.getVaultInfo();
  console.log("\n📊 After Deposit Vault Info:");
  console.log("- Total Assets:", afterDepositInfo.totalAssetsValue.toString());
  console.log("- Total Shares:", afterDepositInfo.totalShares.toString());
  console.log("- Vault Balance:", afterDepositInfo.vaultBalance.toString());
  console.log("- Morpho Balance:", afterDepositInfo.morphoBalance.toString());

  // Check user shares
  const userShares = await vault.balanceOf(user.address);
  console.log(`User shares: ${userShares.toString()}`);

  // Simulate some time passing and interest accrual
  console.log("\n⏰ Simulating time passing...");

  // Manually add some interest by calling supply again (simulating interest)
  const interestAmount = ethers.parseUnits("10", 6); // 10 USDC interest
  await mockUsdc.mint(vaultAddress, interestAmount);
  await vault.depositToMorpho();
  console.log(`Added ${interestAmount} USDC interest to vault`);

  // Check vault info after interest
  const afterInterestInfo = await vault.getVaultInfo();
  console.log("\n📊 After Interest Vault Info:");
  console.log("- Total Assets:", afterInterestInfo.totalAssetsValue.toString());
  console.log("- Total Shares:", afterInterestInfo.totalShares.toString());
  console.log("- Vault Balance:", afterInterestInfo.vaultBalance.toString());
  console.log("- Morpho Balance:", afterInterestInfo.morphoBalance.toString());

  // Note: No fees collected in this simplified version
  console.log("No fees collected (simplified MVP)");

  // Check vault balance after interest
  const vaultBalance = await mockUsdc.balanceOf(vaultAddress);
  console.log(`Vault USDC balance: ${vaultBalance.toString()}`);

  // User withdraws some USDC
  const withdrawAmount = ethers.parseUnits("200", 6); // 200 USDC
  await userVault.withdraw(withdrawAmount, user.address, user.address);
  console.log(`User withdrew ${withdrawAmount} USDC from vault`);

  // Check final vault info
  const finalInfo = await vault.getVaultInfo();
  console.log("\n📊 Final Vault Info:");
  console.log("- Total Assets:", finalInfo.totalAssetsValue.toString());
  console.log("- Total Shares:", finalInfo.totalShares.toString());
  console.log("- Vault Balance:", finalInfo.vaultBalance.toString());
  console.log("- Morpho Balance:", finalInfo.morphoBalance.toString());

  // Check user final balance
  const userFinalBalance = await mockUsdc.balanceOf(user.address);
  const userFinalShares = await vault.balanceOf(user.address);
  console.log(`\n👤 User Final State:`);
  console.log("- USDC Balance:", userFinalBalance.toString());
  console.log("- Vault Shares:", userFinalShares.toString());

  console.log("\n✅ Test completed successfully!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

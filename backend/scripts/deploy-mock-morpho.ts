import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying MockMorpho...");

  // Get signers
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Deploy MockMorpho
  const MockMorpho = await ethers.getContractFactory("MockMorpho");
  const mockMorpho = await MockMorpho.deploy();
  await mockMorpho.waitForDeployment();

  const mockMorphoAddress = await mockMorpho.getAddress();
  console.log("✅ MockMorpho deployed to:", mockMorphoAddress);

  // Get MockUSDC address (assuming it's already deployed)
  const mockUsdcAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Default Hardhat address

  // Create USDC market with realistic rates
  // Rates are in basis points (1% = 100, 0.1% = 10)
  const supplyRate = 50; // 0.5% APY
  const borrowRate = 200; // 2% APY

  console.log("📊 Creating USDC market...");
  console.log("Supply rate:", supplyRate, "basis points (0.5%)");
  console.log("Borrow rate:", borrowRate, "basis points (2%)");

  const createMarketTx = await mockMorpho.createMarket(
    mockUsdcAddress,
    supplyRate,
    borrowRate
  );
  await createMarketTx.wait();

  console.log("✅ USDC market created successfully!");

  // Verify market creation
  const market = await mockMorpho.getMarket(mockUsdcAddress);
  console.log("📋 Market verification:");
  console.log("- Total supply:", market.totalSupply.toString());
  console.log("- Total borrow:", market.totalBorrow.toString());
  console.log("- Supply rate:", market.supplyRate.toString());
  console.log("- Borrow rate:", market.borrowRate.toString());
  console.log("- Is active:", market.isActive);

  console.log("\n🎯 Deployment Summary:");
  console.log("MockMorpho:", mockMorphoAddress);
  console.log("MockUSDC:", mockUsdcAddress);
  console.log("Supply rate: 0.5% APY");
  console.log("Borrow rate: 2% APY");

  // Save addresses for other scripts
  const addresses = {
    mockMorpho: mockMorphoAddress,
    mockUsdc: mockUsdcAddress,
    supplyRate,
    borrowRate,
  };

  console.log("\n📝 Addresses for reference:");
  console.log(JSON.stringify(addresses, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

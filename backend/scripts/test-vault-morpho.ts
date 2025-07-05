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

  // Mint USDC to user
  const mintAmount = ethers.parseUnits("1000", 6); // 1000 USDC
  await mockUsdc.mint(user.address, mintAmount);
  console.log(`Minted ${mintAmount} USDC to user`);

  // Deploy MockMorpho
  const MockMorpho = await ethers.getContractFactory("MockMorpho");
  const mockMorpho = await MockMorpho.deploy();
  await mockMorpho.waitForDeployment();
  const morphoAddress = await mockMorpho.getAddress();
  console.log("MockMorpho:", morphoAddress);

  // Create USDC market on Morpho
  await mockMorpho.createMarket(usdcAddress, 50, 200); // 0.5% supply, 2% borrow
  console.log("USDC market created on Morpho");

  // Deploy Vault
  const Vault = await ethers.getContractFactory("RiseFiUSDCVault");
  const vault = await Vault.deploy(usdcAddress);
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("Vault:", vaultAddress);

  // Set Morpho address in vault
  await vault.setMorpho(morphoAddress);
  console.log("Vault Morpho set");

  // User approves vault for USDC
  const userUsdc = mockUsdc.connect(user);
  await userUsdc.approve(vaultAddress, mintAmount);
  console.log("User approved vault for USDC");

  // User deposits into vault
  const userVault = vault.connect(user);
  await userVault.deposit(mintAmount, user.address);
  console.log("User deposited in vault");

  // Owner deposits vault USDC to Morpho
  await vault.depositToMorpho();
  console.log("Vault deposited to Morpho");

  // Check position on Morpho
  const [supplied, borrowed] = await mockMorpho.getPosition(
    vaultAddress,
    usdcAddress
  );
  console.log(
    `Vault position on Morpho: supplied=${supplied}, borrowed=${borrowed}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

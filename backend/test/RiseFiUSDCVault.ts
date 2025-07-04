import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("RiseFiUSDCVault", function () {
  async function deployVaultFixture() {
    const [owner, otherAccount, thirdAccount] = await hre.ethers.getSigners();

    // Deploy MockUSDC and ensure it's mined
    const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
    const mockUSDC = await MockUSDC.deploy();
    await mockUSDC.waitForDeployment();

    // Mint initial supply using parseUnits for clarity
    const initialSupply = hre.ethers.parseUnits("1000000", 6); // 1M USDC
    await mockUSDC.mint(owner.address, initialSupply);

    // Deploy Vault and ensure it's mined
    const Vault = await hre.ethers.getContractFactory("RiseFiUSDCVault");
    const vault = await Vault.deploy(mockUSDC.target);
    await vault.waitForDeployment();

    return { vault, mockUSDC, owner, otherAccount, thirdAccount };
  }

  describe("Deployment", function () {
    it("Should set the right underlying asset", async function () {
      const { vault, mockUSDC } = await loadFixture(deployVaultFixture);
      expect(await vault.asset()).to.equal(mockUSDC.target);
    });

    it("Should have correct name and symbol", async function () {
      const { vault } = await loadFixture(deployVaultFixture);
      expect(await vault.name()).to.equal("RiseFi USDC Vault Share");
      expect(await vault.symbol()).to.equal("RFUSDV");
    });
  });

  describe("ERC4626 basic operations", function () {
    it("Should allow deposit and mint shares", async function () {
      const { vault, mockUSDC, owner } = await loadFixture(deployVaultFixture);
      const depositAmount = hre.ethers.parseUnits("100", 6); // 100 USDC
      await mockUSDC.approve(vault.target, depositAmount);
      await expect(vault.deposit(depositAmount, owner.address))
        .to.emit(vault, "Deposit")
        .withArgs(owner.address, owner.address, depositAmount, depositAmount);
      expect(await vault.balanceOf(owner.address)).to.equal(depositAmount);
      expect(await vault.totalAssets()).to.equal(depositAmount);
    });

    it("Should allow withdraw and burn shares", async function () {
      const { vault, mockUSDC, owner } = await loadFixture(deployVaultFixture);
      const depositAmount = hre.ethers.parseUnits("100", 6); // 100 USDC
      await mockUSDC.approve(vault.target, depositAmount);
      await vault.deposit(depositAmount, owner.address);
      await expect(vault.withdraw(depositAmount, owner.address, owner.address))
        .to.emit(vault, "Withdraw")
        .withArgs(
          owner.address,
          owner.address,
          owner.address,
          depositAmount,
          depositAmount
        );
      expect(await vault.balanceOf(owner.address)).to.equal(0);
      expect(await vault.totalAssets()).to.equal(0);
    });

    it("Should handle multiple deposits correctly", async function () {
      const { vault, mockUSDC, owner } = await loadFixture(deployVaultFixture);
      const deposit1 = hre.ethers.parseUnits("50", 6); // 50 USDC
      const deposit2 = hre.ethers.parseUnits("75", 6); // 75 USDC

      await mockUSDC.approve(vault.target, deposit1 + deposit2);
      await vault.deposit(deposit1, owner.address);
      await vault.deposit(deposit2, owner.address);

      expect(await vault.balanceOf(owner.address)).to.equal(
        deposit1 + deposit2
      );
      expect(await vault.totalAssets()).to.equal(deposit1 + deposit2);
    });

    it("Should handle partial withdrawals correctly", async function () {
      const { vault, mockUSDC, owner } = await loadFixture(deployVaultFixture);
      const depositAmount = hre.ethers.parseUnits("100", 6); // 100 USDC
      const withdrawAmount = hre.ethers.parseUnits("30", 6); // 30 USDC

      await mockUSDC.approve(vault.target, depositAmount);
      await vault.deposit(depositAmount, owner.address);
      await vault.withdraw(withdrawAmount, owner.address, owner.address);

      expect(await vault.balanceOf(owner.address)).to.equal(
        depositAmount - withdrawAmount
      );
      expect(await vault.totalAssets()).to.equal(
        depositAmount - withdrawAmount
      );
    });
  });

  describe("Negative path tests", function () {
    it("Should revert deposit without approval", async function () {
      const { vault, owner } = await loadFixture(deployVaultFixture);
      const depositAmount = hre.ethers.parseUnits("100", 6);

      await expect(vault.deposit(depositAmount, owner.address)).to.be.reverted;
    });

    it("Should revert deposit with insufficient balance", async function () {
      const { vault, mockUSDC, otherAccount } = await loadFixture(
        deployVaultFixture
      );
      const depositAmount = hre.ethers.parseUnits("1000000", 6); // More than available

      // Approve from otherAccount (qui n'a pas de USDC)
      await mockUSDC.connect(otherAccount).approve(vault.target, depositAmount);

      await expect(
        vault.connect(otherAccount).deposit(depositAmount, otherAccount.address)
      ).to.be.reverted;
    });

    it("Should revert withdraw without shares", async function () {
      const { vault, otherAccount } = await loadFixture(deployVaultFixture);
      const withdrawAmount = hre.ethers.parseUnits("100", 6);

      await expect(
        vault.withdraw(
          withdrawAmount,
          otherAccount.address,
          otherAccount.address
        )
      ).to.be.reverted;
    });

    it("Should revert withdraw more than available shares", async function () {
      const { vault, mockUSDC, owner } = await loadFixture(deployVaultFixture);
      const depositAmount = hre.ethers.parseUnits("100", 6);
      const withdrawAmount = hre.ethers.parseUnits("150", 6); // More than deposited

      await mockUSDC.approve(vault.target, depositAmount);
      await vault.deposit(depositAmount, owner.address);

      await expect(vault.withdraw(withdrawAmount, owner.address, owner.address))
        .to.be.reverted;
    });

    it("Should handle zero amount deposits gracefully", async function () {
      const { vault, owner } = await loadFixture(deployVaultFixture);

      // Zero amount deposits should not revert in ERC4626
      await expect(vault.deposit(0, owner.address)).to.not.be.reverted;

      expect(await vault.balanceOf(owner.address)).to.equal(0);
      expect(await vault.totalAssets()).to.equal(0);
    });

    it("Should handle zero amount withdrawals gracefully", async function () {
      const { vault, owner } = await loadFixture(deployVaultFixture);

      // Zero amount withdrawals should not revert in ERC4626
      await expect(vault.withdraw(0, owner.address, owner.address)).to.not.be
        .reverted;

      expect(await vault.balanceOf(owner.address)).to.equal(0);
      expect(await vault.totalAssets()).to.equal(0);
    });

    it("Should handle zero shares mint gracefully", async function () {
      const { vault, owner } = await loadFixture(deployVaultFixture);

      // Zero shares mint should not revert in ERC4626
      await expect(vault.mint(0, owner.address)).to.not.be.reverted;

      expect(await vault.balanceOf(owner.address)).to.equal(0);
      expect(await vault.totalAssets()).to.equal(0);
    });

    it("Should handle zero shares redeem gracefully", async function () {
      const { vault, owner } = await loadFixture(deployVaultFixture);

      // Zero shares redeem should not revert in ERC4626
      await expect(vault.redeem(0, owner.address, owner.address)).to.not.be
        .reverted;

      expect(await vault.balanceOf(owner.address)).to.equal(0);
      expect(await vault.totalAssets()).to.equal(0);
    });
  });

  describe("MockUSDC", function () {
    it("Should mint USDC to a user", async function () {
      const { mockUSDC, otherAccount } = await loadFixture(deployVaultFixture);
      const mintAmount = hre.ethers.parseUnits("123.456", 6); // 123.456 USDC
      await mockUSDC.mint(otherAccount.address, mintAmount);
      expect(await mockUSDC.balanceOf(otherAccount.address)).to.equal(
        mintAmount
      );
    });

    it("Should have 6 decimals", async function () {
      const { mockUSDC } = await loadFixture(deployVaultFixture);
      expect(await mockUSDC.decimals()).to.equal(6);
    });

    it("Should handle large amounts correctly", async function () {
      const { mockUSDC, otherAccount } = await loadFixture(deployVaultFixture);
      const largeAmount = hre.ethers.parseUnits("999999999.999999", 6); // Near max precision
      await mockUSDC.mint(otherAccount.address, largeAmount);
      expect(await mockUSDC.balanceOf(otherAccount.address)).to.equal(
        largeAmount
      );
    });
  });

  describe("Vault decimals", function () {
    it("Should use the same decimals as the underlying asset", async function () {
      const { vault } = await loadFixture(deployVaultFixture);
      expect(await vault.decimals()).to.equal(6);
    });
  });

  describe("Edge cases", function () {
    it("Should handle very small amounts", async function () {
      const { vault, mockUSDC, owner } = await loadFixture(deployVaultFixture);
      const smallAmount = hre.ethers.parseUnits("0.000001", 6); // 1 micro USDC

      await mockUSDC.approve(vault.target, smallAmount);
      await vault.deposit(smallAmount, owner.address);

      expect(await vault.balanceOf(owner.address)).to.equal(smallAmount);
      expect(await vault.totalAssets()).to.equal(smallAmount);
    });

    it("Should handle multiple users correctly", async function () {
      const { vault, mockUSDC, owner, otherAccount, thirdAccount } =
        await loadFixture(deployVaultFixture);

      // Mint USDC to other accounts
      const userAmount = hre.ethers.parseUnits("1000", 6);
      await mockUSDC.mint(otherAccount.address, userAmount);
      await mockUSDC.mint(thirdAccount.address, userAmount);

      // Each user deposits
      const depositAmount = hre.ethers.parseUnits("100", 6);
      await mockUSDC.connect(otherAccount).approve(vault.target, depositAmount);
      await mockUSDC.connect(thirdAccount).approve(vault.target, depositAmount);

      await vault
        .connect(otherAccount)
        .deposit(depositAmount, otherAccount.address);
      await vault
        .connect(thirdAccount)
        .deposit(depositAmount, thirdAccount.address);

      expect(await vault.balanceOf(otherAccount.address)).to.equal(
        depositAmount
      );
      expect(await vault.balanceOf(thirdAccount.address)).to.equal(
        depositAmount
      );
      expect(await vault.totalAssets()).to.equal(depositAmount * 2n);
    });
  });
});

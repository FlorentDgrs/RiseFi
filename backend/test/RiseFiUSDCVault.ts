import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("RiseFiUSDCVault", function () {
  async function deployVaultFixture() {
    const [owner, otherAccount] = await hre.ethers.getSigners();

    // Deploy MockUSDC
    const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
    const mockUSDC = await MockUSDC.deploy();
    await mockUSDC.mint(owner.address, 1_000_000_000);

    // Deploy Vault
    const Vault = await hre.ethers.getContractFactory("RiseFiUSDCVault");
    const vault = await Vault.deploy(mockUSDC.target);

    return { vault, mockUSDC, owner, otherAccount };
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

  // D'autres tests (dépôts, retraits, etc.) pourront être ajoutés ici
  describe("ERC4626 basic operations", function () {
    it("Should allow deposit and mint shares", async function () {
      const { vault, mockUSDC, owner } = await loadFixture(deployVaultFixture);
      const depositAmount = 100_000;
      await mockUSDC.approve(vault.target, depositAmount);
      await expect(vault.deposit(depositAmount, owner.address))
        .to.emit(vault, "Deposit")
        .withArgs(owner.address, owner.address, depositAmount, depositAmount);
      expect(await vault.balanceOf(owner.address)).to.equal(depositAmount);
      expect(await vault.totalAssets()).to.equal(depositAmount);
    });

    it("Should allow withdraw and burn shares", async function () {
      const { vault, mockUSDC, owner } = await loadFixture(deployVaultFixture);
      const depositAmount = 100_000;
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
  });

  describe("MockUSDC", function () {
    it("Should mint USDC to a user", async function () {
      const { mockUSDC, owner, otherAccount } = await loadFixture(
        deployVaultFixture
      );
      const mintAmount = 123_456;
      await mockUSDC.mint(otherAccount.address, mintAmount);
      expect(await mockUSDC.balanceOf(otherAccount.address)).to.equal(
        mintAmount
      );
    });

    it("Should have 6 decimals", async function () {
      const { mockUSDC } = await loadFixture(deployVaultFixture);
      expect(await mockUSDC.decimals()).to.equal(6);
    });
  });

  describe("Vault decimals", function () {
    it("Should use the same decimals as the underlying asset", async function () {
      const { vault } = await loadFixture(deployVaultFixture);
      expect(await vault.decimals()).to.equal(6);
    });
  });
});

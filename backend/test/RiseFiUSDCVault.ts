import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

const USDC_ADDRESS = "0xA0b86991c6218b36c1d19d4a2e9Eb0cE3606e48";
const MORPHO_VAULT_ADDRESS = "0x7BfA7C4f149E7415b73bdeDfe609237e29CBF34A";
const USDC_WHALE = "0x55FE002aefF02F77364de339a1292923A15844B8";

describe("RiseFiUSDCVault", function () {
  async function deployVaultFixture() {
    const [owner, otherAccount, thirdAccount] = await hre.ethers.getSigners();

    // Connect to existing contracts on the fork
    const usdc = await hre.ethers.getContractAt("IERC20", USDC_ADDRESS);
    const morphoVault = await hre.ethers.getContractAt(
      "IMorphoVault",
      MORPHO_VAULT_ADDRESS
    );

    // Impersonate a rich USDC holder to fund test accounts
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [USDC_WHALE],
    });
    const whaleSigner = await hre.ethers.getSigner(USDC_WHALE);
    await hre.network.provider.send("hardhat_setBalance", [
      USDC_WHALE,
      "0x1000000000000000000",
    ]);

    const initialAmount = hre.ethers.parseUnits("1000", 6);
    await usdc.connect(whaleSigner).transfer(owner.address, initialAmount);
    await usdc.connect(whaleSigner).transfer(otherAccount.address, initialAmount);
    await usdc.connect(whaleSigner).transfer(thirdAccount.address, initialAmount);

    await hre.network.provider.request({
      method: "hardhat_stopImpersonatingAccount",
      params: [USDC_WHALE],
    });

    // Deploy the vault linked to the real Morpho vault
    const Vault = await hre.ethers.getContractFactory("RiseFiUSDCVault");
    const vault = await Vault.deploy(usdc.target, morphoVault.target);
    await vault.waitForDeployment();

    return { vault, usdc, morphoVault, owner, otherAccount, thirdAccount };
  }

  describe("Deployment", function () {
    it("Should set the right underlying asset", async function () {
      const { vault } = await loadFixture(deployVaultFixture);
      expect(await vault.asset()).to.equal(USDC_ADDRESS);
    });

    it("Should have correct name and symbol", async function () {
      const { vault } = await loadFixture(deployVaultFixture);
      expect(await vault.name()).to.equal("RiseFi USDC Vault Share");
      expect(await vault.symbol()).to.equal("RFUSDV");
    });
  });

  describe("ERC4626 basic operations", function () {
    it("Should allow deposit and mint shares", async function () {
      const { vault, usdc, morphoVault, owner } = await loadFixture(deployVaultFixture);
      const depositAmount = hre.ethers.parseUnits("100", 6);

      const before = await usdc.balanceOf(MORPHO_VAULT_ADDRESS);
      await usdc.connect(owner).approve(vault.target, depositAmount);
      await expect(vault.deposit(depositAmount, owner.address))
        .to.emit(vault, "Deposit")
        .withArgs(owner.address, owner.address, depositAmount, depositAmount);
      expect(await vault.balanceOf(owner.address)).to.equal(depositAmount);
      expect(await usdc.balanceOf(MORPHO_VAULT_ADDRESS)).to.equal(before + depositAmount);
    });

    it("Should allow withdraw and burn shares", async function () {
      const { vault, usdc, owner } = await loadFixture(deployVaultFixture);
      const depositAmount = hre.ethers.parseUnits("100", 6);

      await usdc.connect(owner).approve(vault.target, depositAmount);
      await vault.deposit(depositAmount, owner.address);
      const before = await usdc.balanceOf(MORPHO_VAULT_ADDRESS);
      await expect(vault.withdraw(depositAmount, owner.address, owner.address))
        .to.emit(vault, "Withdraw")
        .withArgs(owner.address, owner.address, owner.address, depositAmount, depositAmount);
      expect(await vault.balanceOf(owner.address)).to.equal(0);
      expect(await usdc.balanceOf(MORPHO_VAULT_ADDRESS)).to.equal(before - depositAmount);
    });

    it("Should handle multiple deposits correctly", async function () {
      const { vault, usdc, owner } = await loadFixture(deployVaultFixture);
      const deposit1 = hre.ethers.parseUnits("50", 6);
      const deposit2 = hre.ethers.parseUnits("75", 6);

      await usdc.connect(owner).approve(vault.target, deposit1 + deposit2);
      const before = await usdc.balanceOf(MORPHO_VAULT_ADDRESS);
      await vault.deposit(deposit1, owner.address);
      await vault.deposit(deposit2, owner.address);

      expect(await vault.balanceOf(owner.address)).to.equal(deposit1 + deposit2);
      expect(await usdc.balanceOf(MORPHO_VAULT_ADDRESS)).to.equal(before + deposit1 + deposit2);
    });

    it("Should handle partial withdrawals correctly", async function () {
      const { vault, usdc, owner } = await loadFixture(deployVaultFixture);
      const depositAmount = hre.ethers.parseUnits("100", 6);
      const withdrawAmount = hre.ethers.parseUnits("30", 6);

      await usdc.connect(owner).approve(vault.target, depositAmount);
      await vault.deposit(depositAmount, owner.address);
      const before = await usdc.balanceOf(MORPHO_VAULT_ADDRESS);
      await vault.withdraw(withdrawAmount, owner.address, owner.address);

      expect(await vault.balanceOf(owner.address)).to.equal(depositAmount - withdrawAmount);
      expect(await usdc.balanceOf(MORPHO_VAULT_ADDRESS)).to.equal(before - withdrawAmount);
    });
  });

  describe("Negative path tests", function () {
    it("Should revert deposit without approval", async function () {
      const { vault, usdc, owner } = await loadFixture(deployVaultFixture);
      const depositAmount = hre.ethers.parseUnits("100", 6);

      await expect(vault.deposit(depositAmount, owner.address)).to.be.revertedWithCustomError(
        usdc,
        "ERC20InsufficientAllowance"
      );
    });

    it("Should revert deposit with insufficient balance", async function () {
      const { vault, usdc, otherAccount } = await loadFixture(deployVaultFixture);
      const depositAmount = hre.ethers.parseUnits("1000000", 6);

      await usdc.connect(otherAccount).approve(vault.target, depositAmount);
      await expect(
        vault.connect(otherAccount).deposit(depositAmount, otherAccount.address)
      ).to.be.revertedWithCustomError(usdc, "ERC20InsufficientBalance");
    });

    it("Should revert withdraw without shares", async function () {
      const { vault, otherAccount } = await loadFixture(deployVaultFixture);
      const withdrawAmount = hre.ethers.parseUnits("100", 6);

      await expect(
        vault.withdraw(withdrawAmount, otherAccount.address, otherAccount.address)
      ).to.be.revertedWithCustomError(vault, "ERC4626ExceededMaxWithdraw");
    });

    it("Should revert withdraw more than available shares", async function () {
      const { vault, usdc, owner } = await loadFixture(deployVaultFixture);
      const depositAmount = hre.ethers.parseUnits("100", 6);
      const withdrawAmount = hre.ethers.parseUnits("150", 6);

      await usdc.connect(owner).approve(vault.target, depositAmount);
      await vault.deposit(depositAmount, owner.address);

      await expect(
        vault.withdraw(withdrawAmount, owner.address, owner.address)
      ).to.be.revertedWithCustomError(vault, "ERC4626ExceededMaxWithdraw");
    });

    it("Should handle zero amount deposits gracefully", async function () {
      const { vault, owner } = await loadFixture(deployVaultFixture);

      await expect(vault.deposit(0, owner.address)).to.not.be.reverted;
      expect(await vault.balanceOf(owner.address)).to.equal(0);
      expect(await vault.totalAssets()).to.equal(0);
    });

    it("Should handle zero amount withdrawals gracefully", async function () {
      const { vault, owner } = await loadFixture(deployVaultFixture);

      await expect(vault.withdraw(0, owner.address, owner.address)).to.not.be.reverted;
      expect(await vault.balanceOf(owner.address)).to.equal(0);
      expect(await vault.totalAssets()).to.equal(0);
    });

    it("Should handle zero shares mint gracefully", async function () {
      const { vault, owner } = await loadFixture(deployVaultFixture);

      await expect(vault.mint(0, owner.address)).to.not.be.reverted;
      expect(await vault.balanceOf(owner.address)).to.equal(0);
      expect(await vault.totalAssets()).to.equal(0);
    });

    it("Should handle zero shares redeem gracefully", async function () {
      const { vault, owner } = await loadFixture(deployVaultFixture);

      await expect(vault.redeem(0, owner.address, owner.address)).to.not.be.reverted;
      expect(await vault.balanceOf(owner.address)).to.equal(0);
      expect(await vault.totalAssets()).to.equal(0);
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
      const { vault, usdc, owner } = await loadFixture(deployVaultFixture);
      const smallAmount = hre.ethers.parseUnits("0.000001", 6);

      await usdc.connect(owner).approve(vault.target, smallAmount);
      await vault.deposit(smallAmount, owner.address);

      expect(await vault.balanceOf(owner.address)).to.equal(smallAmount);
    });

    it("Should handle multiple users correctly", async function () {
      const { vault, usdc, otherAccount, thirdAccount } = await loadFixture(deployVaultFixture);
      const depositAmount = hre.ethers.parseUnits("100", 6);

      await usdc.connect(otherAccount).approve(vault.target, depositAmount);
      await usdc.connect(thirdAccount).approve(vault.target, depositAmount);

      await vault.connect(otherAccount).deposit(depositAmount, otherAccount.address);
      await vault.connect(thirdAccount).deposit(depositAmount, thirdAccount.address);

      expect(await vault.balanceOf(otherAccount.address)).to.equal(depositAmount);
      expect(await vault.balanceOf(thirdAccount.address)).to.equal(depositAmount);
    });
  });
});

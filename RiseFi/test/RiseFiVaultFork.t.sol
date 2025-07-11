// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Test} from "forge-std/Test.sol";
import {console} from "forge-std/console.sol";
import {RiseFiVault} from "../src/RiseFiVault.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";

/**
 * @title RiseFi Vault Fork Tests
 * @notice Tests using Base mainnet fork with real addresses and whale impersonation
 */
contract RiseFiVaultForkTest is Test {
    // ========== CONTRACTS ==========
    RiseFiVault public vault;

    // ========== BASE MAINNET ADDRESSES ==========
    IERC20Metadata public constant USDC = IERC20Metadata(0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913);
    IERC4626 public constant MORPHO_VAULT = IERC4626(0x3128a0F7f0ea68E7B7c9B00AFa7E41045828e858);

    // ========== WHALE ADDRESSES ==========
    // Real USDC whale on Base
    address public constant USDC_WHALE = 0x0B0A5886664376F59C351ba3f598C8A8B4D0A6f3;

    // ========== TEST ADDRESSES ==========
    address public user = address(0x1234);
    address public user2 = address(0x5678);
    uint256 public constant AMOUNT = 1000 * 10 ** 6; // 1000 USDC

    function setUp() public {
        // Create fork - this will be run with --fork-url
        // For now, create basic vault (will upgrade to Morpho later)
        vault = new RiseFiVault(IERC20(address(USDC)));

        // Verify we're on the right network
        assertEq(USDC.decimals(), 6, "USDC should have 6 decimals");
        assertEq(USDC.symbol(), "USDC", "Should be USDC token");
    }

    // ========== HELPER FUNCTIONS ==========

    /**
     * @dev Fund address with USDC from whale
     */
    function _fundWithUSDC(address to, uint256 amount) internal {
        vm.prank(USDC_WHALE);
        USDC.transfer(to, amount);
    }

    /**
     * @dev Complete deposit flow with real USDC
     */
    function _depositFor(address account, uint256 amount) internal returns (uint256 shares) {
        _fundWithUSDC(account, amount);
        vm.startPrank(account);
        USDC.approve(address(vault), amount);
        shares = vault.deposit(amount, account);
        vm.stopPrank();
    }

    // ========== FORK TESTS ==========

    function test_Fork_RealUSDC_HasCorrectProperties() public view {
        assertEq(USDC.name(), "USD Coin");
        assertEq(USDC.symbol(), "USDC");
        assertEq(USDC.decimals(), 6);

        // Verify whale has USDC (at least 10K for our tests)
        assertGt(USDC.balanceOf(USDC_WHALE), 10_000 * 10 ** 6, "Whale should have > 10K USDC");
    }

    function test_Fork_Deposit_WithRealUSDC() public {
        // Fund user with real USDC from whale
        _fundWithUSDC(user, AMOUNT);

        // Verify funding worked
        assertEq(USDC.balanceOf(user), AMOUNT, "User should have USDC");

        // Perform deposit
        vm.startPrank(user);
        USDC.approve(address(vault), AMOUNT);
        uint256 shares = vault.deposit(AMOUNT, user);
        vm.stopPrank();

        // Verify deposit worked
        assertEq(shares, AMOUNT, "Should receive 1:1 shares initially");
        assertEq(vault.balanceOf(user), AMOUNT, "User should have shares");
        assertEq(USDC.balanceOf(address(vault)), AMOUNT, "Vault should have USDC");
    }

    function test_Fork_Withdraw_WithRealUSDC() public {
        // Setup: Deposit first
        _depositFor(user, AMOUNT);

        // Withdraw
        vm.prank(user);
        vault.withdraw(AMOUNT, user, user);

        // Verify withdrawal
        assertEq(USDC.balanceOf(user), AMOUNT, "User should have USDC back");
        assertEq(vault.balanceOf(user), 0, "User should have no shares");
        assertEq(USDC.balanceOf(address(vault)), 0, "Vault should be empty");
    }

    function test_Fork_MultipleUsers_WithRealUSDC() public {
        // Fund multiple users
        _fundWithUSDC(user, AMOUNT);
        _fundWithUSDC(user2, AMOUNT * 2);

        // User 1 deposits
        vm.startPrank(user);
        USDC.approve(address(vault), AMOUNT);
        uint256 shares1 = vault.deposit(AMOUNT, user);
        vm.stopPrank();

        // User 2 deposits
        vm.startPrank(user2);
        USDC.approve(address(vault), AMOUNT * 2);
        uint256 shares2 = vault.deposit(AMOUNT * 2, user2);
        vm.stopPrank();

        // Verify proportional shares
        assertEq(shares1, AMOUNT, "User 1 should have proportional shares");
        assertEq(shares2, AMOUNT * 2, "User 2 should have proportional shares");
        assertEq(vault.totalAssets(), AMOUNT * 3, "Total assets should be sum");
    }

    // ========== MORPHO INTEGRATION PREP ==========

    function test_Fork_MorphoVault_Properties() public view {
        // Verify Morpho vault exists and has correct properties
        assertEq(MORPHO_VAULT.asset(), address(USDC), "Morpho vault should use USDC");
        assertGt(MORPHO_VAULT.totalAssets(), 0, "Morpho vault should have assets");

        // Log some info for debugging
        console.log("Morpho Vault Name:", IERC20Metadata(address(MORPHO_VAULT)).name());
        console.log("Morpho Vault Symbol:", IERC20Metadata(address(MORPHO_VAULT)).symbol());
        console.log("Morpho Total Assets:", MORPHO_VAULT.totalAssets());
    }
}

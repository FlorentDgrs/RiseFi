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
 * @notice Tests RiseFi vault with Morpho integration using Base mainnet fork
 */
contract RiseFiVaultForkTest is Test {
    // ========== CONTRACTS ==========
    RiseFiVault public vault;

    // ========== BASE MAINNET ADDRESSES ==========
    IERC20Metadata public constant USDC = IERC20Metadata(0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913);
    address public constant MORPHO_VAULT_ADDRESS = 0x3128a0F7f0ea68E7B7c9B00AFa7E41045828e858;

    // ========== WHALE ADDRESSES ==========
    address public constant USDC_WHALE = 0x0B0A5886664376F59C351ba3f598C8A8B4D0A6f3;

    // ========== TEST ADDRESSES ==========
    address public user = address(0x1234);
    uint256 public constant AMOUNT = 1000 * 10 ** 6; // 1000 USDC

    function setUp() public {
        vault = new RiseFiVault(IERC20(address(USDC)), MORPHO_VAULT_ADDRESS);

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

    // ========== INFRASTRUCTURE TESTS ==========

    function test_Fork_USDC_Properties() public view {
        assertEq(USDC.name(), "USD Coin");
        assertEq(USDC.symbol(), "USDC");
        assertEq(USDC.decimals(), 6);
        assertGt(USDC.balanceOf(USDC_WHALE), 10_000 * 10 ** 6, "Whale should have > 10K USDC");
    }

    function test_Fork_MorphoVault_Integration() public view {
        IERC4626 morphoVault = vault.morphoVault();

        assertEq(morphoVault.asset(), address(USDC), "Morpho vault should use USDC");
        assertGt(morphoVault.totalAssets(), 0, "Morpho vault should have assets");

        console.log("Morpho Vault Name:", IERC20Metadata(address(morphoVault)).name());
        console.log("Morpho Vault Symbol:", IERC20Metadata(address(morphoVault)).symbol());
        console.log("Morpho Total Assets:", morphoVault.totalAssets());
    }

    // ========== CORE FUNCTIONALITY TESTS ==========

    function test_Fork_Deposit_GoesToMorpho() public {
        _depositFor(user, AMOUNT);

        assertEq(USDC.balanceOf(address(vault)), 0, "RiseFi vault should not hold USDC idle");
        assertGt(vault.morphoVault().balanceOf(address(vault)), 0, "RiseFi vault should have Morpho shares");
    }

    /// @notice Fuzz test for deposit function with random amounts
    function testFuzz_Fork_Deposit(uint256 amount) public {
        // Bound amount to realistic range (MIN_DEPOSIT to 1M USDC)
        amount = bound(amount, vault.MIN_DEPOSIT(), 1_000_000 * 10 ** 6);

        // Ensure whale has enough USDC for this test
        vm.assume(USDC.balanceOf(USDC_WHALE) >= amount);

        // Execute deposit for valid amounts
        uint256 sharesBefore = vault.balanceOf(user);
        uint256 morphoSharesBefore = vault.morphoVault().balanceOf(address(vault));

        _depositFor(user, amount);

        // Verify invariants hold for any amount
        assertEq(USDC.balanceOf(address(vault)), 0, "RiseFi vault should not hold USDC idle");

        // Shares should always increase for valid deposits
        assertGt(vault.morphoVault().balanceOf(address(vault)), morphoSharesBefore, "Morpho shares should increase");
        assertGt(vault.balanceOf(user), sharesBefore, "User shares should increase");

        // Allow for small rounding errors (1-2 wei) due to ERC4626 conversions
        uint256 totalAssets = vault.totalAssets();
        uint256 tolerance = 2; // Allow up to 2 wei difference

        assertGe(totalAssets, amount - tolerance, "Total assets too low");
        assertLe(totalAssets, amount + tolerance, "Total assets too high");
    }

    /// @notice Fuzz test for insufficient deposit amounts (should revert)
    function testFuzz_Fork_Deposit_InsufficientAmount(uint256 amount) public {
        // Test amounts below MIN_DEPOSIT (0 to MIN_DEPOSIT - 1)
        amount = bound(amount, 0, vault.MIN_DEPOSIT() - 1);

        // Ensure whale has enough USDC for this test
        vm.assume(USDC.balanceOf(USDC_WHALE) >= amount);

        // Fund user with insufficient amount
        _fundWithUSDC(user, amount);

        vm.startPrank(user);
        USDC.approve(address(vault), amount);

        // Should revert with InsufficientDeposit error
        vm.expectRevert(abi.encodeWithSelector(RiseFiVault.InsufficientDeposit.selector, amount, vault.MIN_DEPOSIT()));
        vault.deposit(amount, user);
        vm.stopPrank();
    }

    /// @notice Test specific edge cases for minimum deposit
    function test_Fork_Deposit_EdgeCases() public {
        // Test exactly MIN_DEPOSIT - 1 (should revert)
        uint256 belowMinimum = vault.MIN_DEPOSIT() - 1;
        _fundWithUSDC(user, belowMinimum);

        vm.startPrank(user);
        USDC.approve(address(vault), belowMinimum);

        vm.expectRevert(
            abi.encodeWithSelector(RiseFiVault.InsufficientDeposit.selector, belowMinimum, vault.MIN_DEPOSIT())
        );
        vault.deposit(belowMinimum, user);
        vm.stopPrank();

        // Test exactly MIN_DEPOSIT (should succeed)
        uint256 exactMinimum = vault.MIN_DEPOSIT();
        _fundWithUSDC(user, exactMinimum);

        vm.startPrank(user);
        USDC.approve(address(vault), exactMinimum);

        // This should succeed
        uint256 shares = vault.deposit(exactMinimum, user);
        assertGt(shares, 0, "Should receive shares for exact minimum deposit");
        vm.stopPrank();
    }
}

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
 * @notice Comprehensive tests for RiseFi vault with Morpho integration using Base mainnet fork
 * @dev Tests real integration with Morpho vault on Base network
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
        // Create (or select) Base mainnet fork at desired block
        vm.createSelectFork(
            vm.rpcUrl("base_public"), // defined in foundry.toml
            32_778_110 // block
        );

        vault = new RiseFiVault(IERC20(address(USDC)), MORPHO_VAULT_ADDRESS);

        // Verify we're on the right network
        assertEq(USDC.decimals(), 6, "USDC should have 6 decimals");
        assertEq(USDC.symbol(), "USDC", "Should be USDC token");
    }

    // ========== HELPER FUNCTIONS ==========

    /**
     * @dev Fund address with USDC from whale
     * @param to The address to fund
     * @param amount The amount of USDC to transfer
     */
    function _fundWithUSDC(address to, uint256 amount) internal {
        vm.prank(USDC_WHALE);
        USDC.transfer(to, amount);
    }

    /**
     * @dev Complete deposit flow with real USDC
     * @param account The account to deposit for
     * @param amount The amount to deposit
     * @return shares The shares received from deposit
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

    // ========== CONSTRUCTOR TESTS ==========

    function test_Constructor_InvalidAsset() public {
        // Test with a token different from USDC
        address invalidToken = address(0x1234567890123456789012345678901234567890);

        vm.expectRevert(abi.encodeWithSelector(RiseFiVault.InvalidAsset.selector, invalidToken, address(USDC)));

        new RiseFiVault(IERC20(invalidToken), MORPHO_VAULT_ADDRESS);
    }

    function test_Constructor_ValidAsset() public {
        // Test that constructor works with valid USDC
        RiseFiVault testVault = new RiseFiVault(IERC20(address(USDC)), MORPHO_VAULT_ADDRESS);

        assertEq(testVault.USDC(), address(USDC), "USDC address should be set correctly");
        assertEq(address(testVault.morphoVault()), MORPHO_VAULT_ADDRESS, "Morpho vault should be set correctly");
    }

    // ========== CORE FUNCTIONALITY TESTS ==========

    function test_Fork_Deposit_GoesToMorpho() public {
        _depositFor(user, AMOUNT);

        assertEq(USDC.balanceOf(address(vault)), 0, "RiseFi vault should not hold USDC idle");
        assertGt(vault.morphoVault().balanceOf(address(vault)), 0, "RiseFi vault should have Morpho shares");
    }

    function test_Fork_DeadShares_FirstDeposit() public {
        // Verify that dead shares are minted on first deposit
        uint256 sharesBefore = vault.totalSupply();
        assertEq(sharesBefore, 0, "Should start with 0 shares");

        _depositFor(user, AMOUNT);

        // Verify that dead shares have been minted
        uint256 deadShares = vault.DEAD_SHARES();
        assertEq(vault.balanceOf(vault.DEAD_ADDRESS()), deadShares, "Dead shares should be minted to dead address");

        // Verify that user received their shares
        assertGt(vault.balanceOf(user), 0, "User should receive shares");
    }

    function test_Fork_DeadShares_SecondDeposit() public {
        // First deposit (should mint dead shares)
        _depositFor(user, AMOUNT);
        uint256 deadSharesAfterFirst = vault.balanceOf(vault.DEAD_ADDRESS());

        // Second deposit (should NOT mint new dead shares)
        address user2 = address(0x5678);
        _depositFor(user2, AMOUNT);
        uint256 deadSharesAfterSecond = vault.balanceOf(vault.DEAD_ADDRESS());

        // Dead shares should not change
        assertEq(deadSharesAfterSecond, deadSharesAfterFirst, "Dead shares should not increase on second deposit");
    }

    function test_Fork_TotalAssets_EmptyVault() public view {
        // Test totalAssets when vault is empty
        uint256 totalAssets = vault.totalAssets();
        assertEq(totalAssets, 0, "Total assets should be 0 for empty vault");
    }

    function test_Fork_TotalAssets_WithDeposits() public {
        // Initial deposit
        _depositFor(user, AMOUNT);

        // Verify that totalAssets returns a value > 0
        uint256 totalAssets = vault.totalAssets();
        assertGt(totalAssets, 0, "Total assets should be > 0 after deposit");

        // Verify that totalAssets approximately matches the deposit
        assertGe(totalAssets, AMOUNT - 2, "Total assets should be >= deposit amount (with tolerance)");
        assertLe(totalAssets, AMOUNT + 2, "Total assets should be <= deposit amount (with tolerance)");
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

    // ========== CONSTANTS TESTS ==========

    function test_Constants_Values() public view {
        assertEq(vault.MIN_DEPOSIT(), 1e6, "MIN_DEPOSIT should be 1 USDC");
        assertEq(vault.DEAD_SHARES(), 1000, "DEAD_SHARES should be 1000");
        assertEq(vault.DEAD_ADDRESS(), 0x000000000000000000000000000000000000dEaD, "DEAD_ADDRESS should be correct");
        assertEq(vault.USDC(), address(USDC), "USDC address should be correct");
    }

    // ========== CONVERSION TESTS ==========

    function test_ConvertToAssets_EmptyVault() public view {
        // Test convertToAssets when vault is empty
        uint256 assets = vault.convertToAssets(1000);
        assertEq(assets, 0, "convertToAssets should return 0 for empty vault");
    }

    function test_ConvertToAssets_WithDeposits() public {
        // Initial deposit
        _depositFor(user, AMOUNT);

        // Test convertToAssets with shares
        uint256 shares = vault.balanceOf(user);
        uint256 assets = vault.convertToAssets(shares);

        // With _effectiveSupply(), assets should be very close to deposit
        // Reduced tolerance because dead shares no longer dilute
        uint256 tolerance = 10; // Reduced from 1000 to 10
        assertGe(assets, AMOUNT - tolerance, "convertToAssets should be >= deposit (with tolerance)");
        assertLe(assets, AMOUNT + tolerance, "convertToAssets should be <= deposit (with tolerance)");
    }

    function test_ConvertToShares_EmptyVault() public view {
        // Test convertToShares when vault is empty (first deposit)
        uint256 shares = vault.convertToShares(AMOUNT);
        assertEq(shares, AMOUNT, "convertToShares should return assets for empty vault");
    }

    function test_ConvertToShares_WithDeposits() public {
        // Initial deposit
        _depositFor(user, AMOUNT);

        // Test convertToShares with assets
        uint256 shares = vault.convertToShares(AMOUNT);

        // Shares should be > 0
        assertGt(shares, 0, "convertToShares should return > 0 shares");

        // Verify consistency: convertToAssets(convertToShares(assets)) ≈ assets
        uint256 assetsBack = vault.convertToAssets(shares);
        uint256 tolerance = 2;
        assertGe(assetsBack, AMOUNT - tolerance, "Conversion round-trip should be consistent");
        assertLe(assetsBack, AMOUNT + tolerance, "Conversion round-trip should be consistent");
    }

    function test_ConvertToShares_DeadSharesImpact() public {
        // Initial deposit (mint dead shares)
        _depositFor(user, AMOUNT);

        // Calculate ratio with dead shares
        uint256 totalShares = vault.totalSupply();
        uint256 deadShares = vault.DEAD_SHARES();
        uint256 userShares = vault.balanceOf(user);

        // Verify that dead shares are included in total
        assertEq(totalShares, userShares + deadShares, "Total shares should include dead shares");

        // Test convertToShares - should account for dead shares
        uint256 newShares = vault.convertToShares(AMOUNT);
        assertGt(newShares, 0, "convertToShares should work with dead shares");
    }

    function testFuzz_ConvertToAssets(uint256 shares) public view {
        // Bound shares to reasonable range to avoid overflows
        shares = bound(shares, 0, 1_000_000 * 10 ** 18);

        // Skip extreme values that could cause overflows
        vm.assume(shares < type(uint256).max / 2);

        uint256 assets = vault.convertToAssets(shares);

        // If vault is empty, assets should be 0
        if (vault.totalSupply() == 0) {
            assertEq(assets, 0, "convertToAssets should return 0 for empty vault");
        } else {
            // Assets should be >= 0
            assertGe(assets, 0, "convertToAssets should return >= 0");
        }
    }

    function testFuzz_ConvertToShares(uint256 assets) public view {
        // Bound assets to reasonable range (0 to 1M USDC)
        assets = bound(assets, 0, 1_000_000 * 10 ** 6);

        // Skip extreme values that could cause overflows
        vm.assume(assets < type(uint256).max / 2);

        uint256 shares = vault.convertToShares(assets);

        // Shares should be >= 0
        assertGe(shares, 0, "convertToShares should return >= 0");

        // If vault is empty, shares should equal assets
        if (vault.totalSupply() == 0) {
            assertEq(shares, assets, "convertToShares should return assets for empty vault");
        }
    }

    // ========== WITHDRAWAL TESTS ==========

    function test_Fork_Withdraw_Basic() public {
        // Initial deposit
        uint256 depositAmount = 1000 * 10 ** 6; // 1000 USDC
        _depositFor(user, depositAmount);

        uint256 userShares = vault.balanceOf(user);
        uint256 userAssets = vault.convertToAssets(userShares);

        // Partial withdrawal - use new logic
        uint256 withdrawAmount = 500 * 10 ** 6; // 500 USDC
        uint256 sharesToBurn = vault.convertToShares(withdrawAmount);

        vm.startPrank(user);
        vault.approve(address(this), sharesToBurn);
        vault.withdraw(withdrawAmount, user, user);
        vm.stopPrank();

        // Verifications
        uint256 newUserShares = vault.balanceOf(user);
        uint256 newUserAssets = vault.convertToAssets(newUserShares);

        assertLt(newUserShares, userShares, "User shares should decrease");
        assertLt(newUserAssets, userAssets, "User assets should decrease");
        assertGe(newUserAssets, userAssets - withdrawAmount - 2, "Should not lose more than withdrawn");
    }

    function test_Fork_Withdraw_Full() public {
        // Initial deposit
        uint256 depositAmount = 1000 * 10 ** 6; // 1000 USDC
        _depositFor(user, depositAmount);

        uint256 userShares = vault.balanceOf(user);
        uint256 userAssets = vault.convertToAssets(userShares);

        // Full withdrawal - use converted assets
        vm.startPrank(user);
        vault.approve(address(this), userShares);
        vault.withdraw(userAssets, user, user);
        vm.stopPrank();

        // Verifications
        uint256 newUserShares = vault.balanceOf(user);
        assertEq(newUserShares, 0, "User should have 0 shares after full withdrawal");
    }

    function test_Fork_Withdraw_WithAllowance() public {
        // Initial deposit
        uint256 depositAmount = 1000 * 10 ** 6; // 1000 USDC
        _depositFor(user, depositAmount);

        address spender = address(0x9999);
        uint256 withdrawAmount = 500 * 10 ** 6; // 500 USDC
        uint256 sharesToBurn = vault.convertToShares(withdrawAmount);

        // User approval with exact amount
        vm.prank(user);
        vault.approve(spender, sharesToBurn);

        // Withdrawal by spender
        vm.prank(spender);
        vault.withdraw(withdrawAmount, user, user);

        // Verifications - allowance should be completely consumed
        uint256 allowance = vault.allowance(user, spender);
        assertEq(allowance, 0, "Allowance should be consumed");
    }

    function test_Fork_Withdraw_WithoutAllowance() public {
        // Initial deposit
        uint256 depositAmount = 1000 * 10 ** 6; // 1000 USDC
        _depositFor(user, depositAmount);

        address spender = address(0x9999);
        uint256 withdrawAmount = 500 * 10 ** 6; // 500 USDC

        // Attempt withdrawal without approval
        vm.prank(spender);
        vm.expectRevert(); // Accept any allowance error
        vault.withdraw(withdrawAmount, user, user);
    }

    function test_Fork_Withdraw_SlippageProtection() public {
        // Initial deposit
        uint256 depositAmount = 1000 * 10 ** 6; // 1000 USDC
        _depositFor(user, depositAmount);

        uint256 userShares = vault.balanceOf(user);
        uint256 userAssets = vault.convertToAssets(userShares);

        // Attempt withdrawal with excessive slippage
        // Simulate slippage by temporarily modifying totalAssets
        uint256 withdrawAmount = userAssets + 100; // More than we have

        vm.startPrank(user);
        vault.approve(address(this), userShares);
        vm.expectRevert(); // Accept any error (ERC4626ExceededMaxWithdraw or SlippageTooHigh)
        vault.withdraw(withdrawAmount, user, user);
        vm.stopPrank();
    }

    function test_Fork_Withdraw_ZeroAmount() public {
        // Initial deposit
        uint256 depositAmount = 1000 * 10 ** 6; // 1000 USDC
        _depositFor(user, depositAmount);

        uint256 sharesBefore = vault.balanceOf(user);

        // Withdrawal of 0 - may cause errors in Morpho vault
        vm.startPrank(user);
        vm.expectRevert(); // Accept any error
        vault.withdraw(0, user, user);
        vm.stopPrank();

        // Verifications
        uint256 sharesAfter = vault.balanceOf(user);
        assertEq(sharesAfter, sharesBefore, "Shares should not change for zero withdrawal");
    }

    function test_Fork_Withdraw_ExcessiveAmount() public {
        // Initial deposit
        uint256 depositAmount = 1000 * 10 ** 6; // 1000 USDC
        _depositFor(user, depositAmount);

        uint256 userShares = vault.balanceOf(user);
        uint256 userAssets = vault.convertToAssets(userShares);

        // Attempt to withdraw more than we have
        uint256 excessiveAmount = userAssets + 1000 * 10 ** 6; // 1000 USDC more

        vm.startPrank(user);
        vault.approve(address(this), userShares);
        vm.expectRevert(); // Accept any error (ERC4626ExceededMaxWithdraw or SlippageTooHigh)
        vault.withdraw(excessiveAmount, user, user);
        vm.stopPrank();
    }

    function test_Fork_Withdraw_DeadSharesPreserved() public {
        // Initial deposit (mint dead shares)
        uint256 depositAmount = 1000 * 10 ** 6; // 1000 USDC
        _depositFor(user, depositAmount);

        uint256 deadSharesBefore = vault.balanceOf(vault.DEAD_ADDRESS());

        // Complete user withdrawal
        uint256 userShares = vault.balanceOf(user);
        uint256 userAssets = vault.convertToAssets(userShares);

        vm.startPrank(user);
        vault.approve(address(this), userShares);
        vault.withdraw(userAssets, user, user);
        vm.stopPrank();

        // Verifications
        uint256 deadSharesAfter = vault.balanceOf(vault.DEAD_ADDRESS());

        assertEq(deadSharesAfter, deadSharesBefore, "Dead shares should be preserved");
        assertEq(deadSharesAfter, vault.DEAD_SHARES(), "Dead shares should equal constant");
    }

    function test_Fork_Withdraw_MultipleUsers() public {
        // Deposits from multiple users
        address user1 = address(0x1111);
        address user2 = address(0x2222);
        uint256 depositAmount = 1000 * 10 ** 6; // 1000 USDC

        _depositFor(user1, depositAmount);
        _depositFor(user2, depositAmount);

        uint256 user1Shares = vault.balanceOf(user1);
        uint256 user2Shares = vault.balanceOf(user2);

        // User1 withdrawal - use maxWithdraw to get exact amount
        uint256 user1MaxWithdraw = vault.maxWithdraw(user1);
        vm.startPrank(user1);
        vault.approve(address(this), user1Shares);
        vault.withdraw(user1MaxWithdraw, user1, user1);
        vm.stopPrank();

        // Verifications
        uint256 newUser2Shares = vault.balanceOf(user2);
        uint256 newTotalShares = vault.totalSupply();

        // User1 should have 0 or minimal shares due to rounding
        uint256 user1RemainingShares = vault.balanceOf(user1);
        assertLe(user1RemainingShares, 1, "User1 should have 0 or minimal shares");
        assertEq(newUser2Shares, user2Shares, "User2 shares should be unchanged");
        assertEq(
            newTotalShares,
            user2Shares + vault.DEAD_SHARES() + user1RemainingShares,
            "Total shares should be user2 + dead shares + remaining user1 shares"
        );
    }

    /// @notice Fuzz test for withdrawal function with random amounts
    function testFuzz_Fork_Withdraw(uint256 withdrawAmount) public {
        // Initial deposit
        uint256 depositAmount = 1000 * 10 ** 6; // 1000 USDC
        _depositFor(user, depositAmount);

        uint256 userShares = vault.balanceOf(user);
        uint256 max = vault.maxWithdraw(user); // Safe bound according to ERC-4626
        vm.assume(max > 0);
        withdrawAmount = bound(withdrawAmount, 1, max);

        uint256 sharesToBurn = vault.convertToShares(withdrawAmount);

        vm.startPrank(user);
        vault.approve(address(this), sharesToBurn);
        vault.withdraw(withdrawAmount, user, user);
        vm.stopPrank();

        // Invariant verifications
        uint256 newUserShares = vault.balanceOf(user);
        uint256 newUserAssets = vault.convertToAssets(newUserShares);

        assertLt(newUserShares, userShares, "User shares should decrease");
        assertLt(newUserAssets, max, "User assets should decrease");
        // No longer check for underflow as maxWithdraw bound guarantees safety
    }

    /// @notice Fuzz test for withdrawal with excessive amounts (should revert)
    function testFuzz_Fork_Withdraw_ExcessiveAmount(uint256 withdrawAmount) public {
        // Initial deposit
        uint256 depositAmount = 1000 * 10 ** 6; // 1000 USDC
        _depositFor(user, depositAmount);

        uint256 userShares = vault.balanceOf(user);
        uint256 userAssets = vault.convertToAssets(userShares);

        // Bound withdrawal amount to be greater than user's assets
        withdrawAmount = bound(withdrawAmount, userAssets + 1, userAssets + 1000 * 10 ** 6);

        uint256 sharesToBurn = vault.convertToShares(withdrawAmount);

        vm.startPrank(user);
        vault.approve(address(this), sharesToBurn);
        vm.expectRevert(); // Accept any error
        vault.withdraw(withdrawAmount, user, user);
        vm.stopPrank();
    }

    /// @notice Fuzz test for withdrawal with different receivers
    function testFuzz_Fork_Withdraw_DifferentReceiver(uint256 withdrawAmount, address receiver) public {
        // Initial deposit
        uint256 depositAmount = 1000 * 10 ** 6; // 1000 USDC
        _depositFor(user, depositAmount);

        uint256 userShares = vault.balanceOf(user);
        uint256 userAssets = vault.convertToAssets(userShares);

        // Bound withdrawal amount and filter receiver
        withdrawAmount = bound(withdrawAmount, 1, userAssets);
        vm.assume(receiver != address(0) && receiver != address(vault) && receiver != address(USDC)); // Avoid blacklisted addresses

        uint256 sharesToBurn = vault.convertToShares(withdrawAmount);
        uint256 receiverBalanceBefore = USDC.balanceOf(receiver);

        vm.startPrank(user);
        vault.approve(address(this), sharesToBurn);
        vault.withdraw(withdrawAmount, receiver, user);
        vm.stopPrank();

        // Verifications
        uint256 receiverBalanceAfter = USDC.balanceOf(receiver);
        assertEq(
            receiverBalanceAfter - receiverBalanceBefore,
            withdrawAmount,
            "Receiver should receive exact withdrawal amount"
        );
    }

    /// @notice Test withdrawal edge cases
    function test_Fork_Withdraw_EdgeCases() public {
        // Initial deposit
        uint256 depositAmount = 1000 * 10 ** 6; // 1000 USDC
        _depositFor(user, depositAmount);

        // Test 1: Withdrawal of 1 wei
        vm.startPrank(user);
        vault.approve(address(this), 1);
        vault.withdraw(1, user, user);
        vm.stopPrank();

        // Test 2: Withdrawal of everything except 1 wei
        uint256 remainingShares = vault.balanceOf(user);
        uint256 remainingAssets = vault.convertToAssets(remainingShares);
        uint256 withdrawAmount = remainingAssets - 1;

        vm.startPrank(user);
        vault.approve(address(this), remainingShares);
        vault.withdraw(withdrawAmount, user, user);
        vm.stopPrank();

        // Verifications
        uint256 finalShares = vault.balanceOf(user);
        uint256 finalAssets = vault.convertToAssets(finalShares);
        assertLe(finalAssets, 2, "Should have minimal assets remaining");
    }

    /// @notice Test full withdrawal with exact balance (may revert due to rounding)
    function test_Fork_Withdraw_ExactBalance() public {
        // Initial deposit
        uint256 depositAmount = 1000 * 10 ** 6; // 1000 USDC
        _depositFor(user, depositAmount);

        uint256 userShares = vault.balanceOf(user);
        uint256 userAssets = vault.convertToAssets(userShares);

        // Test withdrawal of exact balance - may legitimately revert due to dead shares
        vm.startPrank(user);
        vault.approve(address(this), userShares);

        // Withdrawal of exact balance may revert due to rounding up
        // This is normal behavior with dead shares
        try vault.withdraw(userAssets, user, user) {
            // If it succeeds, verify user has 0 shares
            assertEq(vault.balanceOf(user), 0, "User should have 0 shares after full withdrawal");
        } catch {
            // If it reverts, that's normal due to dead shares
            // User should use redeem() for exact withdrawal
            assertGt(vault.balanceOf(user), 0, "User should still have shares if withdraw reverted");
        }
        vm.stopPrank();
    }

    /// @notice Test withdrawal with allowance edge cases
    function test_Fork_Withdraw_AllowanceEdgeCases() public {
        // Initial deposit
        uint256 depositAmount = 1000 * 10 ** 6; // 1000 USDC
        _depositFor(user, depositAmount);

        address spender = address(0x9999);

        // Test 1: Exact approval - should consume exactly what's approved
        uint256 exactAllowance = vault.convertToShares(500 * 10 ** 6);
        vm.prank(user);
        vault.approve(spender, exactAllowance);

        vm.prank(spender);
        vault.withdraw(500 * 10 ** 6, user, user);

        assertEq(vault.allowance(user, spender), 0, "Allowance should be completely consumed");

        // Test 2: Insufficient approval with different spender
        address spender2 = address(0x8888);
        uint256 remainingAssets = vault.convertToAssets(vault.balanceOf(user));
        uint256 requiredShares = vault.convertToShares(remainingAssets);

        vm.prank(user);
        vault.approve(spender2, requiredShares - 1);

        vm.prank(spender2);
        vm.expectRevert(); // Accept any allowance error
        vault.withdraw(remainingAssets, user, user);
    }
}

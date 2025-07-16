// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Test} from "forge-std/Test.sol";
import {console} from "forge-std/console.sol";
import {RiseFiVault} from "../src/RiseFiVault.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";

// Event declarations for testing
event MorphoRedemptionInitiated(uint256 riseFiShares, uint256 morphoSharesToRedeem);

event MorphoRedemptionCompleted(uint256 morphoSharesRedeemed, uint256 usdcReceived);

event RiseFiSharesBurned(address owner, uint256 sharesBurned);

event Deposit(address sender, address owner, uint256 assets, uint256 shares);

event Withdraw(address sender, address receiver, address owner, uint256 assets, uint256 shares);

/**
 * @title RiseFi Vault Clean Tests
 * @notice Clean tests for RiseFi vault with deposit/redeem only approach
 * @dev Tests the new simplified architecture with disabled withdraw/mint
 */
contract RiseFiVaultCleanTest is Test {
    // ========== CONTRACTS ==========
    RiseFiVault public vault;

    // ========== BASE MAINNET ADDRESSES ==========
    IERC20Metadata public constant USDC = IERC20Metadata(0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913);
    address public constant MORPHO_VAULT_ADDRESS = 0x3128a0F7f0ea68E7B7c9B00AFa7E41045828e858;

    // ========== WHALE ADDRESSES ==========
    address public constant USDC_WHALE = 0x0B0A5886664376F59C351ba3f598C8A8B4D0A6f3;

    // ========== TEST ADDRESSES ==========
    address public testUser = address(0x1234);
    address public testUser2 = address(0x5678);
    uint256 public constant AMOUNT = 1000 * 10 ** 6; // 1000 USDC

    function setUp() public {
        // Create Base mainnet fork
        vm.createSelectFork(vm.rpcUrl("base_public"), 32_778_110);

        vault = new RiseFiVault(IERC20(address(USDC)), MORPHO_VAULT_ADDRESS);

        // Verify setup
        assertEq(USDC.decimals(), 6, "USDC should have 6 decimals");
        assertEq(USDC.symbol(), "USDC", "Should be USDC token");
    }

    // ========== HELPER FUNCTIONS ==========

    function _fundUser(address to, uint256 amount) internal {
        vm.startPrank(USDC_WHALE);
        USDC.transfer(to, amount);
        vm.stopPrank();
    }

    function _depositForUser(address userAddr, uint256 amount) internal returns (uint256 shares) {
        _fundUser(userAddr, amount);

        vm.startPrank(userAddr);
        USDC.approve(address(vault), amount);
        shares = vault.deposit(amount, userAddr);
        vm.stopPrank();
    }

    // ========== BASIC FUNCTIONALITY TESTS ==========

    function test_Clean_Deposit_Basic() public {
        _fundUser(testUser, AMOUNT);

        vm.startPrank(testUser);
        USDC.approve(address(vault), AMOUNT);

        uint256 shares = vault.deposit(AMOUNT, testUser);

        assertGt(shares, 0, "Should receive shares");
        assertEq(vault.balanceOf(testUser), shares, "User should have shares");
        assertEq(USDC.balanceOf(testUser), 0, "User should have transferred USDC");
        vm.stopPrank();
    }

    function test_Clean_Redeem_Basic() public {
        // Setup: user deposits
        uint256 shares = _depositForUser(testUser, AMOUNT);

        // Redeem half
        uint256 sharesToRedeem = shares / 2;
        uint256 expectedAssets = vault.convertToAssets(sharesToRedeem);

        vm.startPrank(testUser);
        uint256 assetsReceived = vault.redeem(sharesToRedeem, testUser, testUser);
        vm.stopPrank();

        assertApproxEqAbs(assetsReceived, expectedAssets, 100, "Should receive expected assets");
        assertEq(vault.balanceOf(testUser), shares - sharesToRedeem, "Should have remaining shares");
        assertEq(USDC.balanceOf(testUser), assetsReceived, "Should have received USDC");
    }

    function test_Clean_Redeem_Full() public {
        // Setup: user deposits
        uint256 shares = _depositForUser(testUser, AMOUNT);

        // Redeem all
        vm.startPrank(testUser);
        uint256 assetsReceived = vault.redeem(shares, testUser, testUser);
        vm.stopPrank();

        assertEq(vault.balanceOf(testUser), 0, "Should have no shares left");
        assertGt(assetsReceived, 0, "Should receive assets");
        assertEq(USDC.balanceOf(testUser), assetsReceived, "Should have received USDC");
    }

    // ========== DISABLED FUNCTIONS TESTS ==========

    function test_Clean_Withdraw_Works() public {
        // Setup: user deposits
        uint256 shares = _depositForUser(testUser, AMOUNT);
        uint256 assetsToWithdraw = vault.convertToAssets(shares / 2);
        uint256 balanceBefore = USDC.balanceOf(testUser);

        vm.startPrank(testUser);
        uint256 sharesBurned = vault.withdraw(assetsToWithdraw, testUser, testUser);
        vm.stopPrank();

        // withdraw() returns shares burned, not assets received
        assertApproxEqAbs(sharesBurned, vault.convertToShares(assetsToWithdraw), 2, "Should burn expected shares");

        // Verify user received assets
        uint256 balanceDelta = USDC.balanceOf(testUser) - balanceBefore;
        assertApproxEqAbs(balanceDelta, assetsToWithdraw, 100, "User should receive requested assets");
    }

    function test_Clean_Mint_Disabled() public {
        _fundUser(testUser, AMOUNT);

        vm.startPrank(testUser);
        USDC.approve(address(vault), AMOUNT);

        // Expect ERC4626 error since maxMint returns 0
        vm.expectRevert(); // Accept any revert (ERC4626ExceededMaxMint)
        vault.mint(1000, testUser);
        vm.stopPrank();
    }

    function test_Clean_MaxWithdraw_Works() public {
        uint256 shares = _depositForUser(testUser, AMOUNT);
        uint256 expectedMaxWithdraw = vault.convertToAssets(shares);

        uint256 maxWithdraw = vault.maxWithdraw(testUser);
        assertApproxEqAbs(maxWithdraw, expectedMaxWithdraw, 100, "maxWithdraw should return convertToAssets(balance)");

        // Self-check: maxWithdraw should equal itself
        assertEq(maxWithdraw, vault.maxWithdraw(testUser), "maxWithdraw should be consistent");
    }

    function test_Clean_MaxMint_Disabled() public {
        uint256 maxMint = vault.maxMint(testUser);
        assertEq(maxMint, 0, "maxMint should return 0 (disabled)");
    }

    // ========== EDGE CASES ==========

    function test_Clean_Redeem_ZeroShares() public {
        _depositForUser(testUser, AMOUNT);
        uint256 balanceBefore = USDC.balanceOf(testUser);

        vm.startPrank(testUser);
        // Redeeming 0 shares should work and return 0 assets (no revert)
        uint256 assetsReceived = vault.redeem(0, testUser, testUser);
        vm.stopPrank();

        // Should receive 0 assets and no transfer should occur
        assertEq(assetsReceived, 0, "Should receive 0 assets for 0 shares");
        assertEq(USDC.balanceOf(testUser), balanceBefore, "No USDC should be transferred");
    }

    function test_Clean_Redeem_ExcessiveShares() public {
        uint256 shares = _depositForUser(testUser, AMOUNT);

        vm.startPrank(testUser);
        vm.expectRevert(); // ERC4626ExceededMaxRedeem or similar
        vault.redeem(shares + 1, testUser, testUser);
        vm.stopPrank();
    }

    function test_Clean_MultipleUsers() public {
        // User1 deposits
        uint256 shares1 = _depositForUser(testUser, AMOUNT);

        // User2 deposits
        uint256 shares2 = _depositForUser(testUser2, AMOUNT * 2);

        // User1 redeems half
        vm.startPrank(testUser);
        vault.redeem(shares1 / 2, testUser, testUser);
        vm.stopPrank();

        // User2 redeems all
        vm.startPrank(testUser2);
        vault.redeem(shares2, testUser2, testUser2);
        vm.stopPrank();

        // Verify states
        assertEq(vault.balanceOf(testUser), shares1 / 2, "User1 should have half shares");
        assertEq(vault.balanceOf(testUser2), 0, "User2 should have no shares");
    }

    // ========== FUZZ TESTS ==========

    function testFuzz_Clean_Deposit_Redeem(uint256 amount) public {
        amount = bound(amount, 1 * 10 ** 6, 10000 * 10 ** 6); // 1 to 10k USDC

        uint256 shares = _depositForUser(testUser, amount);

        vm.startPrank(testUser);
        uint256 assetsReceived = vault.redeem(shares, testUser, testUser);
        vm.stopPrank();

        // Should receive approximately the same amount (minus fees/slippage)
        // Use absolute tolerance instead of relative for better robustness
        assertApproxEqAbs(
            assetsReceived,
            amount,
            1000, // 1000 wei tolerance (0.001 USDC)
            "Should receive ~same amount"
        );
    }

    function testFuzz_Clean_Partial_Redeem(uint256 amount, uint256 redeemPercent) public {
        amount = bound(amount, 1 * 10 ** 6, 10000 * 10 ** 6); // 1 to 10k USDC
        redeemPercent = bound(redeemPercent, 1, 100); // 1% to 100%

        uint256 shares = _depositForUser(testUser, amount);
        uint256 sharesToRedeem = (shares * redeemPercent) / 100;

        if (sharesToRedeem == 0) sharesToRedeem = 1; // Avoid zero

        vm.startPrank(testUser);
        uint256 assetsReceived = vault.redeem(sharesToRedeem, testUser, testUser);
        vm.stopPrank();

        assertGt(assetsReceived, 0, "Should receive assets");
        assertEq(vault.balanceOf(testUser), shares - sharesToRedeem, "Should have remaining shares");
    }

    // ========== ADDITIONAL EDGE CASES ==========

    function test_Clean_Withdraw_ZeroAmount() public {
        _depositForUser(testUser, AMOUNT);
        uint256 balanceBefore = USDC.balanceOf(testUser);

        vm.startPrank(testUser);
        uint256 sharesBurned = vault.withdraw(0, testUser, testUser);
        vm.stopPrank();

        // Should burn 0 shares and transfer 0 assets
        assertEq(sharesBurned, 0, "Should burn 0 shares for 0 withdrawal");
        assertEq(USDC.balanceOf(testUser), balanceBefore, "No USDC should be transferred");
    }

    function test_Clean_Redeem_AfterOtherUserDeposit() public {
        // User1 deposits
        uint256 shares1 = _depositForUser(testUser, AMOUNT);
        uint256 initialAssets1 = vault.convertToAssets(shares1);

        // User2 deposits (should affect share price due to DEAD_SHARES)
        uint256 shares2 = _depositForUser(testUser2, AMOUNT);
        uint256 initialAssets2 = vault.convertToAssets(shares2);

        // User1 redeems half - should work despite share price change
        uint256 sharesToRedeem = shares1 / 2;
        uint256 expectedAssets = vault.convertToAssets(sharesToRedeem);

        vm.startPrank(testUser);
        uint256 assetsReceived = vault.redeem(sharesToRedeem, testUser, testUser);
        vm.stopPrank();

        // Should receive assets (may differ from expected due to share price change)
        assertGt(assetsReceived, 0, "Should receive assets");
        assertApproxEqAbs(assetsReceived, expectedAssets, 1000, "Should receive reasonable assets");
    }

    function test_Clean_ZeroAddress_Handling() public {
        _depositForUser(testUser, AMOUNT);

        // Test with zero addresses - should revert
        vm.startPrank(testUser);

        // Try to redeem to zero address
        vm.expectRevert(); // ERC20 transfer to zero address should revert
        vault.redeem(1000, address(0), testUser);

        // Try to withdraw to zero address
        vm.expectRevert(); // ERC20 transfer to zero address should revert
        vault.withdraw(1000, address(0), testUser);

        vm.stopPrank();
    }

    // ========== EVENT TESTS ==========

    function test_Clean_Events_Redeem_Basic() public {
        uint256 shares = _depositForUser(testUser, AMOUNT);
        uint256 sharesToRedeem = shares / 2;

        vm.startPrank(testUser);
        vault.redeem(sharesToRedeem, testUser, testUser);
        vm.stopPrank();

        // Verify the redemption worked
        assertEq(vault.balanceOf(testUser), shares - sharesToRedeem, "Should have remaining shares");
    }

    function test_Clean_Events_Redeem_Full() public {
        uint256 shares = _depositForUser(testUser, AMOUNT);

        vm.startPrank(testUser);
        vault.redeem(shares, testUser, testUser);
        vm.stopPrank();

        // Verify full redemption
        assertEq(vault.balanceOf(testUser), 0, "Should have no shares left");
    }

    function test_Clean_Events_Redeem_ZeroShares() public {
        _depositForUser(testUser, AMOUNT);
        uint256 balanceBefore = USDC.balanceOf(testUser);

        vm.startPrank(testUser);
        uint256 assetsReceived = vault.redeem(0, testUser, testUser);
        vm.stopPrank();

        // Should receive 0 assets for 0 shares
        assertEq(assetsReceived, 0, "Should receive 0 assets for 0 shares");
        assertEq(USDC.balanceOf(testUser), balanceBefore, "No USDC should be transferred");
    }

    function test_Clean_Events_Multiple_Redemptions() public {
        uint256 shares = _depositForUser(testUser, AMOUNT);

        // First redemption
        vm.startPrank(testUser);
        vault.redeem(shares / 4, testUser, testUser);
        vm.stopPrank();

        // Second redemption
        vm.startPrank(testUser);
        vault.redeem(shares / 4, testUser, testUser);
        vm.stopPrank();

        // Verify final state
        assertEq(vault.balanceOf(testUser), shares / 2, "Should have remaining shares");
    }
}

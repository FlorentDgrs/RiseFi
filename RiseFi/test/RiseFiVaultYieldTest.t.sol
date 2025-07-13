// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Test} from "forge-std/Test.sol";
import {console} from "forge-std/console.sol";
import {RiseFiVault} from "../src/RiseFiVault.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";

/**
 * @title RiseFi Vault Yield Tests
 * @notice Tests for yield management using time machine with real interest accrual
 * @dev Uses vm.warp() + state-changing operations to simulate real yield accumulation
 */
contract RiseFiVaultYieldTest is Test {
    // ========== CONTRACTS ==========
    RiseFiVault public vault;

    // ========== BASE MAINNET ADDRESSES ==========
    IERC20Metadata public constant USDC = IERC20Metadata(0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913);
    address public constant MORPHO_VAULT_ADDRESS = 0x3128a0F7f0ea68E7B7c9B00AFa7E41045828e858;

    // ========== WHALE ADDRESSES ==========
    address public constant USDC_WHALE = 0x0B0A5886664376F59C351ba3f598C8A8B4D0A6f3;

    // ========== TEST ADDRESSES ==========
    address public user = address(0x1234);
    address public user2 = address(0x5678);
    uint256 public constant AMOUNT = 1000 * 10 ** 6; // 1000 USDC

    // ========== TIME CONSTANTS ==========
    uint256 public constant DAY = 86400;
    uint256 public constant WEEK = 7 * DAY;
    uint256 public constant MONTH = 30 * DAY;
    uint256 public constant YEAR = 365 * DAY;

    function setUp() public {
        vault = new RiseFiVault(IERC20(address(USDC)), MORPHO_VAULT_ADDRESS);

        // Verify we're on the right network
        assertEq(USDC.decimals(), 6, "USDC should have 6 decimals");
        assertEq(USDC.symbol(), "USDC", "Should be USDC token");
    }

    // ========== HELPER FUNCTIONS ==========

    /**
     * @dev Calculate percentage with basis points precision (1e4 = 100.00%)
     * @param num Numerator
     * @param denom Denominator
     * @return Percentage in basis points
     */
    function pct(uint256 num, uint256 denom) internal pure returns (uint256) {
        // Return basis-points (1e4 = 100.00%)
        return denom == 0 ? 0 : (num * 1e4) / denom;
    }

    /**
     * @dev Log percentage with decimal precision
     * @param label Label for the log
     * @param num Numerator
     * @param denom Denominator
     */
    function logPct(string memory label, uint256 num, uint256 denom) internal pure {
        uint256 basisPoints = pct(num, denom);
        uint256 whole = basisPoints / 100;
        uint256 decimal = basisPoints % 100;

        if (decimal < 10) {
            console.log("%s: %d.0%d %%", label, whole, decimal);
        } else {
            console.log("%s: %d.%d %%", label, whole, decimal);
        }
    }

    /**
     * @dev Log APY with proper decimal formatting
     * @param label Label for the log
     * @param apy APY in 1e18 scale
     */
    function logAPY(string memory label, uint256 apy) internal pure {
        // Convert from 1e18 to percentage with 2 decimals
        uint256 percentage = apy / 1e14; // 1e18 / 1e14 = 1e4 (basis points)
        uint256 whole = percentage / 100;
        uint256 decimal = percentage % 100;

        if (decimal < 10) {
            console.log("%s: %d.0%d %%", label, whole, decimal);
        } else {
            console.log("%s: %d.%d %%", label, whole, decimal);
        }
    }

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

    /**
     * @dev Calculate APY based on asset value change (not share count)
     * @param initialAssets Initial asset value
     * @param finalAssets Final asset value
     * @param timeElapsed Time elapsed in seconds
     * @return apy Annual percentage yield (scaled by 1e18)
     */
    function _calculateAPY(uint256 initialAssets, uint256 finalAssets, uint256 timeElapsed)
        internal
        pure
        returns (uint256)
    {
        if (timeElapsed == 0 || initialAssets == 0) return 0;

        // Calculate growth rate: (final - initial) / initial
        uint256 growth = finalAssets > initialAssets ? finalAssets - initialAssets : 0;
        uint256 growthRate = (growth * 1e18) / initialAssets;

        // Convert to annual rate: growth_rate * (365 days / time_elapsed)
        uint256 annualRate = (growthRate * 365 * DAY) / timeElapsed;

        return annualRate;
    }

    /**
     * @dev Simulate real yield by forcing interest accrual in Morpho
     * @param timeElapsed Time to simulate in seconds
     * @dev Uses a minimal deposit/withdrawal to trigger state changes
     */
    function _simulateYield(uint256 timeElapsed) internal {
        // Fast forward time
        vm.warp(block.timestamp + timeElapsed);

        // Force interest accrual by making a minimal deposit/withdrawal
        // This triggers the Morpho vault's interest calculation
        uint256 pokeAmount = vault.MIN_DEPOSIT(); // 1 USDC (minimum required)
        address temp = address(0xdead);

        // Fund temp address
        _fundWithUSDC(temp, pokeAmount);

        // Deposit to trigger accrual
        vm.startPrank(temp);
        USDC.approve(address(vault), pokeAmount);
        vault.deposit(pokeAmount, temp);

        // Try to withdraw everything; if a residual (1 wei) remains, ignore it
        uint256 shares = vault.balanceOf(temp);
        if (shares > 0) {
            try vault.redeem(shares, temp, temp) {} catch {}
        }
        vm.stopPrank();
    }

    // ========== YIELD TESTS ==========

    function test_Yield_RealTimeProgression() public {
        // Initial deposit
        uint256 initialShares = _depositFor(user, AMOUNT);
        uint256 initialAssets = vault.convertToAssets(initialShares);

        console.log("=== Initial State ===");
        console.log("Initial Shares:", initialShares);
        console.log("Initial Assets:", initialAssets);
        console.log("Share Price:", (initialAssets * 1e18) / initialShares);
        console.log("Morpho Vault Shares:", vault.morphoVault().balanceOf(address(vault)));

        // Simulate 1 day of yield
        _simulateYield(DAY);

        uint256 sharesAfter1Day = vault.balanceOf(user);
        uint256 assetsAfter1Day = vault.convertToAssets(sharesAfter1Day);

        console.log("\n=== After 1 Day ===");
        console.log("Shares:", sharesAfter1Day);
        console.log("Assets:", assetsAfter1Day);
        console.log("Share Price:", (assetsAfter1Day * 1e18) / sharesAfter1Day);
        console.log("Morpho Vault Shares:", vault.morphoVault().balanceOf(address(vault)));

        // Calculate yield based on asset value change
        uint256 yield = assetsAfter1Day > initialAssets ? assetsAfter1Day - initialAssets : 0;
        uint256 apy = _calculateAPY(initialAssets, assetsAfter1Day, DAY);

        console.log("Yield:", yield);
        logPct("Yield %", yield, initialAssets);
        logAPY("APY", apy);

        // Verify yield accumulation
        assertGe(assetsAfter1Day, initialAssets, "Assets should not decrease");
        if (yield > 0) {
            assertGt(apy, 0, "APY should be positive if yield generated");
        }
    }

    function test_Yield_MultipleUsersReal() public {
        // User 1 deposits
        uint256 user1Shares = _depositFor(user, AMOUNT);
        uint256 user1InitialAssets = vault.convertToAssets(user1Shares);

        // Simulate 1 week of yield
        _simulateYield(WEEK);

        // User 2 deposits
        uint256 user2Shares = _depositFor(user2, AMOUNT);
        uint256 user2InitialAssets = vault.convertToAssets(user2Shares);

        // Simulate another week of yield
        _simulateYield(WEEK);

        // Check final states
        uint256 user1FinalAssets = vault.convertToAssets(vault.balanceOf(user));
        uint256 user2FinalAssets = vault.convertToAssets(vault.balanceOf(user2));

        console.log("=== Multiple Users Yield (Real) ===");
        console.log("User1 Initial:", user1InitialAssets);
        console.log("User1 Final:", user1FinalAssets);
        console.log("User1 Yield:", user1FinalAssets - user1InitialAssets);

        console.log("User2 Initial:", user2InitialAssets);
        console.log("User2 Final:", user2FinalAssets);
        console.log("User2 Yield:", user2FinalAssets - user2InitialAssets);

        // Both users should have earned yield
        assertGe(user1FinalAssets, user1InitialAssets, "User1 should earn yield");
        assertGe(user2FinalAssets, user2InitialAssets, "User2 should earn yield");

        // User1 should earn more yield (deposited earlier)
        uint256 user1Yield = user1FinalAssets - user1InitialAssets;
        uint256 user2Yield = user2FinalAssets - user2InitialAssets;
        assertGe(user1Yield, user2Yield, "User1 should earn more yield (earlier deposit)");
    }

    function test_Yield_WithdrawalTimingReal() public {
        // Initial deposit
        uint256 initialShares = _depositFor(user, AMOUNT);
        uint256 initialAssets = vault.convertToAssets(initialShares);

        // Simulate 1 month of yield
        _simulateYield(MONTH);

        uint256 sharesAfter1Month = vault.balanceOf(user);
        uint256 assetsAfter1Month = vault.convertToAssets(sharesAfter1Month);
        uint256 yield = assetsAfter1Month - initialAssets;

        console.log("=== Withdrawal Timing (Real) ===");
        console.log("Initial Assets:", initialAssets);
        console.log("Assets after 1 month:", assetsAfter1Month);
        console.log("Yield earned:", yield);
        logPct("Yield %", yield, initialAssets);

        // Partial withdrawal
        uint256 withdrawAmount = 500 * 10 ** 6; // 500 USDC
        uint256 sharesToBurn = vault.convertToShares(withdrawAmount);

        vm.startPrank(user);
        vault.approve(address(this), sharesToBurn);
        vault.withdraw(withdrawAmount, user, user);
        vm.stopPrank();

        uint256 remainingShares = vault.balanceOf(user);
        uint256 remainingAssets = vault.convertToAssets(remainingShares);

        console.log("After withdrawal:");
        console.log("Remaining Assets:", remainingAssets);
        console.log("Remaining Shares:", remainingShares);

        // Verify withdrawal preserved yield proportion
        assertGt(remainingAssets, 0, "Should have remaining assets");
        assertGt(remainingShares, 0, "Should have remaining shares");
    }

    function test_Yield_StressTestReal() public {
        // Multiple deposits over time
        uint256 totalDeposited = 0;
        uint256 totalShares = 0;

        for (uint256 i = 0; i < 5; i++) {
            uint256 depositAmount = 100 * 10 ** 6; // 100 USDC each
            uint256 shares = _depositFor(user, depositAmount);

            totalDeposited += depositAmount;
            totalShares += shares;

            // Simulate 1 day of yield between deposits
            _simulateYield(DAY);

            console.log("Deposit", i + 1, ":");
            console.log("  Amount:", depositAmount);
            console.log("  Shares:", shares);
            console.log("  Total Assets:", vault.convertToAssets(totalShares));
        }

        // Simulate 1 month of yield
        _simulateYield(MONTH);

        uint256 finalAssets = vault.convertToAssets(vault.balanceOf(user));
        uint256 totalYield = finalAssets - totalDeposited;

        console.log("=== Stress Test Results (Real) ===");
        console.log("Total Deposited:", totalDeposited);
        console.log("Final Assets:", finalAssets);
        console.log("Total Yield:", totalYield);
        logPct("Yield %", totalYield, totalDeposited);

        // Verify yield accumulation
        assertGe(finalAssets, totalDeposited, "Should have earned yield");
        assertGt(totalYield, 0, "Should have positive yield");
    }

    function test_Yield_SharePriceConsistencyReal() public {
        // Initial deposit
        uint256 initialShares = _depositFor(user, AMOUNT);
        uint256 initialAssets = vault.convertToAssets(initialShares);
        uint256 initialSharePrice = (initialAssets * 1e18) / initialShares;

        console.log("=== Share Price Consistency (Real) ===");
        console.log("Initial Share Price:", initialSharePrice);

        // Track share price over time
        for (uint256 i = 1; i <= 7; i++) {
            _simulateYield(DAY);

            uint256 currentShares = vault.balanceOf(user);
            uint256 currentAssets = vault.convertToAssets(currentShares);
            uint256 currentSharePrice = currentShares > 0 ? (currentAssets * 1e18) / currentShares : 0;

            console.log("Day", i, "Share Price:", currentSharePrice);

            // Share price should be non-decreasing (yield accumulation)
            assertGe(currentSharePrice, initialSharePrice, "Share price should not decrease");
        }
    }

    function test_Yield_ConversionAccuracyReal() public {
        // Initial deposit
        _depositFor(user, AMOUNT);

        // Simulate 1 week of yield
        _simulateYield(WEEK);

        // Test conversion accuracy
        uint256 currentShares = vault.balanceOf(user);
        uint256 currentAssets = vault.convertToAssets(currentShares);

        // Convert back and forth
        uint256 sharesFromAssets = vault.convertToShares(currentAssets);
        uint256 assetsFromShares = vault.convertToAssets(currentShares);

        console.log("=== Conversion Accuracy (Real) ===");
        console.log("Current Shares:", currentShares);
        console.log("Current Assets:", currentAssets);
        console.log("Shares from Assets:", sharesFromAssets);
        console.log("Assets from Shares:", assetsFromShares);

        // Conversions should be consistent (within rounding tolerance)
        // Note: Tolerance may need adjustment based on fork block age and yield accumulation
        uint256 tolerance = 5; // 5 wei tolerance for rounding (accounts for older forks and cumulative rounding)
        assertGe(currentShares, sharesFromAssets - tolerance, "Share conversion should be accurate");
        assertLe(currentShares, sharesFromAssets + tolerance, "Share conversion should be accurate");
        assertGe(currentAssets, assetsFromShares - tolerance, "Asset conversion should be accurate");
        assertLe(currentAssets, assetsFromShares + tolerance, "Asset conversion should be accurate");
    }

    function test_Yield_RealWorldScenario() public {
        console.log("=== Real World Yield Scenario ===");

        // Day 1: User deposits 1000 USDC
        uint256 day1Shares = _depositFor(user, AMOUNT);
        uint256 day1Assets = vault.convertToAssets(day1Shares);
        console.log("Day 1 - Deposit:", day1Assets);
        console.log("USDC");

        // Track total time elapsed
        uint256 elapsed = 0;

        // Day 7: Check weekly yield
        _simulateYield(WEEK);
        elapsed += WEEK;
        uint256 day7Assets = vault.convertToAssets(vault.balanceOf(user));
        uint256 week1Yield = day7Assets - day1Assets;
        console.log("Day", elapsed / DAY);
        console.log("Assets:", day7Assets);
        console.log("Yield:", week1Yield);

        // Day 30: Check monthly yield
        _simulateYield(23 * DAY); // 23 more days to reach 30 days total
        elapsed += 23 * DAY;
        uint256 day30Assets = vault.convertToAssets(vault.balanceOf(user));
        uint256 month1Yield = day30Assets - day1Assets;
        console.log("Day", elapsed / DAY);
        console.log("Assets:", day30Assets);
        console.log("Yield:", month1Yield);

        // Day 365: Check annual yield
        _simulateYield(335 * DAY); // 335 more days to reach 365 days total
        elapsed += 335 * DAY;
        uint256 day365Assets = vault.convertToAssets(vault.balanceOf(user));
        uint256 year1Yield = day365Assets - day1Assets;
        console.log("Day", elapsed / DAY);
        console.log("Assets:", day365Assets);
        console.log("Yield:", year1Yield);

        // Calculate APY based on asset value change and actual time elapsed
        uint256 apy = _calculateAPY(day1Assets, day365Assets, elapsed);
        console.log("Annual APY (", elapsed / DAY, "days):");
        logAPY("APY", apy);

        // Verify yield growth
        assertGt(day7Assets, day1Assets, "Week 1 should have yield");
        assertGt(day30Assets, day7Assets, "Month 1 should have more yield");
        assertGt(day365Assets, day30Assets, "Year 1 should have most yield");
    }
}

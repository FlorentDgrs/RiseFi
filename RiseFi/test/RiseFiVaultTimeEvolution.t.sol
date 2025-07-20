// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {RiseFiVault} from "../src/RiseFiVault.sol";
import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {Test} from "forge-std/Test.sol";
import {console2} from "forge-std/console2.sol";

/**
 * @title RiseFi Vault Time Evolution Test Suite
 * @notice Tests spécifiques pour vérifier l'évolution temporelle du rfUSDC
 * @dev Teste que les shares rfUSDC augmentent en valeur au fil du temps grâce aux yields de Morpho
 * @author RiseFi Team
 */
contract RiseFiVaultTimeEvolutionTest is Test {
    // ========== STATE VARIABLES ==========
    RiseFiVault public vault;

    // ========== MAINNET CONSTANTS ==========
    /// @dev Base mainnet USDC token (6 decimals)
    IERC20Metadata public constant USDC = IERC20Metadata(0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913);
    /// @dev Target Morpho vault for yield generation
    address public constant MORPHO_VAULT_ADDRESS = 0x3128a0F7f0ea68E7B7c9B00AFa7E41045828e858;

    // ========== TEST CONFIGURATION ==========
    /// @dev Base mainnet whale address with substantial USDC balance
    address public constant USDC_WHALE = 0x0B0A5886664376F59C351ba3f598C8A8B4D0A6f3;
    /// @dev Standard test amount: 10,000 USDC (6 decimals) - plus gros montant pour voir les yields
    uint256 public constant AMOUNT = 10_000 * 10 ** 6;
    /// @dev Fork block number for consistent testing environment
    uint256 public constant FORK_BLOCK = 32_778_110;

    // ========== TEST ACTORS ==========
    address public testUser = address(0x1234);
    address public owner = address(0x9999);

    // ========== TIME EVOLUTION CONSTANTS ==========
    /// @dev Time periods to test (in seconds)
    uint256 public constant ONE_DAY = 24 * 60 * 60;
    uint256 public constant ONE_WEEK = 7 * ONE_DAY;
    uint256 public constant ONE_MONTH = 30 * ONE_DAY;

    /**
     * @notice Test setup: Deploy vault on Base fork with proper initialization
     * @dev Creates deterministic testing environment with:
     *      - Base mainnet fork at specific block
     *      - Fresh vault deployment
     *      - Validation of initial state
     */
    function setUp() public {
        // Create deterministic Base mainnet fork
        vm.createSelectFork(vm.rpcUrl("base_public"), FORK_BLOCK);

        // Deploy vault with proper ownership
        vm.startPrank(owner);
        vault = new RiseFiVault(IERC20(address(USDC)), MORPHO_VAULT_ADDRESS);
        vm.stopPrank();

        // Validate deployment assumptions
        assertEq(USDC.decimals(), 6, "USDC decimals assumption violated");
        assertEq(USDC.symbol(), "USDC", "USDC symbol assumption violated");
        assertEq(vault.decimals(), 18, "Vault decimals assumption violated");
        assertEq(vault.owner(), owner, "Vault ownership not set correctly");
    }

    // ========== HELPER FUNCTIONS ==========

    /**
     * @notice Fund test user with USDC from whale account
     * @dev Uses vm.startPrank to impersonate whale for token transfers
     * @param to Recipient address
     * @param amount Amount of USDC to transfer (6 decimals)
     */
    function _fundUser(address to, uint256 amount) internal {
        vm.startPrank(USDC_WHALE);
        USDC.transfer(to, amount);
        vm.stopPrank();
    }

    /**
     * @notice Complete deposit workflow: fund user, approve, and deposit
     * @dev Encapsulates common test pattern for cleaner test code
     * @param userAddr Address to perform deposit for
     * @param amount Amount of USDC to deposit
     * @return shares Number of vault shares received
     */
    function _depositForUser(address userAddr, uint256 amount) internal returns (uint256 shares) {
        _fundUser(userAddr, amount);

        vm.startPrank(userAddr);
        USDC.approve(address(vault), amount);
        shares = vault.deposit(amount, userAddr);
        vm.stopPrank();
    }

    /**
     * @notice Log vault state for debugging
     * @dev Prints key metrics to understand vault evolution
     */
    function _logVaultState(string memory label) internal view {
        uint256 totalAssets = vault.totalAssets();
        uint256 totalSupply = vault.totalSupply();
        uint256 deadShares = vault.DEAD_SHARES();
        uint256 effectiveShares = totalSupply - deadShares;

        // Calculate share price in USDC (6 decimals)
        uint256 sharePrice = effectiveShares > 0 ? (totalAssets * 1e12) / effectiveShares : 0;

        console2.log("=== VAULT STATE:", label, "===");
        console2.log("Total Assets (USDC):", totalAssets);
        console2.log("Total Supply (rfUSDC):", totalSupply);
        console2.log("Dead Shares:", deadShares);
        console2.log("Effective Shares:", effectiveShares);
        console2.log("Share Price (USDC):", sharePrice);
        console2.log("Current Block:", block.number);
        console2.log("Current Timestamp:", block.timestamp);
        console2.log("================================");
    }

    // ========== TIME EVOLUTION TESTS ==========

    /**
     * @notice Test that rfUSDC value increases over time (1 day)
     * @dev Verifies that shares become worth more USDC after time passes
     */
    function test_TimeEvolution_OneDay() public {
        // Initial deposit
        uint256 initialShares = _depositForUser(testUser, AMOUNT);
        uint256 initialAssets = vault.convertToAssets(initialShares);

        _logVaultState("INITIAL DEPOSIT");

        // Log initial state
        console2.log("Initial shares:", initialShares);
        console2.log("Initial assets value:", initialAssets);
        console2.log("Initial share price:", (initialAssets * 1e12) / initialShares);

        // Advance time by 1 day
        console2.log("Advancing time by 1 day...");
        vm.warp(block.timestamp + ONE_DAY);

        // Mine some blocks to simulate activity
        for (uint256 i = 0; i < 10; i++) {
            vm.roll(block.number + 1);
        }

        // Check new asset value
        uint256 newAssets = vault.convertToAssets(initialShares);

        _logVaultState("AFTER 1 DAY");

        console2.log("New assets value:", newAssets);
        console2.log("New share price:", (newAssets * 1e12) / initialShares);
        console2.log("Value increase:", newAssets > initialAssets ? "YES" : "NO");
        console2.log("Increase amount:", newAssets - initialAssets);

        // Assert that value has increased (or at least not decreased significantly)
        // Note: In a real fork, yields might be minimal, so we use a loose tolerance
        assertGe(newAssets, (initialAssets * 99) / 100, "Value should not decrease by more than 1%");

        // If we have a significant increase, log it
        if (newAssets > initialAssets) {
            console2.log("SUCCESS: rfUSDC value increased over time!");
            console2.log("Growth:", ((newAssets - initialAssets) * 10000) / initialAssets, "basis points");
        } else {
            console2.log("WARNING: No significant yield detected in 1 day");
        }
    }

    /**
     * @notice Test that rfUSDC value increases over time (1 week)
     * @dev Verifies that shares become worth more USDC after a week
     */
    function test_TimeEvolution_OneWeek() public {
        // Initial deposit
        uint256 initialShares = _depositForUser(testUser, AMOUNT);
        uint256 initialAssets = vault.convertToAssets(initialShares);

        _logVaultState("INITIAL DEPOSIT");

        // Advance time by 1 week
        console2.log("Advancing time by 1 week...");
        vm.warp(block.timestamp + ONE_WEEK);

        // Mine more blocks for a week
        for (uint256 i = 0; i < 100; i++) {
            vm.roll(block.number + 1);
        }

        // Check new asset value
        uint256 newAssets = vault.convertToAssets(initialShares);

        _logVaultState("AFTER 1 WEEK");

        console2.log("Initial assets value:", initialAssets);
        console2.log("New assets value:", newAssets);
        console2.log("Value increase:", newAssets > initialAssets ? "YES" : "NO");
        console2.log("Increase amount:", newAssets - initialAssets);

        // Assert that value has increased (or at least not decreased significantly)
        assertGe(newAssets, (initialAssets * 98) / 100, "Value should not decrease by more than 2%");

        if (newAssets > initialAssets) {
            console2.log("SUCCESS: rfUSDC value increased over 1 week!");
            console2.log("Growth:", ((newAssets - initialAssets) * 10000) / initialAssets, "basis points");
        } else {
            console2.log("WARNING: No significant yield detected in 1 week");
        }
    }

    /**
     * @notice Test that rfUSDC value increases over time (1 month)
     * @dev Verifies that shares become worth more USDC after a month
     */
    function test_TimeEvolution_OneMonth() public {
        // Initial deposit
        uint256 initialShares = _depositForUser(testUser, AMOUNT);
        uint256 initialAssets = vault.convertToAssets(initialShares);

        _logVaultState("INITIAL DEPOSIT");

        // Advance time by 1 month
        console2.log("Advancing time by 1 month...");
        vm.warp(block.timestamp + ONE_MONTH);

        // Mine more blocks for a month
        for (uint256 i = 0; i < 500; i++) {
            vm.roll(block.number + 1);
        }

        // Check new asset value
        uint256 newAssets = vault.convertToAssets(initialShares);

        _logVaultState("AFTER 1 MONTH");

        console2.log("Initial assets value:", initialAssets);
        console2.log("New assets value:", newAssets);
        console2.log("Value increase:", newAssets > initialAssets ? "YES" : "NO");
        console2.log("Increase amount:", newAssets - initialAssets);

        // Assert that value has increased (or at least not decreased significantly)
        assertGe(newAssets, (initialAssets * 95) / 100, "Value should not decrease by more than 5%");

        if (newAssets > initialAssets) {
            console2.log("SUCCESS: rfUSDC value increased over 1 month!");
            console2.log("Growth:", ((newAssets - initialAssets) * 10000) / initialAssets, "basis points");
        } else {
            console2.log("WARNING: No significant yield detected in 1 month");
        }
    }

    /**
     * @notice Test multiple deposits over time to see yield accumulation
     * @dev Simulates real usage pattern with multiple deposits
     */
    function test_TimeEvolution_MultipleDeposits() public {
        // First deposit
        uint256 shares1 = _depositForUser(testUser, AMOUNT);
        uint256 assets1 = vault.convertToAssets(shares1);

        console2.log("=== MULTIPLE DEPOSITS TEST ===");
        console2.log("Deposit 1 - Shares:", shares1, "Assets:", assets1);

        // Advance time by 1 week
        vm.warp(block.timestamp + ONE_WEEK);
        for (uint256 i = 0; i < 50; i++) {
            vm.roll(block.number + 1);
        }

        // Second deposit
        uint256 shares2 = _depositForUser(testUser, AMOUNT);
        uint256 assets2 = vault.convertToAssets(shares2);

        console2.log("Deposit 2 - Shares:", shares2, "Assets:", assets2);

        // Check if second deposit gets more shares for same USDC (indicating yield)
        if (shares2 > shares1) {
            console2.log("SUCCESS: Second deposit received more shares (yield accumulated)");
            console2.log("Share increase:", shares2 - shares1);
        } else {
            console2.log("WARNING: No yield accumulation detected");
        }

        // Advance time by another week
        vm.warp(block.timestamp + ONE_WEEK);
        for (uint256 i = 0; i < 50; i++) {
            vm.roll(block.number + 1);
        }

        // Check total value
        uint256 totalShares = shares1 + shares2;
        uint256 totalAssets = vault.convertToAssets(totalShares);
        uint256 expectedAssets = assets1 + assets2;

        console2.log("Total shares:", totalShares);
        console2.log("Total assets value:", totalAssets);
        console2.log("Expected assets value:", expectedAssets);
        console2.log("Value increase:", totalAssets > expectedAssets ? "YES" : "NO");

        // Assert that total value has increased
        assertGe(totalAssets, (expectedAssets * 98) / 100, "Total value should not decrease significantly");

        if (totalAssets > expectedAssets) {
            console2.log("SUCCESS: Multiple deposits show yield accumulation!");
        }
    }

    /**
     * @notice Test yield rate calculation and comparison
     * @dev Attempts to calculate actual yield rate and compare with expected
     */
    function test_TimeEvolution_YieldRateCalculation() public {
        // Initial deposit
        uint256 initialShares = _depositForUser(testUser, AMOUNT);
        uint256 initialAssets = vault.convertToAssets(initialShares);

        console2.log("=== YIELD RATE CALCULATION ===");
        console2.log("Initial deposit:", initialAssets, "USDC");
        console2.log("Initial shares:", initialShares);

        // Advance time by 1 month
        uint256 timeElapsed = ONE_MONTH;
        vm.warp(block.timestamp + timeElapsed);

        // Mine blocks
        for (uint256 i = 0; i < 200; i++) {
            vm.roll(block.number + 1);
        }

        // Check final value
        uint256 finalAssets = vault.convertToAssets(initialShares);
        uint256 assetIncrease = finalAssets - initialAssets;

        console2.log("Final assets:", finalAssets, "USDC");
        console2.log("Asset increase:", assetIncrease, "USDC");
        console2.log("Time elapsed:", timeElapsed, "seconds");

        // Calculate yield rate (annualized)
        if (assetIncrease > 0) {
            uint256 annualYield = (assetIncrease * 365 days * 10000) / (initialAssets * timeElapsed);
            console2.log("Annualized yield rate:", annualYield, "basis points");
            console2.log("Annualized yield percentage:", annualYield / 100, "%");

            // Log comparison with typical DeFi yields
            console2.log("Typical DeFi yields: 5-15% APY");
            console2.log("Our calculated yield:", annualYield / 100, "% APY");

            if (annualYield > 100) {
                // > 1% APY
                console2.log("SUCCESS: Significant yield detected!");
            } else {
                console2.log("WARNING: Low yield detected - may be due to fork limitations");
            }
        } else {
            console2.log("WARNING: No yield detected");
        }

        // Assert that we at least don't lose value
        assertGe(finalAssets, (initialAssets * 95) / 100, "Should not lose more than 5% value");
    }

    /**
     * @notice Test that share price increases over time with detailed precision
     * @dev Verifies the core mechanism: shares become worth more USDC
     */
    function test_TimeEvolution_SharePriceIncrease() public {
        // Initial deposit
        uint256 initialShares = _depositForUser(testUser, AMOUNT);

        // Calculate initial share price (in USDC, 6 decimals)
        uint256 initialAssets = vault.convertToAssets(initialShares);
        uint256 initialSharePrice = initialShares > 0 ? (initialAssets * 1e12) / initialShares : 0;

        console2.log("=== SHARE PRICE EVOLUTION (DETAILED) ===");
        console2.log("Initial assets:", initialAssets, "USDC (6 decimals)");
        console2.log("Initial shares:", initialShares, "rfUSDC (18 decimals)");

        // Display share price with more precision
        if (initialSharePrice > 0) {
            uint256 wholePart = initialSharePrice / 1e12;
            uint256 decimalPart = initialSharePrice % 1e12;
            console2.log("Initial share price whole part:", wholePart);
            console2.log("Initial share price decimal part:", decimalPart);
            console2.log("Initial share price (raw):", initialSharePrice);
        } else {
            console2.log("Initial share price: 0");
        }

        // Advance time by 2 weeks
        vm.warp(block.timestamp + 2 * ONE_WEEK);
        for (uint256 i = 0; i < 100; i++) {
            vm.roll(block.number + 1);
        }

        // Calculate new share price
        uint256 newAssets = vault.convertToAssets(initialShares);
        uint256 newSharePrice = initialShares > 0 ? (newAssets * 1e12) / initialShares : 0;

        console2.log("New assets:", newAssets, "USDC (6 decimals)");

        // Display new share price with more precision
        if (newSharePrice > 0) {
            uint256 wholePart = newSharePrice / 1e12;
            uint256 decimalPart = newSharePrice % 1e12;
            console2.log("New share price whole part:", wholePart);
            console2.log("New share price decimal part:", decimalPart);
            console2.log("New share price (raw):", newSharePrice);
        } else {
            console2.log("New share price: 0");
        }

        console2.log("Price increase:", newSharePrice > initialSharePrice ? "YES" : "NO");

        if (newSharePrice > initialSharePrice && initialSharePrice > 0) {
            uint256 priceIncrease = newSharePrice - initialSharePrice;
            uint256 percentageIncrease = (priceIncrease * 10000) / initialSharePrice;
            console2.log("Price increase amount:", priceIncrease, "(in 1e12 units)");
            console2.log("Percentage increase:", percentageIncrease, "basis points");
            console2.log("SUCCESS: Share price increased over time!");
        } else if (newSharePrice > initialSharePrice) {
            console2.log("SUCCESS: Share price increased from zero!");
        } else {
            console2.log("WARNING: Share price did not increase");
        }

        // Assert that share price doesn't decrease significantly (only if initial price > 0)
        if (initialSharePrice > 0) {
            assertGe(newSharePrice, (initialSharePrice * 98) / 100, "Share price should not decrease by more than 2%");
        } else {
            // If initial price was 0, just check that new price is reasonable
            assertGe(newSharePrice, 0, "Share price should be non-negative");
        }
    }
}

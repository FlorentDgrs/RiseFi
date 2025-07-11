// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Test} from "forge-std/Test.sol";
import {RiseFiVault} from "../src/RiseFiVault.sol";
import {MockedUSDC} from "../src/MockedUSDC.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract RiseFiVaultTest is Test {
    RiseFiVault public vault;
    MockedUSDC public USDC;
    address public owner = address(this);
    address public user = address(0x1234);
    uint256 public constant AMOUNT = 1000 * 10 ** 6;

    function setUp() public {
        USDC = new MockedUSDC();
        vault = new RiseFiVault(IERC20(address(USDC)));
    }

    // ========== HELPER FUNCTIONS ==========

    /**
     * @dev Helper: Mint USDC to user and approve vault
     */
    function _mintAndApprove(address to, uint256 amount) internal {
        USDC.mint(to, amount);
        vm.prank(to);
        USDC.approve(address(vault), amount);
    }

    /**
     * @dev Helper: Complete deposit flow for user
     * @return shares Amount of vault shares received
     */
    function _depositFor(
        address account,
        uint256 amount
    ) internal returns (uint256 shares) {
        _mintAndApprove(account, amount);
        vm.prank(account);
        shares = vault.deposit(amount, account);
    }

    /**
     * @dev Helper: Setup user with USDC balance ready for operations
     */
    function _setupUser(address account, uint256 amount) internal {
        USDC.mint(account, amount);
        vm.prank(account);
        USDC.approve(address(vault), type(uint256).max); // Unlimited approval
    }

    // ========== METADATA TESTS ==========

    function test_Constructor_SetsCorrectMetadata() public view {
        assertEq(vault.name(), "RiseFi USDC");
        assertEq(vault.symbol(), "rfUSDC");
        assertEq(vault.decimals(), 6);
    }

    function test_Asset_ReturnsCorrectUSDCAddress() public view {
        assertEq(address(vault.asset()), address(USDC));
    }

    // ========== DEPOSIT TESTS ==========

    function test_Deposit_FirstDepositor_ReceivesOneToOneShares() public {
        // Setup
        _mintAndApprove(user, AMOUNT);

        // Action
        vm.prank(user);
        uint256 shares = vault.deposit(AMOUNT, user);

        // Assertions
        assertEq(shares, AMOUNT, "Should receive 1:1 shares initially");
        assertEq(vault.balanceOf(user), AMOUNT, "User should have shares");
        assertEq(
            USDC.balanceOf(address(vault)),
            AMOUNT,
            "Vault should have USDC"
        );
        assertEq(USDC.balanceOf(user), 0, "User should have no USDC left");
        assertEq(vault.totalAssets(), AMOUNT, "Total assets should match");
    }

    function test_Deposit_WithHelper_ReceivesCorrectShares() public {
        // Using helper for cleaner test
        uint256 shares = _depositFor(user, AMOUNT);

        // Assertions
        assertEq(shares, AMOUNT);
        assertEq(vault.balanceOf(user), AMOUNT);
        assertEq(USDC.balanceOf(address(vault)), AMOUNT);
    }

    // ========== WITHDRAW TESTS ==========

    function test_Withdraw_FullAmount_BurnsAllSharesAndReturnsUSDC() public {
        // GIVEN: User has deposited USDC
        _depositFor(user, AMOUNT);

        // WHEN: User withdraws USDC
        vm.prank(user);
        uint256 assetsReceived = vault.withdraw(AMOUNT, user, user);

        // THEN: User should have original USDC back
        assertEq(assetsReceived, AMOUNT, "Should receive exact USDC amount");
        assertEq(vault.balanceOf(user), 0, "User should have no shares");
        assertEq(USDC.balanceOf(address(vault)), 0, "Vault should be empty");
        assertEq(
            USDC.balanceOf(user),
            AMOUNT,
            "User should have original USDC"
        );
        assertEq(vault.totalAssets(), 0, "Total assets should be zero");
    }

    function test_Withdraw_PartialAmount_BurnsProportionalShares() public {
        // GIVEN: User has deposited USDC
        _depositFor(user, AMOUNT);

        // WHEN: User withdraws half
        uint256 withdrawAmount = AMOUNT / 2;
        vm.prank(user);
        vault.withdraw(withdrawAmount, user, user);

        // THEN: User should have half shares and half USDC
        assertEq(
            vault.balanceOf(user),
            AMOUNT / 2,
            "User should have half shares"
        );
        assertEq(
            USDC.balanceOf(user),
            withdrawAmount,
            "User should have half USDC"
        );
        assertEq(
            vault.totalAssets(),
            AMOUNT / 2,
            "Vault should have half assets"
        );
    }

    // ========== INTEGRATION TESTS ==========

    function test_DepositAndWithdraw_FullCycle_RestoresInitialState() public {
        // Complete cycle test

        // Deposit
        uint256 shares = _depositFor(user, AMOUNT);
        assertEq(shares, AMOUNT);

        // Withdraw all
        vm.prank(user);
        vault.withdraw(AMOUNT, user, user);

        // Back to initial state
        assertEq(
            USDC.balanceOf(user),
            AMOUNT,
            "User should have original USDC back"
        );
        assertEq(vault.balanceOf(user), 0, "User should have no shares");
        assertEq(vault.totalAssets(), 0, "Vault should be empty");
    }
}

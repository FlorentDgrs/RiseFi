// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title RiseFi Vault - Morpho Integration
 * @notice ERC4626 wrapper around Morpho USDC vault on Base network
 * @dev Vault designed for retail users with inflation attack protection
 * @author RiseFi Team
 */
contract RiseFiVault is ERC4626 {
    using SafeERC20 for IERC20;

    // ========== PROTECTION CONSTANTS ==========

    /// @notice Minimum deposit amount allowed (1 USDC)
    uint256 public constant MIN_DEPOSIT = 1e6;

    /// @notice Number of "dead shares" minted at initialization to prevent inflation attacks
    /// @dev These shares are sent to DEAD_ADDRESS to establish an inviolable minimum ratio
    uint256 public constant DEAD_SHARES = 1000;

    /// @notice Dead shares address (recommended: address(0x...dEaD))
    address public constant DEAD_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    /// @notice Authorized asset: USDC on Base network
    address public constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;

    /// @notice Underlying Morpho vault (MetaMorpho ERC4626)
    IERC4626 public immutable morphoVault;

    // ========== CUSTOM ERRORS ==========

    /// @notice Thrown when deposit amount is below minimum
    error InsufficientDeposit(uint256 provided, uint256 minimum);

    /// @notice Thrown when asset address doesn't match expected USDC
    error InvalidAsset(address provided, address expected);

    /// @notice Thrown when slippage exceeds tolerance during withdrawal
    error SlippageTooHigh(uint256 expected, uint256 actual);

    // ========== CONSTRUCTOR ==========

    /**
     * @notice Initialize RiseFi vault with USDC asset and Morpho vault
     * @param asset_ The underlying asset (must be USDC)
     * @param morphoVault_ The Morpho vault address to integrate with
     * @dev Validates asset is USDC and sets up maximum approval for Morpho vault
     */
    constructor(IERC20 asset_, address morphoVault_) ERC20("RiseFi Vault", "rfVault") ERC4626(asset_) {
        if (address(asset_) != USDC) {
            revert InvalidAsset(address(asset_), USDC);
        }

        morphoVault = IERC4626(morphoVault_);

        // Set maximum approval to avoid approvals on each deposit
        // Some tokens like USDC require reset to 0 before new approval
        asset_.approve(address(morphoVault), 0); // reset
        asset_.approve(address(morphoVault), type(uint256).max); // set
    }

    // ========== CORE LOGIC ==========

    /**
     * @notice Calculate total value of assets (in USDC)
     * @return Total assets value by converting Morpho shares to assets
     */
    function totalAssets() public view override returns (uint256) {
        uint256 morphoShares = IERC20(address(morphoVault)).balanceOf(address(this));
        return morphoVault.convertToAssets(morphoShares);
    }

    /**
     * @dev Actually redeemable supply (total - dead shares)
     * @return supply The effective supply excluding dead shares
     */
    function _effectiveSupply() internal view returns (uint256 supply) {
        uint256 total = totalSupply();
        supply = total > DEAD_SHARES ? total - DEAD_SHARES : 0;
    }

    /**
     * @notice Override deposit: transfer USDC, invest in Morpho, mint RiseFi shares
     * @param caller The address calling the deposit
     * @param receiver The address receiving the shares
     * @param assets The amount of assets to deposit
     * @param shares The amount of shares to mint
     * @dev Implements inflation protection by minting dead shares on first deposit
     */
    function _deposit(address caller, address receiver, uint256 assets, uint256 shares) internal override {
        if (assets < MIN_DEPOSIT) {
            revert InsufficientDeposit(assets, MIN_DEPOSIT);
        }

        // Inflation protection: mint DEAD_SHARES on first deposit
        // BEFORE asset transfer to establish minimum ratio
        if (totalSupply() == 0) {
            _mint(DEAD_ADDRESS, DEAD_SHARES);
        }

        IERC20(asset()).safeTransferFrom(caller, address(this), assets);
        morphoVault.deposit(assets, address(this));
        _mint(receiver, shares);

        emit Deposit(caller, receiver, assets, shares);
    }

    // ========== CONVERSION OVERRIDES ==========

    /**
     * @notice Convert shares to assets (USDC)
     * @param shares The amount of shares to convert
     * @return The equivalent amount of assets
     * @dev ERC-4626 specification: round down
     */
    function convertToAssets(uint256 shares) public view override returns (uint256) {
        return _convertToAssets(shares, Math.Rounding.Floor);
    }

    /**
     * @notice Convert assets (USDC) to shares
     * @param assets The amount of assets to convert
     * @return The equivalent amount of shares
     * @dev ERC-4626 specification: round down
     */
    function convertToShares(uint256 assets) public view override returns (uint256) {
        return _convertToShares(assets, Math.Rounding.Floor);
    }

    /// ---------------------------------------------------------------------
    ///  Internal conversions (used by OZ helpers)
    /// ---------------------------------------------------------------------

    /**
     * @dev Convert shares to assets with specified rounding
     * @param shares The amount of shares to convert
     * @param rounding The rounding mode to use
     * @return The equivalent amount of assets
     */
    function _convertToAssets(uint256 shares, Math.Rounding rounding) internal view override returns (uint256) {
        uint256 eff = _effectiveSupply();
        if (eff == 0) return 0; // Empty vault
        return Math.mulDiv(shares, totalAssets(), eff, rounding);
    }

    /**
     * @dev Convert assets to shares with specified rounding
     * @param assets The amount of assets to convert
     * @param rounding The rounding mode to use
     * @return The equivalent amount of shares
     */
    function _convertToShares(uint256 assets, Math.Rounding rounding) internal view override returns (uint256) {
        uint256 eff = _effectiveSupply();
        if (eff == 0) return assets; // First deposit
        return Math.mulDiv(assets, eff, totalAssets(), rounding);
    }

    // ========== WITHDRAWAL LOGIC ==========

    /**
     * @notice Override withdrawal: burn RiseFi shares, withdraw from Morpho, transfer USDC
     * @param caller The address calling the withdrawal
     * @param receiver The address receiving the assets
     * @param owner The address owning the shares
     * @param assets The amount of assets to withdraw
     * @param shares The amount of shares to burn
     * @dev Implements slippage protection and deflationary token protection
     */
    function _withdraw(address caller, address receiver, address owner, uint256 assets, uint256 shares)
        internal
        override
    {
        if (caller != owner) {
            _spendAllowance(owner, caller, shares);
        }

        _burn(owner, shares); // burn RiseFi shares

        // Check balance before withdrawal
        uint256 balanceBefore = IERC20(asset()).balanceOf(address(this));

        // Get USDC by withdrawing assets from Morpho vault
        morphoVault.withdraw(assets, address(this), address(this));

        // Calculate how much we actually received
        uint256 balanceAfter = IERC20(asset()).balanceOf(address(this));

        // Protection against deflationary tokens
        require(balanceAfter >= balanceBefore, "Unexpected balance decrease");

        uint256 received = balanceAfter - balanceBefore;

        // 2 wei tolerance to avoid floor/rounding effects
        uint256 tolerance = 2;
        if (received + tolerance < assets || received > assets + tolerance) {
            revert SlippageTooHigh(assets, received);
        }

        // Secure transfer to user
        IERC20(asset()).safeTransfer(receiver, assets);

        emit Withdraw(caller, receiver, owner, assets, shares);
    }

    // ========== MINT/REDEEM OVERRIDES ==========

    /**
     * @notice Mint shares by depositing assets
     * @param caller The address calling the mint
     * @param receiver The address receiving the shares
     * @param shares The amount of shares to mint
     * @param assets The amount of assets required
     * @dev Delegates to _deposit with calculated assets
     */
    function _mint(address caller, address receiver, uint256 shares, uint256 assets) internal {
        _deposit(caller, receiver, assets, shares);
    }

    /**
     * @notice Redeem shares by withdrawing assets
     * @param caller The address calling the redeem
     * @param receiver The address receiving the assets
     * @param owner The address owning the shares
     * @param shares The amount of shares to redeem
     * @param assets The amount of assets to receive
     * @dev Delegates to _withdraw with calculated assets
     */
    function _redeem(address caller, address receiver, address owner, uint256 shares, uint256 assets) internal {
        _withdraw(caller, receiver, owner, assets, shares);
    }

    // ========== PREVIEW FUNCTIONS ==========

    /**
     * @notice Preview the amount of shares that would be minted for a given deposit
     * @param assets The amount of assets to deposit
     * @return The amount of shares that would be minted
     */
    function previewDeposit(uint256 assets) public view override returns (uint256) {
        return convertToShares(assets);
    }

    /**
     * @notice Preview the amount of shares that would be burned for a given withdrawal
     * @param assets The amount of assets to withdraw
     * @return The amount of shares that would be burned
     */
    function previewWithdraw(uint256 assets) public view override returns (uint256) {
        return convertToShares(assets);
    }

    /**
     * @notice Preview the amount of assets required to mint a given amount of shares
     * @param shares The amount of shares to mint
     * @return The amount of assets required
     */
    function previewMint(uint256 shares) public view override returns (uint256) {
        uint256 eff = _effectiveSupply();
        if (eff == 0) return shares; // First deposit
        return Math.mulDiv(shares, totalAssets(), eff, Math.Rounding.Ceil);
    }

    /**
     * @notice Preview the amount of assets that would be received for a given share redemption
     * @param shares The amount of shares to redeem
     * @return The amount of assets that would be received
     */
    function previewRedeem(uint256 shares) public view override returns (uint256) {
        return convertToAssets(shares);
    }

    // ========== MAX FUNCTIONS ==========

    /**
     * @notice Get the maximum amount of assets that can be deposited
     * @return The maximum deposit amount
     */
    function maxDeposit(address) public pure override returns (uint256) {
        return type(uint256).max;
    }

    /**
     * @notice Get the maximum amount of shares that can be minted
     * @return The maximum mint amount
     */
    function maxMint(address) public pure override returns (uint256) {
        return type(uint256).max;
    }

    /**
     * @notice Get the maximum amount of assets that can be withdrawn by the owner
     * @param owner The address owning the shares
     * @return The maximum withdrawal amount
     */
    function maxWithdraw(address owner) public view override returns (uint256) {
        uint256 shares = balanceOf(owner);
        return convertToAssets(shares);
    }

    /**
     * @notice Get the maximum amount of shares that can be redeemed by the owner
     * @param owner The address owning the shares
     * @return The maximum redemption amount
     */
    function maxRedeem(address owner) public view override returns (uint256) {
        return balanceOf(owner);
    }
}

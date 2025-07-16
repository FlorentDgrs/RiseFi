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

    // ========== EVENTS ==========

    /// @notice Emitted when Morpho redemption is initiated
    event MorphoRedemptionInitiated(uint256 riseFiShares, uint256 morphoSharesToRedeem);

    /// @notice Emitted when Morpho redemption is completed
    event MorphoRedemptionCompleted(uint256 morphoSharesRedeemed, uint256 usdcReceived);

    /// @notice Emitted when RiseFi shares are burned
    event RiseFiSharesBurned(address owner, uint256 sharesBurned);

    // ========== CONSTRUCTOR ==========

    /**
     * @notice Initialize RiseFi vault with USDC asset and Morpho vault
     * @param asset_ The underlying asset (must be USDC)
     * @param morphoVault_ The Morpho vault address to integrate with
     * @dev Validates asset is USDC and sets up maximum approval for Morpho vault
     */
    constructor(IERC20 asset_, address morphoVault_) ERC20("RiseFi Vault", "rfUSDC") ERC4626(asset_) {
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

    // ========== WITHDRAWAL/REDEMPTION OVERRIDES ==========

    /**
     * @notice Withdraw assets by burning shares - delegates to redeem logic
     * @dev Implements ERC4626 withdraw by delegating to our redeem implementation
     */
    function _withdraw(address caller, address receiver, address owner, uint256 assets, uint256 shares)
        internal
        override
    {
        // Delegate to redeem implementation for consistent business logic
        _redeem(caller, receiver, owner, shares, assets);
    }

    // ========== MINT/REDEEM OVERRIDES ==========

    /**
     * @notice Minting is disabled - use deposit() instead
     * @dev Forces users to use deposit() which is more predictable and robust
     */
    function _mint(address, address, uint256, uint256) internal pure {
        revert("RiseFiVault: Use deposit() instead of mint()");
    }

    /**
     * @notice Redeem RiseFi shares for USDC assets
     * @param caller The address calling the redeem
     * @param receiver The address receiving the USDC
     * @param owner The address owning the shares
     * @param shares The amount of RiseFi shares to redeem
     * @dev Core redemption logic: burn RiseFi shares → redeem Morpho shares → transfer USDC
     */
    function _redeem(address caller, address receiver, address owner, uint256 shares, uint256 /* assets */ ) internal {
        // Early return for zero shares
        if (shares == 0) {
            emit Withdraw(caller, receiver, owner, 0, 0);
            return;
        }

        // Permission check
        if (caller != owner) {
            _spendAllowance(owner, caller, shares);
        }

        // Calculate Morpho shares to redeem BEFORE burning shares
        uint256 morphoShares = IERC20(address(morphoVault)).balanceOf(address(this));
        uint256 effectiveSupply = _effectiveSupply();

        if (effectiveSupply == 0) {
            revert("RiseFiVault: No effective supply");
        }

        // Calculate the proportion of Morpho shares to redeem based on RiseFi shares
        uint256 morphoSharesToRedeem = (shares * morphoShares) / effectiveSupply;

        // Safety check: don't redeem more than we have
        if (morphoSharesToRedeem > morphoShares) {
            morphoSharesToRedeem = morphoShares;
        }

        // Emit event for Morpho redemption initiation
        emit MorphoRedemptionInitiated(shares, morphoSharesToRedeem);

        // Execute redemption from Morpho
        uint256 balanceBefore = IERC20(asset()).balanceOf(address(this));
        morphoVault.redeem(morphoSharesToRedeem, address(this), address(this));
        uint256 balanceAfter = IERC20(asset()).balanceOf(address(this));

        // Emit event for Morpho redemption completion
        uint256 usdcReceived = balanceAfter - balanceBefore;
        emit MorphoRedemptionCompleted(morphoSharesToRedeem, usdcReceived);

        // Burn RiseFi shares after successful Morpho redemption
        _burn(owner, shares);
        emit RiseFiSharesBurned(owner, shares);

        // Validate redemption
        require(balanceAfter >= balanceBefore, "Unexpected balance decrease");
        uint256 received = balanceAfter - balanceBefore;

        // Calculate expected assets from shares for slippage protection
        uint256 expectedAssets = _convertToAssets(shares, Math.Rounding.Floor);

        // Skip slippage protection if expected assets is very small (dust amounts)
        if (expectedAssets > 0) {
            // Slippage protection: only check minimum (0.1% tolerance)
            uint256 tolerance = (expectedAssets * 100) / 100000;
            if (tolerance < 100) tolerance = 100; // Minimum 100 wei tolerance

            if (received + tolerance < expectedAssets) {
                revert SlippageTooHigh(expectedAssets, received);
            }
        }

        // Transfer USDC to user - transfer what we actually received
        IERC20(asset()).safeTransfer(receiver, received);

        emit Withdraw(caller, receiver, owner, received, shares);
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
     * @notice Minting is disabled - returns 0
     */
    function maxMint(address) public pure override returns (uint256) {
        return 0;
    }

    /**
     * @notice Get the maximum amount of assets that can be withdrawn by the owner
     * @param owner The address owning the shares
     * @return The maximum withdrawal amount
     */
    function maxWithdraw(address owner) public view override returns (uint256) {
        return _convertToAssets(balanceOf(owner), Math.Rounding.Floor);
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

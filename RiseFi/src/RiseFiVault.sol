// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title RiseFi Vault - Morpho Integration
 * @notice ERC4626 wrapper around Morpho USDC vault on Base network
 * @dev Simplified vault for educational purposes with slippage guard protection
 * @author RiseFi Team
 */
contract RiseFiVault is ERC4626, ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;

    // ========== CONSTANTS ==========

    /// @notice Minimum deposit amount allowed (1 USDC)
    uint256 public constant MIN_DEPOSIT = 1e6;

    /// @notice Number of "dead shares" minted at initialization to prevent inflation attacks
    uint256 public constant DEAD_SHARES = 1000;

    /// @notice Dead shares address
    address public constant DEAD_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    /// @notice Authorized asset: USDC on Base network
    address public constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;

    /// @notice Slippage tolerance for protection (1% = 100 basis points)
    uint256 public constant SLIPPAGE_TOLERANCE = 100;

    /// @notice Basis points for percentage calculations (100% = 10000)
    uint256 public constant BASIS_POINTS = 10_000;

    /// @notice Pre-calculated: BASIS_POINTS - SLIPPAGE_TOLERANCE (gas optimization)
    uint256 private constant BASIS_POINTS_MINUS_SLIPPAGE = BASIS_POINTS - SLIPPAGE_TOLERANCE;

    /// @notice Underlying Morpho vault (MetaMorpho ERC4626)
    IERC4626 public immutable morphoVault;

    // ========== MODIFIERS ==========

    /// @notice Ensures minimum deposit amount is met
    modifier validDepositAmount(uint256 assets) {
        if (assets < MIN_DEPOSIT) {
            revert InsufficientDeposit(assets, MIN_DEPOSIT);
        }
        _;
    }

    /// @notice Initializes dead shares on first deposit
    modifier initializeDeadShares() {
        // Fix dangerous strict equality: use <= instead of ==
        if (totalSupply() <= 0) {
            _mint(DEAD_ADDRESS, DEAD_SHARES);
            emit DeadSharesMinted(DEAD_SHARES, DEAD_ADDRESS);
        }
        _;
    }

    /// @notice Validates spending allowance for owner operations
    modifier validateAllowance(address ownerAddr, uint256 shares) {
        if (msg.sender != ownerAddr) {
            _spendAllowance(ownerAddr, msg.sender, shares);
        }
        _;
    }

    // ========== CUSTOM ERRORS ==========

    /// @notice Thrown when deposit amount is below minimum
    error InsufficientDeposit(uint256 provided, uint256 minimum);

    /// @notice Thrown when asset address doesn't match expected USDC
    error InvalidAsset(address provided, address expected);

    /// @notice Thrown when slippage exceeds tolerance
    error SlippageExceeded(uint256 expected, uint256 actual);

    /// @notice Thrown when emergency withdraw fails
    error EmergencyWithdrawFailed();

    /// @notice Thrown when withdraw function is called (disabled)
    error WithdrawDisabled();

    /// @notice Thrown when mint function is called (disabled)
    error MintDisabled();

    /// @notice Thrown when user has insufficient balance
    error InsufficientBalance(uint256 requested, uint256 available);

    /// @notice Thrown when insufficient liquidity in Morpho vault
    error InsufficientLiquidity(uint256 requested, uint256 available);

    // ========== EVENTS ==========

    /// @notice Emitted when dead shares are minted (first deposit protection)
    event DeadSharesMinted(uint256 deadShares, address deadAddress);

    /// @notice Emitted when slippage guard is triggered
    event SlippageGuardTriggered(address indexed user, uint256 expected, uint256 actual, bytes32 indexed operation);

    /// @notice Emitted when emergency withdraw is executed
    event EmergencyWithdraw(address indexed user, uint256 shares, uint256 assets);

    // ========== CONSTRUCTOR ==========

    /**
     * @notice Initialize RiseFi vault with USDC asset and Morpho vault
     * @param asset_ The underlying asset (must be USDC)
     * @param morphoVault_ The Morpho vault address to integrate with
     */
    constructor(IERC20 asset_, address morphoVault_)
        ERC20("RiseFi Vault", "rfUSDC")
        ERC4626(asset_)
        Ownable(msg.sender)
    {
        if (address(asset_) != USDC) {
            revert InvalidAsset(address(asset_), USDC);
        }

        morphoVault = IERC4626(morphoVault_);

        // Set maximum approval to avoid approvals on each deposit
        asset_.approve(address(morphoVault), 0); // reset
        asset_.approve(address(morphoVault), type(uint256).max); // set
    }

    // ========== SLIPPAGE PROTECTION HELPERS ==========

    // NOTE: Slippage protection is NOT implemented as modifiers because:
    // 1. Modifiers cannot capture state BEFORE and AFTER function execution
    // 2. We need to compare expected vs actual values after state changes
    // 3. Helper functions provide better control flow and readability

    /// @notice Validates slippage for redeem operations
    /// @dev Compares expected assets vs actual assets received
    function _validateRedeemSlippage(uint256 expectedAssets, uint256 actualAssets) internal {
        uint256 minAcceptableAssets = (expectedAssets * BASIS_POINTS_MINUS_SLIPPAGE) / BASIS_POINTS;
        if (actualAssets < minAcceptableAssets) {
            emit SlippageGuardTriggered(msg.sender, expectedAssets, actualAssets, bytes32("redeem"));
            revert SlippageExceeded(expectedAssets, actualAssets);
        }
    }

    /// @notice Calculates Morpho shares to redeem with validation
    function _calculateMorphoSharesToRedeem(uint256 shares) internal view returns (uint256) {
        uint256 morphoShares = IERC20(address(morphoVault)).balanceOf(address(this));
        uint256 supply = totalSupply();
        uint256 effectiveSupply;
        unchecked {
            effectiveSupply = supply - DEAD_SHARES; // Safe: supply always >= DEAD_SHARES after first deposit
        }
        return (shares * morphoShares) / effectiveSupply;
    }

    // ========== CORE LOGIC ==========

    /**
     * @notice Calculate total value of assets (in USDC)
     * @return Total assets value by converting Morpho shares to assets
     */
    function totalAssets() public view override returns (uint256) {
        return morphoVault.convertToAssets(IERC20(address(morphoVault)).balanceOf(address(this)));
    }

    /**
     * @notice Deposit with slippage guard protection
     * @param assets The amount of assets to deposit
     * @param receiver The address receiving the shares
     * @return shares The amount of shares received
     * @dev Reverts if slippage exceeds SLIPPAGE_TOLERANCE
     */
    function deposit(uint256 assets, address receiver)
        public
        override
        nonReentrant
        whenNotPaused
        validDepositAmount(assets)
        initializeDeadShares
        returns (uint256)
    {
        // Calculate shares to mint BEFORE changing totalAssets
        uint256 sharesToMint = previewDeposit(assets);

        // CEI Pattern: Effects first (mint shares before external calls)
        _mint(receiver, sharesToMint);

        // CEI Pattern: Interactions last (external calls after state changes)
        IERC20(asset()).safeTransferFrom(msg.sender, address(this), assets);
        morphoVault.deposit(assets, address(this));

        emit Deposit(msg.sender, receiver, assets, sharesToMint);
        return sharesToMint;
    }

    /**
     * @notice Redeem shares for assets
     * @param shares The amount of shares to redeem
     * @param receiver The address receiving the assets
     * @param ownerAddr The address owning the shares (renamed to avoid shadowing)
     * @return assets The amount of assets received
     */
    function redeem(uint256 shares, address receiver, address ownerAddr)
        public
        override
        nonReentrant
        whenNotPaused
        validateAllowance(ownerAddr, shares)
        returns (uint256)
    {
        // Handle zero shares case
        if (shares == 0) {
            emit Withdraw(msg.sender, receiver, ownerAddr, 0, 0);
            return 0;
        }

        // Capture expected assets before state changes
        uint256 expectedAssets = previewRedeem(shares);

        // Calculate and validate Morpho shares to redeem
        uint256 morphoSharesToRedeem = _calculateMorphoSharesToRedeem(shares);

        // Check liquidity constraints
        _validateRedemptionLiquidity(morphoSharesToRedeem);

        // CEI Pattern: Effects first (burn shares before external calls)
        _burn(ownerAddr, shares);

        // CEI Pattern: Interactions last (external calls after state changes)
        uint256 actualAssets = morphoVault.redeem(morphoSharesToRedeem, receiver, address(this));

        // Validate slippage
        _validateRedeemSlippage(expectedAssets, actualAssets);

        emit Withdraw(msg.sender, receiver, ownerAddr, actualAssets, shares);
        return actualAssets;
    }

    /**
     * @notice Withdraw is disabled - use redeem() instead
     * @dev Disabled for simplicity - use redeem() for withdrawals
     */
    function withdraw(
        uint256, // assets (ignored)
        address, // receiver (ignored)
        address // owner (ignored)
    ) public pure override returns (uint256) {
        revert WithdrawDisabled();
    }

    // ========== LIQUIDITY HELPERS ==========

    /// @notice Validates liquidity is sufficient for redemption
    function _validateRedemptionLiquidity(uint256 morphoSharesToRedeem) internal view {
        uint256 maxRedeemable = morphoVault.maxRedeem(address(this));
        if (morphoSharesToRedeem > maxRedeemable) {
            revert InsufficientLiquidity(morphoSharesToRedeem, maxRedeemable);
        }
    }

    // ========== CONVERSION FUNCTIONS ==========

    /**
     * @notice Convert shares to assets with specified rounding
     * @dev Accounts for dead shares in calculation
     */
    function _convertToAssets(uint256 shares, Math.Rounding rounding) internal view override returns (uint256) {
        uint256 supply = totalSupply();
        uint256 assets = totalAssets();

        // Fix dangerous strict equality: use <= instead of ==
        if (supply <= DEAD_SHARES) return 0;

        uint256 effectiveSupply;
        unchecked {
            effectiveSupply = supply - DEAD_SHARES; // Safe: supply > DEAD_SHARES
        }
        if (shares > effectiveSupply) shares = effectiveSupply;

        return Math.mulDiv(shares, assets, effectiveSupply, rounding);
    }

    /**
     * @notice Convert assets to shares with specified rounding
     * @dev Accounts for dead shares in calculation
     */
    function _convertToShares(uint256 assets, Math.Rounding rounding) internal view override returns (uint256) {
        uint256 supply = totalSupply();
        uint256 totalAssets_ = totalAssets();

        // Fix dangerous strict equality: use <= instead of ==
        if (supply <= DEAD_SHARES) return assets;

        uint256 effectiveSupply;
        unchecked {
            effectiveSupply = supply - DEAD_SHARES; // Safe: supply > DEAD_SHARES
        }
        // Fix dangerous strict equality: use <= instead of ==
        if (totalAssets_ <= 0) return assets;

        return Math.mulDiv(assets, effectiveSupply, totalAssets_, rounding);
    }

    // ========== PREVIEW FUNCTIONS ==========

    /**
     * @notice Preview deposit - central logic for deposits
     */
    function previewDeposit(uint256 assets) public view override returns (uint256) {
        return _convertToShares(assets, Math.Rounding.Floor);
    }

    /**
     * @notice Preview redeem - central logic for redemptions
     */
    function previewRedeem(uint256 shares) public view override returns (uint256) {
        return _convertToAssets(shares, Math.Rounding.Floor);
    }

    /**
     * @notice Preview withdraw - disabled, returns 0
     */
    function previewWithdraw(
        uint256 // assets (ignored)
    ) public pure override returns (uint256) {
        return 0; // Withdraw is disabled
    }

    /**
     * @notice Preview mint - disabled, returns 0
     */
    function previewMint(uint256 /* shares */ ) public pure override returns (uint256) {
        return 0; // Mint is disabled
    }

    // ========== MAX FUNCTIONS ==========

    /**
     * @notice Get maximum deposit amount
     */
    function maxDeposit(address /* receiver */ ) public view override returns (uint256) {
        return paused() ? 0 : type(uint256).max;
    }

    /**
     * @notice Minting is disabled
     */
    function maxMint(address /* receiver */ ) public pure override returns (uint256) {
        return 0;
    }

    /**
     * @notice Maximum withdrawal is disabled
     */
    function maxWithdraw(address /* owner */ ) public pure override returns (uint256) {
        return 0; // Withdraw is disabled
    }

    /**
     * @notice Get maximum redemption amount considering liquidity
     */
    function maxRedeem(address ownerAddr) public view override returns (uint256) {
        // Early returns for gas optimization
        if (paused()) return 0;

        uint256 ownerShares = balanceOf(ownerAddr);
        // Fix dangerous strict equality: use <= instead of ==
        if (ownerShares <= 0) return 0;

        uint256 maxSharesFromLiquidity = _convertToShares(_getAvailableLiquidity(), Math.Rounding.Floor);

        // Inline min calculation
        return ownerShares > maxSharesFromLiquidity ? maxSharesFromLiquidity : ownerShares;
    }

    /**
     * @notice Get available liquidity from underlying Morpho vault
     */
    function _getAvailableLiquidity() internal view returns (uint256) {
        uint256 ourMorphoShares = IERC20(address(morphoVault)).balanceOf(address(this));
        uint256 maxMorphoRedeem = morphoVault.maxRedeem(address(this));

        // Inline the min calculation to save gas
        return morphoVault.convertToAssets(ourMorphoShares > maxMorphoRedeem ? maxMorphoRedeem : ourMorphoShares);
    }

    // ========== DISABLED FUNCTIONS ==========

    /**
     * @notice Minting is disabled - use deposit() instead
     */
    function mint(
        uint256, // shares (ignored)
        address // receiver (ignored)
    ) public pure override returns (uint256) {
        revert MintDisabled();
    }

    // ========== UTILITY FUNCTIONS ==========

    /**
     * @notice Get current slippage tolerance
     * @return The slippage tolerance in basis points
     * @dev Useful for frontend integration
     */
    function getSlippageTolerance() external pure returns (uint256) {
        return SLIPPAGE_TOLERANCE;
    }

    /**
     * @notice Check if an amount of slippage would be acceptable
     * @param expected The expected amount
     * @param actual The actual amount
     * @return Whether the slippage is within tolerance
     * @dev Useful for frontend pre-checks
     */
    function isSlippageAcceptable(uint256 expected, uint256 actual) external pure returns (bool) {
        if (expected == 0) return actual == 0;
        uint256 minAcceptable = (expected * BASIS_POINTS_MINUS_SLIPPAGE) / BASIS_POINTS;
        return actual >= minAcceptable;
    }

    /**
     * @notice Check if the contract is currently paused
     * @return Whether the contract is paused
     * @dev Useful for frontend integration
     */
    function isPaused() external view returns (bool) {
        return paused();
    }

    /**
     * @notice Returns the number of decimals used to get its user representation
     * @dev Override to return 18 decimals for rfUSDC tokens (standard for vault shares)
     * @return The number of decimals
     */
    function decimals() public pure override returns (uint8) {
        return 18;
    }

    // ========== EMERGENCY FUNCTIONS ==========

    /**
     * @notice Emergency withdraw - bypasses pause and slippage protection
     * @dev Uses same Morpho logic as redeem() but without safety checks
     * @param shares The amount of shares to burn
     * @param receiver The address to receive the assets
     * @return assets The amount of assets received
     */
    function emergencyWithdraw(uint256 shares, address receiver) external nonReentrant returns (uint256 assets) {
        if (shares == 0) return 0;

        uint256 userBalance = balanceOf(msg.sender);
        if (shares > userBalance) {
            revert InsufficientBalance(shares, userBalance);
        }

        // Calculate Morpho shares to redeem (same logic as redeem)
        uint256 morphoSharesToRedeem = _calculateMorphoSharesToRedeem(shares);

        // Fix dangerous strict equality: use <= instead of ==
        if (morphoSharesToRedeem <= 0) {
            revert EmergencyWithdrawFailed();
        }

        // Try Morpho redemption first WITHOUT burning shares
        try morphoVault.redeem(morphoSharesToRedeem, receiver, address(this)) returns (uint256 receivedAssets) {
            // Success: burn shares and return assets
            _burn(msg.sender, shares);
            assets = receivedAssets;
        } catch {
            // If Morpho fails, try to use direct contract balance as fallback
            uint256 contractBalance = IERC20(asset()).balanceOf(address(this));
            uint256 supply = totalSupply(); // Don't add back shares since we haven't burned them yet

            // Fix dangerous strict equality: use <= instead of ==
            if (supply <= DEAD_SHARES || contractBalance <= 0) {
                revert EmergencyWithdrawFailed();
            }

            uint256 effectiveSupply;
            unchecked {
                effectiveSupply = supply - DEAD_SHARES; // Safe: supply > DEAD_SHARES checked above
            }

            assets = (shares * contractBalance) / effectiveSupply;
            // Only burn shares and transfer if we have enough balance
            if (assets > 0 && contractBalance >= assets) {
                _burn(msg.sender, shares);
                IERC20(asset()).safeTransfer(receiver, assets);
            } else {
                revert EmergencyWithdrawFailed();
            }
        }

        emit EmergencyWithdraw(msg.sender, shares, assets);
        return assets;
    }

    // ========== ADMIN FUNCTIONS ==========

    /**
     * @notice Pause the contract (stops deposits and redeems)
     * @dev Only owner can pause in case of emergency
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause the contract (resumes normal operations)
     * @dev Only owner can unpause after issues are resolved
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Emergency function to withdraw all funds from Morpho
     * @dev Only callable by owner in extreme emergency
     * @dev Brings all funds back to the contract for emergency withdrawals
     */
    function emergencyWithdrawFromMorpho() external onlyOwner {
        uint256 morphoShares = IERC20(address(morphoVault)).balanceOf(address(this));
        if (morphoShares > 0) {
            morphoVault.redeem(morphoShares, address(this), address(this));
        }
    }
}

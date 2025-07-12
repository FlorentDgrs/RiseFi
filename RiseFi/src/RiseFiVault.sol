// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/interfaces/IERC4626.sol";

/// @title RiseFi Vault intégré à Morpho (MetaMorpho)
/// @notice ERC4626 wrapper autour du vault Morpho USDC sur Base
contract RiseFiVault is ERC4626 {
    using SafeERC20 for IERC20;

    // ========== CONSTANTS ==========
    /// @notice Montant minimum de dépôt (1 USDC)
    uint256 public constant MIN_DEPOSIT = 1 * 10 ** 6; // 1 USDC (6 decimals)

    // ========== CUSTOM ERRORS ==========
    /// @notice Lancée quand le dépôt est inférieur au minimum
    /// @param amount Montant tenté
    /// @param minimum Montant minimum requis
    error InsufficientDeposit(uint256 amount, uint256 minimum);

    /// @notice Lancée quand l'asset n'est pas USDC
    /// @param provided L'adresse fournie
    /// @param expected L'adresse USDC attendue
    error InvalidAsset(address provided, address expected);

    /// @notice Adresse du vault Morpho cible (proxy ERC4626)
    IERC4626 public immutable morphoVault;

    /// @notice Adresse de l'USDC sur Base (6 décimales)
    address public constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;

    constructor(IERC20 asset_, address morphoVault_) ERC20("RiseFi Vault", "rfVault") ERC4626(asset_) {
        if (address(asset_) != USDC) {
            revert InvalidAsset(address(asset_), USDC);
        }

        morphoVault = IERC4626(morphoVault_);

        // Approve maximum pour éviter les approvals à chaque dépôt
        asset_.approve(address(morphoVault), type(uint256).max);
    }

    /// @notice Total des actifs en gestion, basé sur les parts du vault Morpho
    function totalAssets() public view override returns (uint256) {
        uint256 morphoShares = IERC20(address(morphoVault)).balanceOf(address(this));
        return morphoVault.convertToAssets(morphoShares);
    }

    /// @notice Dépôt : transfert d'USDC, dépôt dans Morpho, mint de shares
    function _deposit(address caller, address receiver, uint256 assets, uint256 shares) internal override {
        if (assets < MIN_DEPOSIT) {
            revert InsufficientDeposit(assets, MIN_DEPOSIT);
        }

        IERC20(asset()).safeTransferFrom(caller, address(this), assets);
        morphoVault.deposit(assets, address(this));
        _mint(receiver, shares);
        emit Deposit(caller, receiver, assets, shares);
    }
}

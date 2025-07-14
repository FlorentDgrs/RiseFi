// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title MockMorphoVault
 * @notice Mock implementation of Morpho vault for local testing
 * @dev Implements ERC4626 with simple yield generation simulation
 */
contract MockMorphoVault is ERC4626 {
    using SafeERC20 for IERC20;

    // ========== CONSTANTS ==========
    uint256 public constant YIELD_RATE = 500; // 5% APY (500 basis points)
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant SECONDS_PER_YEAR = 365 days;

    // ========== STATE VARIABLES ==========
    uint256 private _lastYieldUpdate;
    uint256 private _accumulatedYield;

    // ========== EVENTS ==========
    event YieldAccrued(uint256 amount, uint256 timestamp);

    // ========== CONSTRUCTOR ==========
    constructor(
        IERC20 asset_
    ) ERC4626(asset_) ERC20("Mock Morpho Vault", "mMorpho") {
        _lastYieldUpdate = block.timestamp;
    }

    // ========== YIELD SIMULATION ==========

    /**
     * @notice Simule l'accumulation de yield
     * @dev Ajoute un yield simple basé sur le temps écoulé
     */
    function _accrueYield() internal {
        uint256 currentTime = block.timestamp;
        uint256 timeElapsed = currentTime - _lastYieldUpdate;

        if (timeElapsed > 0 && totalAssets() > 0) {
            // Calcul du yield: totalAssets * rate * timeElapsed / (basisPoints * secondsPerYear)
            uint256 yieldAmount = (totalAssets() * YIELD_RATE * timeElapsed) /
                (BASIS_POINTS * SECONDS_PER_YEAR);

            if (yieldAmount > 0) {
                _accumulatedYield += yieldAmount;
                _lastYieldUpdate = currentTime;

                emit YieldAccrued(yieldAmount, currentTime);
            }
        }
    }

    /**
     * @notice Retourne le total des assets incluant le yield accumulé
     * @return Total des assets avec yield
     */
    function totalAssets() public view override returns (uint256) {
        uint256 baseAssets = IERC20(asset()).balanceOf(address(this));

        // Calcul du yield potentiel depuis la dernière mise à jour
        uint256 currentTime = block.timestamp;
        uint256 timeElapsed = currentTime - _lastYieldUpdate;
        uint256 potentialYield = 0;

        if (timeElapsed > 0 && baseAssets > 0) {
            potentialYield =
                (baseAssets * YIELD_RATE * timeElapsed) /
                (BASIS_POINTS * SECONDS_PER_YEAR);
        }

        return baseAssets + _accumulatedYield + potentialYield;
    }

    // ========== ERC4626 OVERRIDES ==========

    /**
     * @notice Dépose des assets et mint des shares
     * @param assets Montant d'assets à déposer
     * @param receiver Adresse qui recevra les shares
     * @return shares Nombre de shares mintées
     */
    function deposit(
        uint256 assets,
        address receiver
    ) public override returns (uint256 shares) {
        _accrueYield();
        return super.deposit(assets, receiver);
    }

    /**
     * @notice Mint des shares en échange d'assets
     * @param shares Nombre de shares à minter
     * @param receiver Adresse qui recevra les shares
     * @return assets Montant d'assets déposés
     */
    function mint(
        uint256 shares,
        address receiver
    ) public override returns (uint256 assets) {
        _accrueYield();
        return super.mint(shares, receiver);
    }

    /**
     * @notice Retire des assets en brûlant des shares
     * @param assets Montant d'assets à retirer
     * @param receiver Adresse qui recevra les assets
     * @param owner Propriétaire des shares
     * @return shares Nombre de shares brûlées
     */
    function withdraw(
        uint256 assets,
        address receiver,
        address owner
    ) public override returns (uint256 shares) {
        _accrueYield();
        return super.withdraw(assets, receiver, owner);
    }

    /**
     * @notice Rachète des shares contre des assets
     * @param shares Nombre de shares à racheter
     * @param receiver Adresse qui recevra les assets
     * @param owner Propriétaire des shares
     * @return assets Montant d'assets reçus
     */
    function redeem(
        uint256 shares,
        address receiver,
        address owner
    ) public override returns (uint256 assets) {
        _accrueYield();
        return super.redeem(shares, receiver, owner);
    }

    // ========== VIEW FUNCTIONS ==========

    /**
     * @notice Retourne le yield accumulé
     * @return Montant du yield accumulé
     */
    function getAccumulatedYield() external view returns (uint256) {
        return _accumulatedYield;
    }

    /**
     * @notice Retourne le taux de yield annuel
     * @return Taux en basis points
     */
    function getYieldRate() external pure returns (uint256) {
        return YIELD_RATE;
    }

    /**
     * @notice Retourne le timestamp de la dernière mise à jour du yield
     * @return Timestamp de la dernière mise à jour
     */
    function getLastYieldUpdate() external view returns (uint256) {
        return _lastYieldUpdate;
    }

    // ========== ADMIN FUNCTIONS ==========

    /**
     * @notice Force la mise à jour du yield (pour les tests)
     * @dev Fonction utile pour les tests et simulations
     */
    function forceYieldUpdate() external {
        _accrueYield();
    }
}

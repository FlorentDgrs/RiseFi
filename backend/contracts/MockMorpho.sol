// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./MockMorphoToken.sol";

/**
 * @title MockMorpho
 * @dev Mock contract to simulate Morpho protocol interactions
 * This will be replaced with real Morpho SDK integration later
 */
contract MockMorpho is Ownable {
    // Market data structure
    struct Market {
        uint256 totalSupply;
        uint256 totalBorrow;
        uint256 supplyRate;
        uint256 borrowRate;
        bool isActive;
    }

    // User position structure
    struct Position {
        uint256 supplied;
        uint256 borrowed;
        uint256 collateralValue;
    }

    // Mapping from asset address to market data
    mapping(address => Market) public markets;

    // Mapping from user to asset to position
    mapping(address => mapping(address => Position)) public positions;

    // Mapping from asset to morpho token
    mapping(address => address) public morphoTokens;

    // Events
    event MarketCreated(
        address indexed asset,
        uint256 supplyRate,
        uint256 borrowRate
    );
    event Supply(address indexed user, address indexed asset, uint256 amount);
    event Borrow(address indexed user, address indexed asset, uint256 amount);
    event Repay(address indexed user, address indexed asset, uint256 amount);
    event Withdraw(address indexed user, address indexed asset, uint256 amount);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Create a new market (only owner)
     */
    function createMarket(
        address asset,
        uint256 supplyRate,
        uint256 borrowRate
    ) external onlyOwner {
        require(!markets[asset].isActive, "Market already exists");

        markets[asset] = Market({
            totalSupply: 0,
            totalBorrow: 0,
            supplyRate: supplyRate,
            borrowRate: borrowRate,
            isActive: true
        });

        emit MarketCreated(asset, supplyRate, borrowRate);
    }

    /**
     * @dev Set morpho token for an asset (only owner)
     */
    function setMorphoToken(
        address asset,
        address morphoToken
    ) external onlyOwner {
        morphoTokens[asset] = morphoToken;
    }

    /**
     * @dev Supply assets to Morpho
     */
    function supply(address asset, uint256 amount) external {
        require(markets[asset].isActive, "Market not active");
        require(amount > 0, "Amount must be greater than 0");

        // Transfer tokens from user to this contract
        IERC20(asset).transferFrom(msg.sender, address(this), amount);

        // Update market totals
        markets[asset].totalSupply += amount;

        // Update user position
        positions[msg.sender][asset].supplied += amount;

        // Mint morpho tokens to user
        address morphoToken = morphoTokens[asset];
        if (morphoToken != address(0)) {
            MockMorphoToken(morphoToken).mint(msg.sender, amount);
        }

        emit Supply(msg.sender, asset, amount);
    }

    /**
     * @dev Borrow assets from Morpho
     */
    function borrow(address asset, uint256 amount) external {
        require(markets[asset].isActive, "Market not active");
        require(amount > 0, "Amount must be greater than 0");
        require(markets[asset].totalSupply >= amount, "Insufficient liquidity");

        // Update market totals
        markets[asset].totalBorrow += amount;

        // Update user position
        positions[msg.sender][asset].borrowed += amount;

        // Transfer tokens to user
        IERC20(asset).transfer(msg.sender, amount);

        emit Borrow(msg.sender, asset, amount);
    }

    /**
     * @dev Repay borrowed assets
     */
    function repay(address asset, uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");

        uint256 borrowed = positions[msg.sender][asset].borrowed;
        require(borrowed >= amount, "Repay amount exceeds borrowed");

        // Transfer tokens from user to this contract
        IERC20(asset).transferFrom(msg.sender, address(this), amount);

        // Update market totals
        markets[asset].totalBorrow -= amount;

        // Update user position
        positions[msg.sender][asset].borrowed -= amount;

        emit Repay(msg.sender, asset, amount);
    }

    /**
     * @dev Withdraw supplied assets
     */
    function withdraw(address asset, uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");

        uint256 supplied = positions[msg.sender][asset].supplied;
        require(supplied >= amount, "Withdraw amount exceeds supplied");

        // Update market totals
        markets[asset].totalSupply -= amount;

        // Update user position
        positions[msg.sender][asset].supplied -= amount;

        // Burn morpho tokens from user
        address morphoToken = morphoTokens[asset];
        if (morphoToken != address(0)) {
            MockMorphoToken(morphoToken).burn(msg.sender, amount);
        }

        // Transfer tokens to user
        IERC20(asset).transfer(msg.sender, amount);

        emit Withdraw(msg.sender, asset, amount);
    }

    /**
     * @dev Get supply rate for an asset
     */
    function getSupplyRate(address asset) external view returns (uint256) {
        return markets[asset].supplyRate;
    }

    /**
     * @dev Get borrow rate for an asset
     */
    function getBorrowRate(address asset) external view returns (uint256) {
        return markets[asset].borrowRate;
    }

    /**
     * @dev Get user position for an asset
     */
    function getPosition(
        address user,
        address asset
    ) external view returns (uint256 supplied, uint256 borrowed) {
        Position memory position = positions[user][asset];
        return (position.supplied, position.borrowed);
    }

    /**
     * @dev Get market data for an asset
     */
    function getMarket(address asset) external view returns (Market memory) {
        return markets[asset];
    }

    /**
     * @dev Check if market is active
     */
    function isMarketActive(address asset) external view returns (bool) {
        return markets[asset].isActive;
    }
}

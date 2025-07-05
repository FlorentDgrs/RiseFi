// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockMorphoToken
 * @dev Mock token representing a position on Morpho (e.g., morphoUSDC)
 * This simulates the tokens that Morpho returns when you supply assets
 */
contract MockMorphoToken is ERC20, Ownable {
    address public underlyingAsset;
    address public morphoContract;

    constructor(
        string memory name,
        string memory symbol,
        address _underlyingAsset
    ) ERC20(name, symbol) Ownable(msg.sender) {
        underlyingAsset = _underlyingAsset;
    }

    /**
     * @dev Set the Morpho contract address (only owner)
     */
    function setMorphoContract(address _morphoContract) external onlyOwner {
        morphoContract = _morphoContract;
    }

    /**
     * @dev Mint tokens when someone supplies to Morpho (only Morpho contract)
     */
    function mint(address to, uint256 amount) external {
        require(msg.sender == morphoContract, "Only Morpho can mint");
        _mint(to, amount);
    }

    /**
     * @dev Burn tokens when someone withdraws from Morpho (only Morpho contract)
     */
    function burn(address from, uint256 amount) external {
        require(msg.sender == morphoContract, "Only Morpho can burn");
        _burn(from, amount);
    }

    /**
     * @dev Get the exchange rate between morpho tokens and underlying asset
     * For simplicity, we assume 1:1 ratio, but in reality this would change with interest
     */
    function exchangeRateStored() external pure returns (uint256) {
        return 1e18; // 1:1 ratio
    }
}

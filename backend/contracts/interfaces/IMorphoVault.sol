// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IMorphoVault {
    function deposit(uint256 assets) external returns (uint256 shares);
    function withdraw(uint256 assets, address receiver, address owner) external returns (uint256 shares);
}

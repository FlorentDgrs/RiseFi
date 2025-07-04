// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title RiseFiUSDCVault
/// @notice ERC4626 vault for USDC with future support for Morpho, AccessControl, and fees
contract RiseFiUSDCVault is ERC4626 {
    constructor(
        IERC20 usdc
    ) ERC4626(usdc) ERC20("RiseFi USDC Vault Share", "RFUSDV") {}

    // Future: Morpho integration, AccessControl, and fee logic will be added here
}

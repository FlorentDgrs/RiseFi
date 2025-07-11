// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract RiseFiVault is ERC4626 {
    constructor(IERC20 _asset) ERC20("RiseFi USDC", "rfUSDC") ERC4626(_asset) {}
}

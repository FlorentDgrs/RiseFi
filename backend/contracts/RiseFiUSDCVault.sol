// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IMorphoVault} from "./interfaces/IMorphoVault.sol";

/// @title RiseFiUSDCVault
/// @notice ERC4626 vault for USDC with future support for Morpho, AccessControl, and fees
contract RiseFiUSDCVault is ERC4626 {
    using SafeERC20 for IERC20;

    IMorphoVault public morphoVault;

    constructor(IERC20 usdc, IMorphoVault _morphoVault)
        ERC4626(usdc)
        ERC20("RiseFi USDC Vault Share", "RFUSDV")
    {
        morphoVault = _morphoVault;
    }

    function afterDeposit(uint256 assets, uint256) internal override {
        IERC20(asset()).safeApprove(address(morphoVault), assets);
        morphoVault.deposit(assets);
    }

    function beforeWithdraw(uint256 assets, uint256) internal override {
        morphoVault.withdraw(assets, address(this), address(this));
    }
}

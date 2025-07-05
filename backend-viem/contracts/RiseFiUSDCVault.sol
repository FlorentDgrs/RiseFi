// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

/// @title RiseFiUSDCVault
/// @notice ERC4626 vault for USDC with Morpho integration
contract RiseFiUSDCVault is ERC4626, Ownable {
    address public morpho;
    address public morphoToken; // Token representing position on Morpho (e.g., morphoUSDC)

    // Events
    event MorphoSet(address indexed morpho, address indexed morphoToken);

    constructor(
        IERC20 usdc
    )
        ERC4626(usdc)
        ERC20("RiseFi USDC Vault Share", "RFUSDV")
        Ownable(msg.sender)
    {}

    /// @notice Set the Morpho contract and token addresses (owner only)
    function setMorpho(
        address _morpho,
        address _morphoToken
    ) external onlyOwner {
        morpho = _morpho;
        morphoToken = _morphoToken;
        emit MorphoSet(_morpho, _morphoToken);
    }

    /// @notice Deposit all vault USDC to Morpho and get morpho tokens
    function depositToMorpho() external onlyOwner {
        require(morpho != address(0), "Morpho not set");
        uint256 balance = IERC20(asset()).balanceOf(address(this));
        require(balance > 0, "No USDC to deposit");

        // Approve and supply to Morpho
        IERC20(asset()).approve(morpho, balance);
        (bool success, ) = morpho.call(
            abi.encodeWithSignature("supply(address,uint256)", asset(), balance)
        );
        require(success, "Morpho supply failed");
    }

    /// @notice Withdraw USDC from Morpho using morpho tokens
    function withdrawFromMorpho(uint256 morphoTokenAmount) external onlyOwner {
        require(
            morpho != address(0) && morphoToken != address(0),
            "Morpho not set"
        );
        require(morphoTokenAmount > 0, "Amount must be greater than 0");

        // Approve morpho tokens and withdraw from Morpho
        IERC20(morphoToken).approve(morpho, morphoTokenAmount);
        (bool success, ) = morpho.call(
            abi.encodeWithSignature(
                "withdraw(address,uint256)",
                asset(),
                morphoTokenAmount
            )
        );
        require(success, "Morpho withdraw failed");
    }

    /// @notice Override totalAssets to include Morpho position
    function totalAssets() public view virtual override returns (uint256) {
        uint256 vaultBalance = IERC20(asset()).balanceOf(address(this));

        // Add Morpho position if available
        if (morphoToken != address(0)) {
            uint256 morphoBalance = IERC20(morphoToken).balanceOf(
                address(this)
            );
            if (morphoBalance > 0) {
                // For now, assume 1:1 ratio (simplified)
                // In real implementation, would need to calculate actual USDC value
                vaultBalance += morphoBalance;
            }
        }

        return vaultBalance;
    }

    /// @notice Override _deposit to auto-deposit to Morpho
    function _deposit(
        address caller,
        address receiver,
        uint256 assets,
        uint256 shares
    ) internal virtual override {
        super._deposit(caller, receiver, assets, shares);

        // Auto-deposit to Morpho if available
        if (morpho != address(0) && assets > 0) {
            _tryDepositToMorpho();
        }
    }

    /// @notice Override _withdraw to handle Morpho withdrawal
    function _withdraw(
        address caller,
        address receiver,
        address owner,
        uint256 assets,
        uint256 shares
    ) internal virtual override {
        // Check if we need to withdraw from Morpho
        uint256 vaultBalance = IERC20(asset()).balanceOf(address(this));
        if (assets > vaultBalance && morphoToken != address(0)) {
            uint256 neededFromMorpho = assets - vaultBalance;
            _tryWithdrawFromMorpho(neededFromMorpho);
        }

        super._withdraw(caller, receiver, owner, assets, shares);
    }

    /// @notice Try to deposit available USDC to Morpho
    function _tryDepositToMorpho() internal {
        uint256 balance = IERC20(asset()).balanceOf(address(this));
        if (balance > 0) {
            // Keep some USDC for small withdrawals
            uint256 depositAmount = (balance * 90) / 100; // Deposit 90%, keep 10%
            if (depositAmount > 0) {
                IERC20(asset()).approve(morpho, depositAmount);
                (bool success, ) = morpho.call(
                    abi.encodeWithSignature(
                        "supply(address,uint256)",
                        asset(),
                        depositAmount
                    )
                );
                if (!success) {
                    // If deposit fails, revert approval
                    IERC20(asset()).approve(morpho, 0);
                }
            }
        }
    }

    /// @notice Try to withdraw from Morpho if needed
    function _tryWithdrawFromMorpho(uint256 neededAmount) internal {
        uint256 morphoBalance = IERC20(morphoToken).balanceOf(address(this));
        if (morphoBalance > 0) {
            uint256 withdrawAmount = Math.min(neededAmount, morphoBalance);
            IERC20(morphoToken).approve(morpho, withdrawAmount);
            (bool success, ) = morpho.call(
                abi.encodeWithSignature(
                    "withdraw(address,uint256)",
                    asset(),
                    withdrawAmount
                )
            );
            if (!success) {
                // If withdraw fails, revert approval
                IERC20(morphoToken).approve(morpho, 0);
            }
        }
    }

    /// @notice Get vault performance info
    function getVaultInfo()
        external
        view
        returns (
            uint256 totalAssetsValue,
            uint256 totalShares,
            uint256 vaultBalance,
            uint256 morphoBalance
        )
    {
        totalAssetsValue = totalAssets();
        totalShares = totalSupply();
        vaultBalance = IERC20(asset()).balanceOf(address(this));
        morphoBalance = morphoToken != address(0)
            ? IERC20(morphoToken).balanceOf(address(this))
            : 0;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "forge-std/Script.sol";
import "forge-std/console2.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

/**
 * @title Fund Test Wallets Script
 * @notice Script to fund test wallets with USDC for development and testing
 * @dev Uses a whale account to distribute USDC to predefined test addresses
 * @author RiseFi Team
 */
contract FundTestWallets is Script {
    /// @notice USDC token address on Base network
    address constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;

    /// @notice Whale address with substantial USDC balance for funding
    address constant WHALE = 0x122fDD9fEcbc82F7d4237C0549a5057E31c8EF8D;

    /// @notice Array of test wallet addresses to fund
    address[3] wallets = [
        0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266,
        0x70997970C51812dc3A010C7d01b50e0d17dc79C8,
        0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
    ];

    /**
     * @notice Execute the funding script
     * @dev Transfers 10,000 USDC to each test wallet from the whale account
     */
    function run() external {
        uint256 amount = 10_000 * 1e6; // 10,000 USDC (6 decimals)

        vm.startBroadcast(WHALE); // Start broadcasting as whale

        for (uint256 i; i < wallets.length; ++i) {
            IERC20(USDC).transfer(wallets[i], amount);
            console2.log("Funded wallet:", wallets[i]);
        }

        vm.stopBroadcast();
    }
}

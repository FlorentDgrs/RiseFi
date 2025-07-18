// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "forge-std/Script.sol";
import "forge-std/console2.sol";
import { IERC20 } from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

contract FundTestWallets is Script {

    address constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    address constant WHALE = 0x122fDD9fEcbc82F7d4237C0549a5057E31c8EF8D;

    address[3] wallets = [
        0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266,
        0x70997970C51812dc3A010C7d01b50e0d17dc79C8,
        0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
    ];

    function run() external {
        uint256 amount = 10_000 * 1e6; // 10 000 USDC

        vm.startBroadcast(WHALE); // Diffusion effective

        for (uint256 i; i < wallets.length; ++i) {
            IERC20(USDC).transfer(wallets[i], amount);
            console2.log("Funded", wallets[i]);
        }

        vm.stopBroadcast();
    }

}

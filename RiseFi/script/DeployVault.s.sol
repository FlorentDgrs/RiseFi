// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "forge-std/Script.sol";
import "src/RiseFiVault.sol";

contract DeployVault is Script {
    function run() external {
        // Adresses à utiliser (USDC et Morpho Vault sur Base)
        address usdc = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
        address morphoVault = 0x3128a0F7f0ea68E7B7c9B00AFa7E41045828e858;

        vm.startBroadcast();
        RiseFiVault vault = new RiseFiVault(IERC20(usdc), morphoVault);
        vm.stopBroadcast();

        console2.log("RiseFiVault deploye a:", address(vault));
    }
}

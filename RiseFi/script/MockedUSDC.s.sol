// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Script} from "forge-std/Script.sol";
import {MockedUSDC} from "../src/MockedUSDC.sol";

contract MockedUSDCScript is Script {
    function run() public {
        vm.startBroadcast();
        new MockedUSDC();
        vm.stopBroadcast();
    }
}

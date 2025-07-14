// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Script} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title FundTestWallets
 * @notice Script pour financer les wallets de test avec USDC depuis une whale
 */
contract FundTestWallets is Script {
    // Adresses sur Base mainnet
    address constant USDC_ADDRESS = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    address constant USDC_WHALE = 0x0B0A5886664376F59C351ba3f598C8A8B4D0A6f3;

    // Montant à transférer par wallet (1000 USDC avec 6 décimales)
    uint256 constant FUNDING_AMOUNT = 1000 * 10 ** 6;

    // Wallets Anvil à financer
    address[5] testWallets = [
        0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266, // Account 0
        0x70997970C51812dc3A010C7d01b50e0d17dc79C8, // Account 1
        0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC, // Account 2
        0x90F79bf6EB2c4f870365E785982E1f101E93b906, // Account 3
        0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65 // Account 4
    ];

    function run() external {
        // Initialiser le contrat USDC
        IERC20 usdc = IERC20(USDC_ADDRESS);

        // Donner de l'ETH à la whale pour les frais de gas
        vm.deal(USDC_WHALE, 50 ether);

        // Démarrer le broadcast avec l'adresse de la whale
        vm.startBroadcast(USDC_WHALE);

        // Financer chaque wallet
        for (uint256 i = 0; i < testWallets.length; i++) {
            bool success = usdc.transfer(testWallets[i], FUNDING_AMOUNT);
            require(success, "Transfer failed");
        }

        vm.stopBroadcast();
    }
}

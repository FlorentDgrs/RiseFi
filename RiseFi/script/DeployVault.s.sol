// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {RiseFiVault} from "../src/RiseFiVault.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";

/**
 * @title Deploy Vault Script
 * @notice Script pour déployer le RiseFiVault sur le fork Base
 * @dev Déploie le vault avec les adresses USDC et Morpho vault de Base mainnet
 */
contract DeployVault is Script {
    // ========== ADRESSES BASE MAINNET ==========
    IERC20Metadata public constant USDC = IERC20Metadata(0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913);
    address public constant MORPHO_VAULT_ADDRESS = 0x3128a0F7f0ea68E7B7c9B00AFa7E41045828e858;

    function run() external returns (RiseFiVault vault) {
        console.log("=== DEPLOIEMENT DU RISEFI VAULT ===");
        console.log("USDC Address:", address(USDC));
        console.log("Morpho Vault Address:", MORPHO_VAULT_ADDRESS);
        console.log("");

        // Vérifier les propriétés de l'USDC
        console.log("USDC Name:", USDC.name());
        console.log("USDC Symbol:", USDC.symbol());
        console.log("USDC Decimals:", USDC.decimals());
        console.log("");

        // Vérifier le vault Morpho
        IERC4626 morphoVault = IERC4626(MORPHO_VAULT_ADDRESS);
        console.log("Morpho Vault Asset:", morphoVault.asset());
        console.log("Morpho Vault Total Assets:", morphoVault.totalAssets());
        console.log("");

        // Déployer le RiseFiVault
        console.log("Deploying RiseFiVault...");

        vm.startBroadcast();
        vault = new RiseFiVault(IERC20(address(USDC)), MORPHO_VAULT_ADDRESS);
        vm.stopBroadcast();

        console.log("RiseFiVault deployed at:", address(vault));
        console.log("");

        // Vérifier les propriétés du vault déployé
        console.log("=== VERIFICATION DU VAULT DEPLOYE ===");
        console.log("Vault Name:", vault.name());
        console.log("Vault Symbol:", vault.symbol());
        console.log("Vault Asset:", vault.asset());
        console.log("Vault Total Assets:", vault.totalAssets());
        console.log("Vault Total Supply:", vault.totalSupply());
        console.log("");

        // Vérifier l'intégration Morpho
        console.log("Morpho Vault Address:", address(vault.morphoVault()));
        console.log("USDC Address:", vault.USDC());
        console.log("Min Deposit:", vault.MIN_DEPOSIT());
        console.log("Dead Shares:", vault.DEAD_SHARES());
        console.log("");

        console.log("Deployment completed successfully!");
        console.log("");
        console.log("=== INFORMATIONS POUR LE FRONTEND ===");
        console.log("RiseFiVault Address:", address(vault));
        console.log("USDC Address:", address(USDC));
        console.log("Morpho Vault Address:", MORPHO_VAULT_ADDRESS);
        console.log("Chain ID: 8453 (Base Fork)");
        console.log("RPC URL: http://localhost:8545");
        console.log("");

        return vault;
    }
}

// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const INITIAL_USDC_SUPPLY = 1_000_000_000n; // 1 billion USDC (6 decimals)

const RiseFiVaultModule = buildModule("RiseFiVaultModule", (m) => {
  // Deploy MockUSDC first
  const mockUSDC = m.contract("MockUSDC");

  // Deploy RiseFiUSDCVault with MockUSDC as underlying asset
  const vault = m.contract("RiseFiUSDCVault", [mockUSDC]);

  // Mint initial USDC supply to the deployer
  const deployer = m.getParameter(
    "deployer",
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
  );
  const initialSupply = m.getParameter("initialSupply", INITIAL_USDC_SUPPLY);

  // Call mint function on MockUSDC
  m.call(mockUSDC, "mint", [deployer, initialSupply]);

  return { mockUSDC, vault };
});

export default RiseFiVaultModule;

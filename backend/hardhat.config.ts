import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import { config as dotenvConfig } from "dotenv";

dotenvConfig();

const config: HardhatUserConfig = {
  solidity: "0.8.28",

  networks: {
    hardhat: {
      // Pas de fork pour l'instant - développement local
      accounts: {
        mnemonic:
          process.env.MNEMONIC ||
          "test test test test test test test test test test test junk",
        count: 10,
      },
    },
  },
};

export default config;

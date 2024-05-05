import "@openzeppelin/hardhat-upgrades";
import "@typechain/hardhat";
import "hardhat-deploy";
import "hardhat-gas-reporter";
import "solidity-coverage";

import dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";

dotenv.config({ path: "./.env" });

// Ensure that we have all the environment variables we need.
let mnemonic: string;
if (!process.env.mnemonic) {
  throw new Error("Please set your mnemonic in a .env file");
} else {
  mnemonic = process.env.mnemonic;
}

const config: HardhatUserConfig = {
  networks: {
    hardhat: {
      accounts: {
        mnemonic,
        count: 40,
      },
      chainId: 31337,
    },
  },
  defaultNetwork: "hardhat",
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
  },
  solidity: {
    version: "0.8.7",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
    alwaysGenerateOverloads: false,
  },
};

export default config;

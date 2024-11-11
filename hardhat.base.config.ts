import "@typechain/hardhat";
import "hardhat-deploy";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "@nomicfoundation/hardhat-chai-matchers";

import dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";

dotenv.config({ path: "./.env" });

// Ensure that we have all the environment variables we need.
if (!process.env.mnemonic) {
	throw new Error("Please set your mnemonic in a .env file");
}

const config: HardhatUserConfig = {
	networks: {
		hardhat: {
			accounts: {
				mnemonic: process.env.mnemonic,
				count: 40,
			},
			chainId: 31337,
		},
	},
	paths: {
		artifacts: "./artifacts",
		cache: "./cache",
		sources: "./contracts",
		tests: "./test",
	},
	solidity: {
		version: "0.8.26",
		settings: {
			optimizer: {
				enabled: true,
				runs: 200,
			},
		},
	}
};

export default config;

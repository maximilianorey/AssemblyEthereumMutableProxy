import { defineConfig } from "jest";
import type { JestConfigWithTsJest } from "ts-jest";

const config: JestConfigWithTsJest = {
	preset: "ts-jest/presets/default-esm",
	testEnvironment: "node",
	extensionsToTreatAsEsm: [ ".ts" ],
	transformIgnorePatterns: [
		"<rootDir>/node_modules/*"
	],
  
	moduleNameMapper: {
		"^(\\.\\.?/.*)\\.js$": "$1",
	},

	moduleFileExtensions: [ "ts", "js", "json", "node" ],

	transform: {
		"^.+\\.ts?$": [
			"ts-jest",
			{
				useESM: true,
			},
		],
	},
	testTimeout: 1500000
};

export default defineConfig(config);
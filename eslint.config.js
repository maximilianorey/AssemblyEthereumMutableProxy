import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import prettierPlugin from "eslint-plugin-prettier";
import stylisticPlugin from "@stylistic/eslint-plugin";
import eslintConfigPrettier from "eslint-config-prettier/prettier";
import json from "eslint-plugin-json";
import { globalIgnores } from "eslint/config";

export default tseslint.config(
	globalIgnores([
		"dist",
		"node_modules",
		"artifacts",
		"cache",
		"src/typechain",
	]),
	{
		files: [ "**/*.{ts,js,mjs,cjs}" ],
		plugins: {
			"@prettier": prettierPlugin,
			"@stylistic": stylisticPlugin,
		},
		languageOptions: { globals: globals.node },
		extends: [
      	js.configs.recommended,
			eslintConfigPrettier
		],
	},
	{
		extends: [
			js.configs.recommended
		],
		files: [ "**/*.{js,mjs,cjs}" ],
		rules: {
			"quote-props": [ "error", "as-needed" ],
			"array-bracket-newline": [ "error", "consistent" ],
			"array-element-newline": [ "error", "consistent" ],
			"function-call-argument-newline": [ "error", "consistent" ],
			"object-property-newline": [
				"error",
				{ allowAllPropertiesOnSameLine: false },
			],
			quotes: [ "error", "double" ],
			"object-curly-spacing": [ "error", "always" ],
			"object-curly-newline": [
				"error",
				{
					consistent: true,
					multiline: true,
					minProperties: 3,
				},
			],
			"array-bracket-spacing": [ "error", "always" ],
			"computed-property-spacing": [ "error", "always" ],
			indent: [ "error", "tab" ],
			semi: "error",
			"comma-spacing": [
				"error",
				{
					before: false,
					after: true,
				},
			],
			"@stylistic/array-bracket-spacing": [ "error", "always" ],
			"@stylistic/object-curly-spacing": [ "error", "always" ],
		},
		languageOptions: {
			globals: globals.node,
		},
	},
	{
		extends: [ js.configs.recommended, ...tseslint.configs.recommended ],
		files: [ "**/*.ts" ],
		languageOptions: {
			ecmaVersion: 2020,
			globals: globals.node,
		},
		rules: {
			quotes: [ "error", "double" ],
			"object-curly-spacing": [ "error", "always" ],
			"array-bracket-spacing": [ "error", "always" ],
			"computed-property-spacing": [ "error", "always" ],
			indent: [ "error", "tab" ],
			semi: "error",
			"@stylistic/array-bracket-spacing": [ "error", "always" ],
			"@stylistic/object-curly-spacing": [ "error", "always" ],
		},
	},
	{
		files: [ "**/*.json" ],
		plugins: {
			"@json": json,
		},
		rules: {
			"@json/*": "error",
		},
		processor: json.processors.json,
	},
);

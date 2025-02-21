const js = require("@eslint/js");
const globals = require("globals");
const tseslint = require("typescript-eslint");
const prettierPlugin = require("eslint-plugin-prettier");
const json = require("@eslint/json")

module.exports = tseslint.config(
	{
		ignores: [
			"dist",
			"node_modules",
			"artifacts",
			"cache",
			"templates",
			"src/typechain",
			"assembly"
		] 
	},
	{
		ignores: [
			"dist",
			"node_modules",
			"artifacts",
			"cache",
			"templates",
			"src/typechain",
			"assembly"
		],
		files: [ "**/*.{js,ts}" ],
		plugins: { prettier: prettierPlugin },
		languageOptions: { globals: globals.node }
	},
	{
		ignores: [
			"dist",
			"node_modules",
			"artifacts",
			"cache",
			"templates",
			"src/typechain",
			"assembly"
		],
		extends: [ js.configs.recommended ],
		files: [ "**/*.js" ],
		rules: { 
			"quote-props": [
				"error",
				"as-needed" 
			],
			"array-bracket-newline": "error",
			"array-element-newline": "error",
			"function-call-argument-newline": "error",
			"object-property-newline": [
				"error",
				{ allowAllPropertiesOnSameLine: false } 
			],
			quotes: [
				"error",
				"double" 
			],
			"object-curly-spacing": [
				"error",
				"always" 
			],
			"object-curly-newline":[
				"error",
				{
					consistent: true,
					multiline: true,
					minProperties: 3 
				} 
			],
			"array-bracket-spacing": [
				"error",
				"always" 
			],
			"computed-property-spacing": [
				"error",
				"always" 
			],
			indent: [
				"error",
				"tab" 
			],
			semi: "error"
		},
		languageOptions: {
			globals: globals.node
		}
	},
	{
		ignores: [
			"dist",
			"node_modules",
			"artifacts",
			"cache",
			"templates",
			"src/typechain",
			"assembly"
		],
		extends: [
			js.configs.recommended,
			...tseslint.configs.recommended
		],
		files: [ "**/*.ts" ],
		languageOptions: {
			ecmaVersion: 2020,
			globals: globals.node,
		},
		rules: {
			quotes: [
				"error",
				"double" 
			],
			"object-curly-spacing": [
				"error",
				"always" 
			],
			"array-bracket-spacing": [
				"error",
				"always" 
			],
			"computed-property-spacing": [
				"error",
				"always" 
			],
			indent: [
				"error",
				"tab" 
			],
			semi: "error"
		}
	},
	{
		plugins: json,
        files: ["**/*.json"],
        language: "json/json",
        rules: {
            "json/no-duplicate-keys": "error",
        },
    },
);
module.exports = {
	root: true,
	parser: "@typescript-eslint/parser",
	extends: [
		"plugin:svelte/recommended",
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended",
		"prettier",
	],
	plugins: ["@typescript-eslint", "prettier"],
	overrides: [
		{
			files: ["*.svelte"],
			parser: "svelte-eslint-parser",
			parserOptions: {
				parser: "@typescript-eslint/parser",
			},
		},
	],
	settings: {
		"svelte3/typescript": () => require("typescript"),
	},
	parserOptions: {
		sourceType: "module",
		ecmaVersion: 2020,
	},
	env: {
		browser: true,
		es2017: true,
		node: true,
	},
	rules: {
		"prettier/prettier": "error",
		"no-inner-declarations": "off",
		semi: ["error", "always"],
		indent: ["error", "tab"],
		"linebreak-style": ["error", "unix"],
		quotes: ["error", "double"],
	},
};

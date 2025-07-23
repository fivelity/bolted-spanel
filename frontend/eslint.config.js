import js from "@eslint/js";
import svelte from "eslint-plugin-svelte";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default [
  {
    ignores: [".svelte-kit/", "build/", "dist/", "*.config.js", "*.config.ts"],
  },
  js.configs.recommended,
  {
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        sourceType: "module",
        ecmaVersion: 2020,
        project: "./tsconfig.json",
        extraFileExtensions: [".svelte"],
      },
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      // Add or override rules as needed
      "svelte/valid-compile": "off"
    },
  },
  ...svelte.configs["flat/recommended"],
  prettier,
  {
    files: ["**/*.svelte"],
    languageOptions: {
      parserOptions: {
        parser: tsParser,
      },
    },
  },
];

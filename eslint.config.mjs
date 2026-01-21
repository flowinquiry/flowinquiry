import { fixupPluginRules } from "@eslint/compat";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import pluginReact from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import unusedImports from "eslint-plugin-unused-imports";
import globals from "globals";

export default [
    // Global ignores - must be first
    {
        ignores: [
            "**/.next/**",
            "**/.next",
            "**/node_modules/**",
            "**/node_modules",
            "**/out/**",
            "**/build/**",
            "**/dist/**",
            "**/.turbo/**",
            "**/coverage/**",
            "**/playwright-report/**",
            "**/test-results/**",
            "apps/frontend/.next/**",
            "apps/frontend/node_modules/**",
            "apps/frontend/out/**",
            "apps/frontend/playwright-report/**",
            "apps/frontend/test-results/**",
            "apps/docs/.next/**",
            "apps/docs/node_modules/**",
            "apps/docs/out/**",
            "apps/backend/build/**",
            "apps/backend/*/build/**",
            "build/**",
            "gradle/**",
            ".gradle/**",
        ],
    },
    // Main configuration
    {
        files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
        plugins: {
            "@typescript-eslint": typescriptEslint,
            "react": fixupPluginRules(pluginReact),
            "unused-imports": unusedImports,
            "simple-import-sort": simpleImportSort,
            "react-hooks": fixupPluginRules(reactHooksPlugin),
        },
        languageOptions: {
            globals: {
                ...globals.browser,
            },
            ecmaVersion: "latest",
            parser: typescriptParser,
        },
        rules: {
            // TypeScript ESLint recommended rules
            ...typescriptEslint.configs.recommended.rules,

            // Override TypeScript ESLint unused vars to be warnings instead of errors
            "@typescript-eslint/no-unused-vars": [
                "warn",
                {
                    vars: "all",
                    varsIgnorePattern: "^_",
                    args: "after-used",
                    argsIgnorePattern: "^_",
                },
            ],

            // Remove unused imports
            "unused-imports/no-unused-imports": "error",
            "unused-imports/no-unused-vars": [
                "warn",
                {
                    vars: "all",
                    varsIgnorePattern: "^_",
                    args: "after-used",
                    argsIgnorePattern: "^_",
                },
            ],

            // Sorting imports
            "simple-import-sort/imports": "error",
            "simple-import-sort/exports": "error",

            // React Hooks rules
            ...reactHooksPlugin.configs.recommended.rules,
        },
    },
];

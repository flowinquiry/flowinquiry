import { fixupPluginRules } from "@eslint/compat";
import typescriptParser from "@typescript-eslint/parser";
import reactHooksPlugin from "eslint-plugin-react-hooks";
// import pluginReact from "eslint-plugin-react";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import unusedImports from "eslint-plugin-unused-imports";
import globals from "globals";
// import eslint from '@eslint/js';
// import tseslint from "typescript-eslint";

export default [
    {
        files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
        ignores: [
            "apps/frontend/.next/**",
            "apps/frontend/playwright-report/**",
            "apps/frontend/out/**"
        ],
        plugins: {
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
            ...reactHooksPlugin.configs.recommended.rules,
        },
    },
    // ...tseslint.configs.strict,
    // ...tseslint.configs.stylistic,
    // eslint.configs.recommended,
    // pluginReact.configs.flat.recommended
];

import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import tseslint from "typescript-eslint";

import { rules } from "eslint-plugin-mock-typed";

/* eslint-disable @typescript-eslint/no-unsafe-assignment */

const tsconfigRootDir = import.meta.dirname;

/**
 * @type {import("@typescript-eslint/parser").ParserOptions}
 */
const parserOptions = {
  project: "./tsconfig.json",
  projectService: {
    defaultProject: `${tsconfigRootDir}/tsconfig.json`,
    allowDefaultProject: ["*.ts", "*.mjs"],
  },
  tsconfigRootDir,
};

/**
 * @type {import("eslint").Linter.Config[]}
 */
export default [
  ...tseslint.configs.recommendedTypeChecked,

  {
    files: ["*.ts"],
    ignores: ["eslint.config.mjs"],
  },

  {
    plugins: {
      "mock-typed": { rules },
    },

    languageOptions: {
      globals: {
        ...globals.node,
      },

      parser: tsParser,
      ecmaVersion: 2020,
      sourceType: "module",

      parserOptions,
    },

    rules: {
      "mock-typed/my-rule": "warn",
      "mock-typed/no-any-mock-value": "warn",
    },
  },
];

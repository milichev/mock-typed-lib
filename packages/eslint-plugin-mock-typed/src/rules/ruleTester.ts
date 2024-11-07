import path from "node:path";
import { RuleTester } from "@typescript-eslint/rule-tester";

const rootDir = path.resolve(__dirname, "../..");

export const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      ecmaVersion: 2015,
      sourceType: "commonjs",
      projectService: {
        defaultProject: `${rootDir}/tsconfig.json`,
        allowDefaultProject: ["*.ts*"],
      },
    },
  },
  settings: {
    moduleNameMapper: {
      "^mock-typed$": "<rootDir>/../../mock-typed/src/index.ts",
    },
  },
});

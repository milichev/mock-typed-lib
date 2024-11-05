import { RuleTester } from "@typescript-eslint/rule-tester";
import { rootDir } from "../const";

export const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
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

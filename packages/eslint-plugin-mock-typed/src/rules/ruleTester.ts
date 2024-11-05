import { RuleTester } from "@typescript-eslint/rule-tester";
import { rootDir } from "../const";

export const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      projectService: {
        defaultProject: `${rootDir}/tsconfig.json`,
        allowDefaultProject: ["*.ts*"],
      },
    },
  },
});

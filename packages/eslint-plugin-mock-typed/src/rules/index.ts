import { TSESLint } from "@typescript-eslint/utils";
import * as noAnyMockValue from "./no-any-mock-value";
import * as myRule from "./myRule";

export const rules = {
  [noAnyMockValue.name]: noAnyMockValue.rule,
  [myRule.name]: myRule.rule,
} satisfies Record<string, TSESLint.RuleModule<string, Array<unknown>>>;

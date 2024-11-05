import { RuleTester } from "@typescript-eslint/rule-tester";

import { name, rule } from "./myRule";

const parserResolver = require.resolve("@typescript-eslint/parser");

const ruleTester = new RuleTester({
  parser: parserResolver as any, // yarn 2+ shenanigans
});

ruleTester.run(name, rule, {
  valid: ["notFooBar()", "const foo = 2", "const bar = 2"],
  invalid: [
    {
      code: "foo()",
      errors: [{ messageId: "messageIdForSomeFailure" }],
    },
    {
      code: "bar()",
      errors: [{ messageId: "messageIdForSomeOtherFailure" }],
    },
  ],
});

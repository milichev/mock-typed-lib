import { name, rule } from "./myRule";
import { ruleTester } from "./ruleTester";

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

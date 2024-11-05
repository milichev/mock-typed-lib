import { rule, name } from "./no-any-mock-value";
import { ruleTester } from "./ruleTester";

const nestedType = `{
  a: {
    b: {
      c: number;
      f: (n: string) => {
        r: number;
        q: string;
      };
    };
    d: string;
  };
  e: Date;
}`;

ruleTester.run(name, rule, {
  valid: [
    `
    import { mock as mockObj } from './src';
    declare const fn: () => any;
    declare const value: any;
    mockObj.returnValue(fn, value);
    `,
    `
    import { mock as mockObj } from './src';
    type NestedObject = ${nestedType};
    declare const fn: () => NestedObject;
    mockObj.returnValue(fn, { a: { b: { f: () => ({ q: 'q' }) }}});
    `,
  ],
  invalid: [
    {
      code: `
            import { mock } from './src';
            const { returnValue: retVal } = mock;
            const fn: () => { a: 1 } = () => ({ a: 1 });
            const value: any = 1;
            retVal(fn, value);
            `,
      errors: [
        {
          messageId: "issue:any-mock-value",
          line: 6,
        },
      ],
    },
    {
      code: `
            import { mock } from './src';
            const fn: () => { a: 1 } = () => ({ a: 1 });
            const mix: any = {};
            mock.returnValue(fn, { ...mix, a: 1 });
            `,
      errors: [
        {
          messageId: "issue:any-mock-value",
          line: 5,
          data: {
            returnType: "{ a: 1; }",
          },
        },
      ],
    },
  ],
});

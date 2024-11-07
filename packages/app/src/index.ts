import { mock } from "mock-typed";

const foo = () => {};

const bar = () => {};

const fooBar = () => {};

foo();
bar();
fooBar();

const obj = {
  meth: () => ({
    id: 1,
    name: "thing",
  }),
};
jest.spyOn(obj, "meth");

mock.returnValue(obj.meth, { id: 3 }); // OK

mock.returnValue(obj.meth, JSON.parse("{}")); // Not OK: mock-typed/no-any-mock-value

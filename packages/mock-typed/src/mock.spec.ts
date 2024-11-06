import { mock } from "./mock";
import { describe, afterEach, beforeEach, expect, it, vi } from "vitest";
import { MockValueMockedInput } from "./types";

describe("mock", () => {
  beforeEach(() => {
    const { fn, mocked, isMockFunction } = vi;
    // it's a bliss that vi and jest APIs are compatible
    (global as any)["jest"] = {
      fn,
      mocked,
      isMockFunction,
    } as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("returnValue", () => {
    it("should throw when non-function passed", () => {
      expect(() => {
        const fn = 1 as unknown as () => { a: 1 };
        mock.returnValue(fn, { a: 1 });
      }).toThrow("fn expected to be a function");
    });

    it("should throw error when non-mocked function is passed", () => {
      expect(() => {
        const fn = () => ({ a: 1 } as const);
        mock.returnValue(fn, { a: 1 });
      }).toThrow("fn expected to be a mock or mocked function");
    });

    it("should set the return value", () => {
      const obj = {
        fn: ({ name }: { name: string }) => ({ name, a: 1 }),
      } as const;
      vi.spyOn(obj, "fn");
      const name = "ow";
      const expected = { a: 1, name };

      mock.returnValue(obj.fn, expected);

      expect(obj.fn({ name })).toBe(expected);
    });

    it("should preprocess the value using the prepare option", () => {
      type Arg = { name: string };
      const obj = { fn: ({ name }: Arg) => ({ id: 1, name }) };

      vi.spyOn(obj, "fn");

      mock.returnValue(
        obj.fn,
        { id: 2, name: "two" },
        {
          prepare: (value, arg) => {
            expect(arg).toEqual({ name: "one" });
            expect(value).toEqual({ id: 2, name: "two" });
            return { id: 3, name: "three" };
          },
        }
      );

      expect(obj.fn({ name: "one" })).toEqual({ id: 3, name: "three" });
    });
  });

  describe("impl", () => {
    it("should throw when non-function fn passed", () => {
      expect(() => {
        const fn = 1 as unknown as () => { a: number };
        mock.impl(fn, () => ({ a: 1 }));
      }).toThrow("fn expected to be a function");
    });

    it("should throw when non-function impl passed", () => {
      expect(() => {
        const obj = { fn: () => ({ a: 1 }) } as const;
        vi.spyOn(obj, "fn");
        mock.impl(obj.fn, { a: 1 } as unknown as () => { a: number });
      }).toThrow("impl expected to be a function");
    });

    it("should throw error when non-mocked function is passed", () => {
      expect(() => {
        const fn = () => ({ a: 1 });
        mock.impl(fn, () => ({}));
      }).toThrow("fn expected to be a mock or mocked function");
    });

    it("should set the return value", () => {
      const obj = { fn: (a: number) => ({ a }) } as const;
      vi.spyOn(obj, "fn");
      const expected = { a: 1 };

      mock.impl(obj.fn, () => expected);

      expect(obj.fn(1)).toBe(expected);
      expect(obj.fn).toHaveBeenCalledWith(1);
    });

    it("should preprocess the value using the prepare option", () => {
      type Arg = { name: string };
      const obj = { fn: ({ name }: Arg) => ({ id: 1, name }) };

      vi.spyOn(obj, "fn");

      mock.impl(
        obj.fn,
        (arg) => {
          expect(arg).toEqual({ name: "one" });
          return { id: 2, name: "two" };
        },
        {
          prepare: (value, arg) => {
            expect(arg).toEqual({ name: "one" });
            expect(value).toEqual({ id: 2, name: "two" });
            return { id: 3, name: "three" };
          },
        }
      );

      expect(obj.fn({ name: "one" })).toEqual({ id: 3, name: "three" });
    });

    describe("when testing a demo component using MockValueMockedInput", () => {
      /** A base type for data model defined in a library */
      type AbstractModel = Record<string, any>;

      /** Splits the data model into discriminated union type of { field, value } objects */
      type ToPairs<T extends AbstractModel> = {
        [K in keyof T]: { field: K; value: T[K] };
      }[keyof T];

      /** A library expects we provide it a subscriber of this type */
      type Observer<Model extends AbstractModel> = {
        <ValuePair extends ToPairs<Model>>(valuePair: ValuePair): void;
      };

      /** The subscribe method type */
      type Subscribe<Model extends AbstractModel> = (
        observer: Observer<Model>
      ) => {
        unsubscribe: (options: { count: number }) => void;
      };

      /** Let it be an abstract result of a feature hook in some library */
      type UseSubResult<Model extends AbstractModel> = {
        dispatch: (field: keyof Model) => void;
        sink: <Field extends keyof Model>(
          field: Field,
          value: Model[Field]
        ) => void;
        events: { subscribe: Subscribe<Model> };
      };

      /**
       * A demo hook in a library used by our component.
       * The result of the hook we are going to mock to test the component's functionality.
       * Note: this implementation is not ever called in this test suite. It is mocked below.
       */
      const useSub = <Model extends AbstractModel>(
        data: Model
      ): UseSubResult<Model> => {
        const observers: Observer<Model>[] = [];
        return {
          dispatch: (field) => {
            observers.forEach((observer) => {
              const value = data[field];
              observer({ field, value });
            });
          },
          sink: (field, value) => {
            console.log(field, value);
          },
          events: {
            subscribe: (observer) => {
              observers.push(observer);
              return { unsubscribe: ({ count: _count }) => {} };
            },
          },
        };
      };

      /** Suppose, it is a `hooks` module in a library */
      const hooks = { useSub };

      /** Let it be a Data Model in your project */
      type Model = { name: string; cap: number };

      /** Let it be a Component to test, which is using the hook in your project */
      const DemoComponent = () => {
        const data: Model = { name: "who", cap: 123 };

        // destructure the module for mocking demonstration
        // in reality, the test runner provides the mocked module
        const { useSub } = hooks;

        // call the hook (or the mock in tests)
        const sub = useSub(data);

        const { unsubscribe } = sub.events.subscribe(({ field, value }) => {
          const callName = (name: string) => sub.sink("name", name);
          const bookCap = (cap: number) => sub.sink("cap", cap);
          // notice the narrowing in discriminated unions!
          switch (field) {
            case "name":
              return callName(value); // value is string
            case "cap":
              return bookCap(value); // value is number
            default:
              const exhaustiveCheck: never = field;
              throw new Error(`wrong field ${exhaustiveCheck}`);
          }
        });

        unsubscribe({ count: 1 });

        return "some demo result";
      };

      let lastMockedResult: MockValueMockedInput<typeof useSub>;

      beforeEach(() => {
        vi.resetAllMocks();

        // in reality, it is mocking a module like `jest.mock('hooks')`
        vi.spyOn(hooks, "useSub");

        mock.impl(
          // jest/vi has mocked the hook in the module, so here we have a Mock function
          hooks.useSub,
          // provide a mock implementation
          () => ({
            // dispatch method is omitted: no need to mock it because the observer is called in the test
            sink: jest.fn(),
            events: {
              subscribe: jest.fn(),
              aa: 1,
            },
          }),
          {
            prepare: (result) => {
              // save the last result of our mock above.
              // cast to mocked result because we know it is
              lastMockedResult = result as typeof lastMockedResult;

              // provide nested mocks. it is better to do it here for type safety and brevity
              mock.returnValue(lastMockedResult.events?.subscribe!, {
                unsubscribe: jest.fn(),
              });

              return result;
            },
          }
        );
      });

      it("should compile and run the example function", () => {
        // some regular checks go here
        expect(DemoComponent()).toEqual("some demo result");

        // check the component has subscribed
        expect(lastMockedResult.events?.subscribe).toHaveBeenCalledOnce();

        const { unsubscribe } =
          lastMockedResult.events?.subscribe?.mock.results[0]?.value;

        // check the component has unsubscribed
        expect(unsubscribe).toHaveBeenCalledWith({ count: 1 });

        // check the correct subscribe observer
        expect(lastMockedResult.events?.subscribe).toHaveBeenCalledWith(
          expect.any(Function)
        );
        const observer = lastMockedResult.events?.subscribe?.mock.calls[0]![0]!;
        expect(observer).toEqual(expect.any(Function));

        // check the observer's functionality
        observer({ field: "name", value: "Buka" });
        expect(lastMockedResult.sink).toHaveBeenCalledWith("name", "Buka");
      });
    });
  });
});

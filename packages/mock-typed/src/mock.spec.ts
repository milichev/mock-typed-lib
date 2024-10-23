import { mock } from "./mock";
import { describe, afterEach, beforeEach, expect, it, vi } from "vitest";

describe("mock", () => {
  beforeEach(() => {
    const { mocked, isMockFunction } = vi;
    global.jest = {
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
  });
});

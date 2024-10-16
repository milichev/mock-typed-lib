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
      fn: () => ({ a: 1 }),
    } as const;
    vi.spyOn(obj, "fn");
    const expected = { a: 1 };

    mock.returnValue(obj.fn, expected);

    expect(obj.fn()).toBe(expected);
  });
});

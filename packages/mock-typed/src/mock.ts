import type {
  DeepPartial,
  MockMethods,
  MockReturnType,
  MockType,
} from "./types";

/**
 * A collection of mocking helper methods.
 */
export const mock = {
  /**
   * Accepts a value as a deep partial subset of `T` and returns the same value as a full type `T`.
   * Useful for creating fixtures and stubs that contain only required data.
   */
  getMockedValue: <T extends object>(value: DeepPartial<T>): T => {
    return value as T;
  },

  /**
   * Sets the mock's function return value to a value as a deep partial subset of `T`.
   * Useful for mocking return values with maintaining intellisense support.
   *
   * @param fn A mock to set return value of.
   * @param value The mock return value which is a deeply partial object. That it is containing only required/sound values.
   * @param looseFunc The options specifying that the function props args and return values are loose too. Default `false`.
   * @returns The input mock.
   */
  returnValue: <
    T extends jest.MockWithArgs<any> | ((...args: any[]) => any),
    V extends DeepPartial<MockReturnType<T>, RetVal>,
    RetVal extends boolean = false
  >(
    fn: T,
    value: V,
    { looseFunc: _looseFunc = false as RetVal }: { looseFunc?: RetVal } = {}
  ) => {
    if (typeof fn !== "function")
      throw new TypeError("fn expected to be a function");
    const mocked = jest.isMockFunction(fn)
      ? (fn as MockType<T>)
      : jest.mocked(fn);
    if (!jest.isMockFunction(mocked))
      throw new TypeError("fn expected to be a mock or mocked function");
    return mocked.mockReturnValue(value) as jest.Mock<
      (...args: Parameters<T>) => MockMethods<ReturnType<T>>
    >;
  },

  /**
   * Sets the mock's function implementation to provided one, which is allowed to return a value as a deep partial subset of the expected return type `T`.
   * Useful for mocking implementations with maintaining intellisense support.
   *
   * @param fn A mock to set return value of.
   * @param impl The mock implementation, which is allowed to return a deeply partial object. That it is containing only required/sound values.
   * @param looseFunc The options specifying that the function props args and return values are loose too. Default `false`.
   * @returns The input mock.
   */
  impl: <
    T extends jest.MockWithArgs<any> | ((...args: any[]) => any),
    V extends DeepPartial<MockReturnType<T>, RetVal>,
    RetVal extends boolean = false
  >(
    fn: T,
    impl: () => V,
    { looseFunc: _looseFunc = false as RetVal }: { looseFunc?: RetVal } = {}
  ) => {
    if (typeof fn !== "function")
      throw new TypeError("fn expected to be a function");
    if (typeof impl !== "function")
      throw new TypeError("impl expected to be a function");
    const mocked = jest.isMockFunction(fn)
      ? (fn as MockType<T>)
      : jest.mocked(fn);
    if (!jest.isMockFunction(mocked))
      throw new TypeError("fn expected to be a mock or mocked function");
    return mocked.mockImplementation(impl) as jest.Mock<
      (...args: Parameters<T>) => MockMethods<ReturnType<T>>
    >;
  },
} as const;

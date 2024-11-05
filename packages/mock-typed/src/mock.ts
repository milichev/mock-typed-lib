import type {
  DeepPartial,
  MockInput,
  MockMethods,
  MockParameters,
  MockPrepareValue,
  MockType,
  MockValueInput,
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
   * @param looseFunc Specifies that the function props args and return values are loose too. Default `false`.
   * @param prepare Optional, a function for processing the `value` before returning it from the mock function.
   * @returns The input mock.
   */
  returnValue: <
    M extends MockInput,
    V extends MockValueInput<M, RetVal>,
    RetVal extends boolean = false,
    Result extends MockPrepareValue<M, RetVal, V> = MockPrepareValue<
      M,
      RetVal,
      V
    >,
    Prepared extends MockValueInput<M, RetVal> = Result
  >(
    fn: M,
    value: V,
    options: {
      /** Specifies that the function props args and return values are loose too. Default `false`. */
      looseFunc?: RetVal;
      /** Optional, a function for pre-processing the value before returning it from the mock function. */
      prepare?: (value: Result, ...args: MockParameters<M>) => Prepared;
    } = {}
  ) => {
    if (typeof fn !== "function")
      throw new TypeError("fn expected to be a function");
    const mocked = jest.isMockFunction(fn)
      ? (fn as MockType<M>)
      : jest.mocked(fn);
    if (!jest.isMockFunction(mocked))
      throw new TypeError("fn expected to be a mock or mocked function");

    const { prepare } = options;
    if (prepare) {
      return mocked.mockImplementation((...args: MockParameters<M>) => {
        return prepare(value, ...args);
      }) as jest.Mock<(...args: Parameters<M>) => MockMethods<ReturnType<M>>>;
    }

    return mocked.mockReturnValue(value) as jest.Mock<
      (...args: Parameters<M>) => MockMethods<ReturnType<M>>
    >;
  },

  /**
   * Sets the mock's function implementation to provided one, which is allowed to return a value as a deep partial subset of the expected return type `T`.
   * Useful for mocking implementations with maintaining intellisense support.
   *
   * @param fn A mock to set return value of.
   * @param impl The mock implementation, which is allowed to return a deeply partial object. That it is containing only required/sound values.
   * @param looseFunc The options specifying that the function props args and return values are loose too. Default `false`.
   * @param prepare Optional, a function for processing the result of `impl` before returning it from the mock function.
   * @returns The input mock.
   */
  impl: <
    M extends MockInput,
    RetVal extends boolean = false,
    V extends MockValueInput<M, RetVal> = MockValueInput<M, RetVal>,
    F extends (...args: MockParameters<M>) => V = (
      ...args: MockParameters<M>
    ) => V,
    Result extends MockPrepareValue<M, RetVal, V> = MockPrepareValue<
      M,
      RetVal,
      V
    >,
    Prepared extends MockValueInput<M, RetVal> = Result
  >(
    fn: M,
    impl: F,
    options: {
      /** Specifies that the function props args and return values are loose too. Default `false`. */
      looseFunc?: RetVal;
      /** Optional, a function for pre-processing the value before returning it from the mock function. */
      prepare?: (value: Result, ...args: MockParameters<M>) => Prepared;
    } = {}
  ) => {
    if (typeof fn !== "function")
      throw new TypeError("fn expected to be a function");
    if (typeof impl !== "function")
      throw new TypeError("impl expected to be a function");
    const mocked = jest.isMockFunction(fn)
      ? (fn as MockType<M>)
      : jest.mocked(fn);
    if (!jest.isMockFunction(mocked))
      throw new TypeError("fn expected to be a mock or mocked function");

    const { prepare } = options;
    return mocked.mockImplementation((...args: MockParameters<M>) => {
      const value = impl(...args);
      return prepare ? prepare(value, ...args) : value;
    }) as jest.Mock<(...args: Parameters<M>) => MockMethods<ReturnType<M>>>;
  },
} as const;

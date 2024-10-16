import type { DeepPartial, MockMethods, MockReturnType, MockType } from './types';

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
   */
  returnValue: <
    T extends jest.MockWithArgs<any> | ((...args: any[]) => any),
    V extends DeepPartial<MockReturnType<T>, true>
  >(
    fn: T,
    value: V
  ) => {
    if (typeof fn !== 'function') throw new TypeError('fn expected to be a function');
    const mocked = jest.isMockFunction(fn) ? (fn as MockType<T>) : jest.mocked(fn);
    if (!jest.isMockFunction(mocked)) throw new TypeError('fn expected to be a mock or mocked function');
    return mocked.mockReturnValue(value) as jest.Mock<(...args: Parameters<T>) => MockMethods<ReturnType<T>>>;
  },
} as const;

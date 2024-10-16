/**
 * Defines a type representing input type `T` with all properties recursively optional.
 *
 * @param T The base type a loose version of is required.
 * @param RetVal Instructs to follow the function arguments and return values making them recursively partial too. Default is `false`.
 *
 * @example
 *   export const v: DeepPartial<
 *     {
 *       a: {
 *         b: {
 *           c: number;
 *           f: (n: string) => {
 *             r: number;
 *             q: string;
 *           };
 *         };
 *         d: string;
 *       };
 *       e: Date;
 *     },
 *     true
 *   > = {
 *     a: {
 *       b: {
 *         f: (aa) => ({ q: 'q' }),
 *       },
 *     },
 *   };
 */
export type DeepPartial<T, RetVal extends boolean = false> = T extends Function
  ? RetVal extends true
    ? T extends (...args: infer A) => infer R
      ? (...args: DeepPartial<A, RetVal>) => DeepPartial<R, RetVal>
      : T
    : T
  : T extends object
  ? { [P in keyof T]?: DeepPartial<T[P], RetVal> }
  : T;

export type MockMethods<T extends object> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R ? jest.Mock<R, A> : T[K];
};

/** Returns a type the mock is created for. */
export type MockType<T extends jest.MockWithArgs<any> | ((...args: any[]) => any)> = T extends jest.MockWithArgs<
  infer V
>
  ? V
  : T extends (...args: any[]) => any
  ? T
  : never;

export type MockReturnType<T extends jest.MockWithArgs<any> | ((...args: any[]) => any)> = T extends jest.MockWithArgs<
  infer V
>
  ? ReturnType<V>
  : T extends (...args: any[]) => infer R
  ? R
  : any;

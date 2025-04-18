export type Defined<T> = Exclude<T, undefined>;
export type AnyFunction = (...args: any[]) => any;

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
  : T extends Date
  ? T
  : T extends object
  ? { [P in keyof T]?: DeepPartial<T[P], RetVal> }
  : T;

/**
 * A map of types that are bypassed in MockMethods.
 * Each property of the interface has a value of type which are not supposed for method mocking.
 * The interface can be augmented in other modules to extend the set of skipped types:
 *
 * @example
 * type Entity = {
 *   call: () => string;
 * };
 *
 * declare module 'mock-typed' {
 *   export interface NoMethodMockingTypes {
 *     entity: Entity;
 *   }
 * }
 *
 * type Context = {
 *   calc: () => number;
 *   entity: Entity;
 * }
 *
 * type ContextMock = MockMethods<Context>;
 * declare const contextMock: ContextMock;
 * contextMock.alert.mockReturnValue(42); // alert method is mocked
 * contextMock.entity.call.mockReturnValue('bogus'); // ERROR: call method is not mocked
 */
export interface NoMethodMockingTypes {
  blob: Blob;
  date: Date;
  arrayBuffer: ArrayBuffer;
}

export type AllNoMethodMockingTypes =
  NoMethodMockingTypes[keyof NoMethodMockingTypes];

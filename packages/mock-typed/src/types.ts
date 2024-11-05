type Defined<T> = Exclude<T, undefined>;

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

type AllNoMethodMockingTypes = NoMethodMockingTypes[keyof NoMethodMockingTypes];

export type MockMethods<T extends object> = {
  [K in keyof T]: Defined<T[K]> extends (...args: infer A) => infer R
    ? jest.Mock<R, A>
    : Defined<T[K]> extends AllNoMethodMockingTypes
    ? T[K]
    : Defined<T[K]> extends object
    ? MockMethods<Defined<T[K]>>
    : T[K];
};

export type MockInput = jest.MockWithArgs<any> | ((...args: any[]) => any);

/** Returns a type the mock is created for. */
export type MockType<M extends MockInput> = M extends jest.MockWithArgs<infer V>
  ? V
  : M extends (...args: any[]) => any
  ? M
  : never;

export type MockValueMockedInput<
  M extends MockInput,
  RetVal extends boolean = false
> = MockMethods<DeepPartial<MockReturnType<M>, RetVal>>;

export type MockValueInput<
  M extends MockInput,
  RetVal extends boolean = false
> = DeepPartial<MockReturnType<M>, RetVal> | MockValueMockedInput<M, RetVal>;

export type MockPrepareValue<
  M extends MockInput,
  RetVal extends boolean,
  Result extends MockValueInput<M, RetVal>
> = Result;

export type MockParameters<M extends MockInput> = M extends jest.MockWithArgs<
  infer V
>
  ? Parameters<V>
  : M extends (...args: infer P) => any
  ? P
  : any;

export type MockReturnType<M extends MockInput> = M extends jest.MockWithArgs<
  infer V
>
  ? ReturnType<V>
  : M extends (...args: any[]) => infer R
  ? R
  : any;

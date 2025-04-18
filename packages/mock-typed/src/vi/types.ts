import type { Mock } from "vitest";
import type {
  Defined,
  AllNoMethodMockingTypes,
  DeepPartial,
  AnyFunction,
} from "../types";

type ResolveMocked<T> = T extends AnyFunction
  ? Mock<T>
  : T extends AllNoMethodMockingTypes
  ? T
  : T extends object
  ? MockMethods<T>
  : T;

export type MockMethods<T extends object> = {
  [K in keyof T]: ResolveMocked<Defined<T[K]>>;
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

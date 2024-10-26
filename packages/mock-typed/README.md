# mock-typed

> A tiny TypeScript library for type-safe function mocks in unit tests

## Installation

Depending on the used package manager, one of the following:

```sh
npm install -D mock-typed
yarn add -D mock-typed
```

## Usage

Package `mock-typed` contains test mock helpers that help write strictly type-safe, straightforward, and maintainable code with full support of IDEs.

> ☝🏼 Regardless of which testing framework is used, jest or vi, safe and flexible mocking is crucial.

### `mock.returnValue(fn | mock<fn>, value[, options])`

Sets the mocked function to return the provided value.

The value argument is type-safe but deeply partial. This means you can provide props that are only required for the test. Also, during coding, you get early typescript errors.

**Before:**

```tsx
import { useUser } from 'hooks'; 

jest.mock('hooks/useUser');

// funky but still:
const useUserMock = useUser as jest.Mock;
// or better:
const useUserMock = jest.mocked(useUser);

// here, weird things are starting to happen
// for some reason, we get the module { useUser: [Function] }
// however, the type of useUserActual is `any`
const useUserActual = jest.requireActual('hooks/useUser')

// Yeah, useUserMock is typed as jest.MockedFunctionDeep<fn>, but...
useUserMock.mockImplementation(() => ({
  // useUserActual is any. Therefore, the type of
  // the whole thing is collapsed to any *:
  ...useUserActual,
  // As a result, the developer gets no cue that they write
  // unsafe code. F.x., a real case: there is no such property
  // in the return type of useUser:
  channels: ['GA', 'ANDR'],
}));
```
No brainer, this mock code silently gets broken when the API changes.

**After:**

```tsx
import { mock } from 'mock-typed';
import { useUser } from 'hooks'; 

jest.mock('hooks/useUser');

// either useUser or useUserMock can be passed:
mock.returnValue(useUser, {
  // thankfully to the type safety, we found the error,
  // but maintain the flexibility
  tenant: {
    // providing only the required fields
    channels: ['GA', 'ANDR'],
  },
});
```

When you write something wrong you get a ts error.

Autocomplete in IDE also works.

### `mock.impl(fn | mock<fn>, implementation[, options])`

Sets the mock implementation maintaining type safety of the mock function return type.

```ts
type Fn = <Code extends number>(code: Code) => Result<Code>;

type Result<Code extends number> = {
  code: Code;
  status: string;
  validate: (value: string) => boolean;
  retry: () => void;
};

// suppose, the function to mock is imported
declare const fn: Fn;

// declare in the test suite
const result: MockValueMockedInput<Fn> = {
  validate: jest.fn(),
};

// set the implementation in `beforeEach`:
beforeEach(() => {
  // need to reset mocks to avoid side effects with
  // the `validate` method mock
  jest.resetAllMocks();

  // set the implementation
  mock.impl(fn, (code) => ({
    // spreading immutable props from the static object
    ...result,
    // setting the dynamic prop
    code,
    // omitting irrelevant props
  }));
});

// the `validate` method has the respective signature.
// result has a deeply partial object type, therefore,
// all nested members are optional, which requires `?.`
// type assertion:
result.validate?.('value');

expect(result.validate).toHaveBeenCalled();

// at the same time, it has Mock typing:
result.validate?.mockClear();
```

#### Advanced Usage

##### `prepare` callback

**See the example in the test suite ["when testing a demo component using MockValueMockedInput"`](src/mock.spec.ts).**

Suppose, you need to mock the result of a hook, f.x. `useSub`, which returns an object with nested properties.

1. you provide a return value of the `useSub`;
2. in the `prepare` callback, you get the object and do additional preparations: set the return value of `lastMockedResult.events.subscribe` method.

```ts
mock.impl(
  // jest/vi has mocked the hook in the module,
  // so here we have a Mock function
  hooks.useSub,
  // provide a mock implementation
  () => ({
    // dispatch method is omitted: no need to mock it
    // because the observer is called in the test
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
      // provide nested mocks. it is better to do it here for
      // type safety and brevity
      mock.returnValue(lastMockedResult.events?.subscribe!, {
        unsubscribe: jest.fn(),
      });
      return result;
    },
  }
);
```

###### `MockValueMockedInput` type for value declarations

The helper type `MockValueMockedInput` provides a simple way to declare type-safe mock objects with jest/vi mock typing:

```ts
/** Some function's return type */
type Something = {
  create: {
    mutate: (id: number) => number;
  };
  clear: () => void;
};

/** A function to mock */
type FN = () => Something;

/** Mocked function result */
type MT = MockValueMockedInput<FN>;

let mt: MT;

// methods are respecting the signature
mt.create!.mutate!(1);

// and adding mock functionality
mt.create!.mutate!.mockReset!();
mt.clear!.mockClear();
```  

**Note**: the type assertion: `mt.create!.mutate!`, which is required because the properties are optional.

## Contribution

Add your feature or fix and create a Pull Request.

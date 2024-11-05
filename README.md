# Monorepo for the `mock-typed` library

This is a monorepo for the `mock-typed` library used for type safe and convenient mocking in jest and vi unit tests.

## Usage

See the respective usage descriptions:

* `mock-typed` package [README.md](packages/mock-typed/README.md)
* `eslint-plugin-mock-typed` package [README.md](packages/eslint-plugin-mock-typed/README.md)

## Testing

Run `yarn test` in the respective package.

## Contribution

Add your feature or fix and create a Pull Request.

To bump the version of the packages, run the following terminal command:

```sh
VERSION=0.0.7 yarn bump
```

Where `0.0.7` is the new semver.

## Credits

The monorepo structure is inspired by [eslint-typescript-custom-rule](https://github.com/vinassefranche/eslint-typescript-custom-rule) by [Vincent François
](https://github.com/vinassefranche).
# Monorepo for the `mock-typed` library

This is a monorepo for the `mock-typed` library used for type safe and convenient mocking in jest and vi unit tests.

## Usage

See the respective usage descriptions:

* `mock-typed` package [README.md](packages/mock-typed/README.md)
* `eslint-plugin-mock-typed` package [README.md](packages/eslint-plugin-mock-typed/README.md)

## Testing

Run `pnpm run test` in the respective package.

## Contribution

Add your feature or fix and create a Pull Request.

To bump the version of the packages without committing changes, run the following terminal command:

```sh
pnpm version 1.2.3 -r --no-commit-hooks --no-git-tag-version -ws --no-workspaces-update
```

Where `1.2.3` is the new semver.

## Credits

The monorepo structure is inspired by [eslint-typescript-custom-rule](https://github.com/vinassefranche/eslint-typescript-custom-rule) by [Vincent François
](https://github.com/vinassefranche).
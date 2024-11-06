module.exports = {
  env: {
    node: true,
    es6: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    extraFileExtensions: [".ts, .tsx"],
  },
  parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
  },
  plugins: ["mock-typed"],
  rules: {
    "mock-typed/my-rule": "error",
  },
};

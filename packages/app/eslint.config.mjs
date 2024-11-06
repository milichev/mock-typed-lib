import mockTyped from "eslint-plugin-mock-typed";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";

export default [{
    plugins: {
        "mock-typed": mockTyped,
    },

    languageOptions: {
        globals: {
            ...globals.node,
        },

        parser: tsParser,
        ecmaVersion: 5,
        sourceType: "commonjs",

        parserOptions: {
            project: "./tsconfig.json",
            tsconfigRootDir: "/Users/vmilichev/Dev/github/milichev/mock-typed-lib/packages/app",
        },
    },

    rules: {
        "mock-typed/my-rule": "error",
    },
}];
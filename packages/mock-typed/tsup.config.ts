import { defineConfig } from "tsup";

export default defineConfig((options) => ({
  entry: ["src/index.ts"],
  splitting: false,
  format: ["esm", "cjs"],
  sourcemap: true,
  clean: true,
  //   minify: !options.watch,
  minify: false,
}));

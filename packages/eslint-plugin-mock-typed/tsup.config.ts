import { defineConfig } from "tsup";

const outDir = "dist";

export default defineConfig((options) => ({
  entry: ["src/index.ts"],
  outDir,
  splitting: false,
  format: ["esm", "cjs"],
  sourcemap: true,
  clean: true,
  minify: false,
}));

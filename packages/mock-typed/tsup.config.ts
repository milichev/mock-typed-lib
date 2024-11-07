import { defineConfig } from "tsup";
import fs from "node:fs/promises";
import path from "node:path";

const outDir = "dist";
const referenceDirective = `/// <reference types="@types/jest" />\n`;

export default defineConfig((options) => ({
  entry: ["src/index.ts"],
  outDir,
  splitting: false,
  format: ["esm", "cjs"],
  sourcemap: true,
  clean: true,
  minify: false,
  onSuccess: async () => {
    try {
      // Get all files recursively in outDir
      const files = await fs.readdir(outDir, { withFileTypes: true });
      const dtsFiles = files
        .filter(
          (file) =>
            file.isFile() &&
            (file.name.endsWith(".d.ts") || file.name.endsWith(".d.mts"))
        )
        .map((file) => path.join(outDir, file.name));

      // Prepend the reference directive to each .d.ts and .d.mts file
      await Promise.all(
        dtsFiles.map(async (file) => {
          const content = await fs.readFile(file, "utf8");
          if (!content.startsWith(referenceDirective)) {
            await fs.writeFile(file, referenceDirective + content, "utf8");
          }
        })
      );
      console.log(
        "Successfully prepended reference directive to declaration files."
      );
    } catch (error) {
      console.error("Error prepending reference directive:", error);
    }
  },
}));

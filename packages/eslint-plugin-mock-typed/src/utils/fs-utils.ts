import * as fs from "node:fs";
import * as path from "node:path";

export const tryFindFile = (
  fileName: string,
  where: string = process.cwd()
): string | undefined => {
  const filePath = path.join(where, fileName);

  if (fs.existsSync(filePath)) {
    return filePath;
  }

  const parentDir = path.dirname(where);

  // If reached the root directory, stop recursion
  if (parentDir === where) {
    return undefined;
  }

  return tryFindFile(fileName, parentDir);
};

export const getFileContentAsObject = <T extends object>(
  filename: string
): T | undefined => {
  const content = fs.readFileSync(filename, { encoding: "utf-8" });
  try {
    return JSON.parse(content) as T;
  } catch {
    return undefined;
  }
};

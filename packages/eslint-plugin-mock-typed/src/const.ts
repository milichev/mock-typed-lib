import path from "node:path";
import packageJson from "../package.json";

const [packageName1, packageName2] = packageJson.name.split("/");

export const packageScope = packageName2 ? `${packageName1}/` : "";
export const packageName = packageName2 ?? packageName1;
export const version = packageJson.version;
export const repoUrl = packageJson.repository.url;
export const eslintPluginName = packageJson.name;
export const rootDir = path.resolve(__dirname, "..");
export const mockTypePackageName = "mock-typed";
export const mockMethods = ["returnValue", "impl"] as const;

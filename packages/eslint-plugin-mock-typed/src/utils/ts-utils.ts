import ts from "typescript";
import { ArrayValues, PackageJson } from "type-fest";
import type { TSNode } from "@typescript-eslint/typescript-estree";
import { getFileContentAsObject, tryFindFile } from "./fs-utils";

export function getParentByKind<K extends ts.SyntaxKind>(
  node: ts.Node,
  kind: K
): Extract<TSNode, { kind: K }> | undefined {
  return getParent<Extract<TSNode, { kind: K }>>(
    node,
    (current) => current.kind === kind
  );
}

export function getParent<N extends ts.Node = ts.Node>(
  node: ts.Node,
  predicate: (current: ts.Node) => boolean
) {
  let current = node;
  while (current) {
    if (predicate(current)) {
      return current as N;
    }
    current = current.parent;
  }
  return undefined;
}

export function resolveModule(
  moduleSpecifierText: string,
  containingFile: string,
  program: ts.Program
): ts.SourceFile | undefined {
  const resolvedModule = ts.resolveModuleName(
    moduleSpecifierText,
    containingFile,
    program.getCompilerOptions(),
    ts.sys
  );

  const resolvedFileName = resolvedModule.resolvedModule?.resolvedFileName;
  return resolvedFileName ? program.getSourceFile(resolvedFileName) : undefined;
}

export function hasExportModifier(
  modifiers: ts.NodeArray<ts.ModifierLike> | undefined
) {
  return !!modifiers?.some((mod) => mod.kind === ts.SyntaxKind.ExportKeyword);
}

export function findDeclarationsInFile({
  file,
  checker,
  program,
  exportedName,
  predicate,
}: {
  file: ts.SourceFile;
  checker: ts.TypeChecker;
  program: ts.Program;
  exportedName?: string;
  predicate?: (decl: ts.Declaration) => boolean;
}) {
  const decls: ts.Declaration[] = [];
  const paths: string[] = [];
  collectDeclarations({
    node: file,
    checker,
    program,
    decls,
    paths,
    exportedName,
    predicate,
  });
  return decls;
}

export function getDeclarationAtSymbol({
  symbol,
  checker,
  program,
  predicate,
}: {
  symbol: ts.Symbol;
  checker: ts.TypeChecker;
  program: ts.Program;
  predicate?: (decl: ts.Declaration) => boolean;
}) {
  const decls: ts.Declaration[] = [];
  const paths: string[] = [];
  symbol?.getDeclarations()?.forEach((decl) =>
    collectDeclarations({
      node: decl,
      checker,
      program,
      decls,
      paths,
      exportedName: symbol.escapedName.toString(),
      predicate,
    })
  );
  return decls[0];
}

function collectDeclarations({
  node,
  checker,
  program,
  decls,
  paths,
  exportedName,
  predicate,
  visited,
}: {
  node: ts.Node;
  checker: ts.TypeChecker;
  program: ts.Program;
  decls: ts.Declaration[];
  paths: string[];
  exportedName?: string;
  predicate?: (decl: ts.Declaration) => boolean;
  visited?: Set<ts.Node>;
}) {
  if (visited?.has(node) || ((predicate || exportedName) && decls.length > 0))
    return;

  if (!visited) visited = new Set();
  visited.add(node);

  if (ts.isSourceFile(node)) {
    paths.unshift(node.fileName);
    ts.forEachChild(node, (child) =>
      collectDeclarations({
        node: child,
        checker,
        program,
        decls,
        paths,
        exportedName,
        visited,
        predicate,
      })
    );
    paths.shift();
  } else if (ts.isVariableStatement(node)) {
    if (!hasExportModifier(node.modifiers)) return;
    node.declarationList.forEachChild((child) =>
      collectDeclarations({
        node: child,
        checker,
        program,
        decls,
        paths,
        exportedName,
        visited,
        predicate,
      })
    );
  } else if (ts.isVariableDeclaration(node)) {
    if (predicate && predicate(node)) {
      decls.push(node);
    } else if (exportedName && node.name.getText() === exportedName) {
      const parentStatement = getParentByKind(
        node,
        ts.SyntaxKind.VariableStatement
      );
      if (parentStatement && hasExportModifier(parentStatement.modifiers))
        decls.push(node);
    } else {
      decls.push(node);
    }
  } else if (ts.isExportDeclaration(node)) {
    if (node.isTypeOnly) return;
    if (node.exportClause && ts.isNamedExports(node.exportClause)) {
      node.exportClause.elements.forEach((element) =>
        collectDeclarations({
          node: element,
          checker,
          program,
          decls,
          paths,
          exportedName,
          visited,
          predicate,
        })
      );
    } else if (
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      const moduleSpecifier = node.moduleSpecifier.text;
      const resolvedFile = resolveModule(
        moduleSpecifier,
        node.getSourceFile().fileName,
        program
      );
      if (resolvedFile)
        collectDeclarations({
          node: resolvedFile,
          checker,
          program,
          decls,
          paths,
          exportedName,
          visited,
          predicate,
        });
    }
  } else if (ts.isExportSpecifier(node)) {
    if (node.isTypeOnly) return;
    const symbol = checker.getSymbolAtLocation(node.name);
    if (symbol) {
      const declarations = symbol.getDeclarations();
      if (declarations) {
        declarations.forEach((decl) =>
          collectDeclarations({
            node: decl,
            checker,
            program,
            decls,
            paths,
            exportedName,
            visited,
            predicate,
          })
        );
      }
    }
  } else if (ts.isImportSpecifier(node)) {
    if (!exportedName || node.name.getText() === exportedName) {
      collectDeclarations({
        node: node.parent,
        checker,
        program,
        decls,
        paths,
        exportedName,
        visited,
        predicate,
      });
    }
  } else if (ts.isNamedImports(node) || ts.isImportClause(node)) {
    collectDeclarations({
      node: node.parent,
      checker,
      program,
      decls,
      paths,
      exportedName,
      visited,
      predicate,
    });
  } else if (ts.isImportDeclaration(node)) {
    if (!node.moduleSpecifier || !ts.isStringLiteral(node.moduleSpecifier))
      return;
    if (exportedName) {
      const { namedBindings } = node.importClause ?? {};
      if (!namedBindings || !ts.isNamedImports(namedBindings)) return;
      const binding = namedBindings.elements.find(
        (el) => el.name.getText() === exportedName
      );
      if (!binding) return;
      exportedName = (binding.propertyName ?? binding.name).getText();
    }
    const moduleSpecifier = node.moduleSpecifier.text;
    const resolvedFile = resolveModule(
      moduleSpecifier,
      node.getSourceFile().fileName,
      program
    );
    if (resolvedFile)
      collectDeclarations({
        node: resolvedFile,
        checker,
        program,
        decls,
        paths,
        exportedName,
        visited,
        predicate,
      });
  }
}

export function resolveTypeReferences(
  type: ts.Type,
  checker: ts.TypeChecker
): ts.Type {
  if (isTypeReference(type)) {
    const [declaration] = type.symbol?.declarations || [];

    if (
      declaration &&
      (ts.isTypeAliasDeclaration(declaration) ||
        ts.isInterfaceDeclaration(declaration) ||
        ts.isClassDeclaration(declaration))
    ) {
      return checker.getDeclaredTypeOfSymbol(type.symbol);
    }
  }

  return type;
}

export function isTypeReference(type: ts.Type): type is ts.TypeReference {
  return (
    (type.flags & ts.TypeFlags.Object) !== 0 &&
    ((type as ts.ObjectType).objectFlags & ts.ObjectFlags.Reference) !== 0
  );
}

export function isAnyType(type: ts.Type) {
  return (type.flags & ts.TypeFlags.Any) !== 0;
}

const notAPackage = Symbol.for("not-a-package.json");
const packageJsonCache = new Map<string, PackageJson | typeof notAPackage>();

export function getTypePackage(
  element?: ts.Type | ts.Node
): PackageJson | undefined {
  const { fileName } =
    (element as ts.Type)?.symbol?.declarations?.[0]?.getSourceFile?.() ??
    (element as ts.Node)?.getSourceFile?.() ??
    {};

  if (!fileName) return undefined;

  let packageJson = packageJsonCache.get(fileName);
  if (packageJson === notAPackage) return undefined;

  if (!packageJson) {
    const packageFilename = tryFindFile("package.json", fileName);
    if (packageFilename) {
      packageJson = getFileContentAsObject<PackageJson>(packageFilename);
      packageJsonCache.set(packageFilename, packageJson ?? notAPackage);
    }
    packageJsonCache.set(fileName, packageJson ?? notAPackage);
  }

  return packageJson as PackageJson | undefined;
}

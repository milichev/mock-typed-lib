import * as ts from "typescript";
import { TSESTree, ESLintUtils } from "@typescript-eslint/utils";
import { AST_NODE_TYPES } from "@typescript-eslint/typescript-estree";
import invariant from "tiny-invariant";
import { createRule } from "./createRule";
import {
  findDeclarationsInFile,
  getDeclarationAtSymbol,
  getParent,
  isAnyType,
  resolveModule,
  resolveTypeReferences,
} from "../ts-utils";

type MessageIds = "issue:any-mock-value";
type Options = [];

export const name = "no-any-mock-value";

export const rule = createRule<Options, MessageIds>({
  name,
  meta: {
    type: "problem",

    docs: {
      description: "Disallow `any` type as a mocked value",
    },
    schema: [],
    messages: {
      ["issue:any-mock-value"]:
        "Avoid using values of type `any` as a typed mocked value. Instead, provide a deeply partial value assignable to  {{ returnType }}",
    },
    fixable: "code",
  },
  defaultOptions: [],
  create(context) {
    const services = ESLintUtils.getParserServices(context);
    const { program } = services;
    const checker = program.getTypeChecker();
    const mockDeclFile = resolveModule("../mock.ts", __filename, program);
    if (!mockDeclFile) {
      console.warn(
        `[${name}]: Could not resolve "../mock.ts" module. A compilation error may have occurred. Skipping the check...`
      );
      return {};
    }

    const mockDecl = findDeclarationsInFile({
      file: mockDeclFile,
      checker,
      program,
      exportedName: "mock",
    })[0] as ts.VariableDeclaration;
    invariant(mockDecl, "mock declaration expected");

    return {
      CallExpression(node: TSESTree.CallExpression) {
        if (maybeReturnValueFunctionCall(node)) {
          const identType = checker.getTypeAtLocation(
            services.esTreeNodeToTSNodeMap.get(node.callee)
          );
          const maybeMockDecl = checker
            .getSignaturesOfType(identType, ts.SignatureKind.Call)
            .map((sig) =>
              getParent<ts.VariableDeclaration>(
                sig.getDeclaration(),
                ts.isVariableDeclaration
              )
            )
            .filter(Boolean)[0];
          if (maybeMockDecl !== mockDecl) return;
        } else if (maybeReturnValueMethodCall(node)) {
          // assert that the method is called on the `mock` var declaration
          const objSymbol = services.getSymbolAtLocation(node.callee.object);
          const objTypeDecl =
            objSymbol &&
            getDeclarationAtSymbol({ symbol: objSymbol, checker, program });
          if (objTypeDecl !== mockDecl) return;
        }

        const [fnArgNode, valArgNode] = node.arguments;
        invariant(fnArgNode, "fn arg expected");
        invariant(valArgNode, "value arg expected");

        // get type of fn (1st arg of `returnValue`)
        const fnTsNode = services.esTreeNodeToTSNodeMap.get(fnArgNode);
        const fnType = checker.getTypeAtLocation(fnTsNode);
        const fnSignature = checker.getSignaturesOfType(
          fnType,
          ts.SignatureKind.Call
        )[0];
        if (!fnSignature) return;

        const returnType = resolveTypeReferences(
          checker.getReturnTypeOfSignature(fnSignature),
          checker
        );
        if (isAnyType(returnType)) return;

        // get type of value (2nd arg of `returnValue`)
        const valTsNode = services.esTreeNodeToTSNodeMap.get(valArgNode);
        const valType = resolveTypeReferences(
          checker.getTypeAtLocation(valTsNode),
          checker
        );

        if (isAnyType(valType)) {
          context.report({
            node: valArgNode,
            messageId: "issue:any-mock-value",
            data: {
              returnType: checker.typeToString(returnType),
            },
          });
        }
      },
    };
  },
});

function maybeReturnValueMethodCall(
  node: TSESTree.CallExpression
): node is TSESTree.CallExpression & {
  callee: TSESTree.MemberExpression;
} {
  return (
    node.callee.type === AST_NODE_TYPES.MemberExpression &&
    node.callee.property.type === AST_NODE_TYPES.Identifier &&
    node.callee.property.name === "returnValue" &&
    node.arguments.length === 2
  );
}

function maybeReturnValueFunctionCall(
  node: TSESTree.CallExpression
): node is TSESTree.CallExpression & {
  callee: TSESTree.Identifier;
} {
  return (
    node.callee.type === AST_NODE_TYPES.Identifier &&
    node.arguments.length === 2
  );
}

import * as ts from "typescript";
import { TSESTree, ESLintUtils } from "@typescript-eslint/utils";
import { AST_NODE_TYPES } from "@typescript-eslint/typescript-estree";
import invariant from "tiny-invariant";
import { createRule } from "./createRule";
import {
  getTypePackage,
  isAnyType,
  isOneOf,
  resolveTypeReferences,
} from "../utils";
import { mockMethods, mockTypePackageName } from "../const";

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

    return {
      CallExpression(node: TSESTree.CallExpression) {
        let methodName: string | undefined;

        if (maybeReturnValueFunctionCall(node)) {
          const tsFunc = services.esTreeNodeToTSNodeMap.get(node.callee);
          const identType = checker.getTypeAtLocation(tsFunc);
          const [decl] = identType?.symbol?.declarations ?? [];

          const packageName = getTypePackage(decl)?.name;
          if (packageName !== mockTypePackageName) return;

          methodName =
            decl &&
            ts.isArrowFunction(decl) &&
            ts.isPropertyAssignment(decl.parent)
              ? decl.parent.name.getText()
              : undefined;
        } else if (maybeReturnValueMethodCall(node)) {
          const tsObj = services.esTreeNodeToTSNodeMap.get(node.callee.object);
          const objType = checker.getTypeAtLocation(tsObj);
          if (!objType) return;

          const packageName = getTypePackage(objType)?.name;
          if (packageName !== mockTypePackageName) return;

          const tsMeth = services.esTreeNodeToTSNodeMap.get(node.callee);
          methodName = ts.isPropertyAccessExpression(tsMeth)
            ? tsMeth.name.getText()
            : undefined;
        }

        if (!isOneOf(methodName, mockMethods)) return;

        if (node.arguments.length !== 2) return;

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

        const valTsNode = services.esTreeNodeToTSNodeMap.get(valArgNode);
        const valTypeNode = checker.getTypeAtLocation(valTsNode);

        // get type of value (2nd arg of `returnValue` | `impl`)
        let valType: ts.Type | undefined;
        switch (methodName) {
          case "returnValue":
            valType = resolveTypeReferences(valTypeNode, checker);
            break;

          case "impl":
            const fnSignature = checker.getSignaturesOfType(
              valTypeNode,
              ts.SignatureKind.Call
            )[0];
            if (!fnSignature) return;

            valType = resolveTypeReferences(
              checker.getReturnTypeOfSignature(fnSignature),
              checker
            );
            break;

          default:
            return;
        }

        if (valType && isAnyType(valType)) {
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
    isOneOf(node.callee.property.name, mockMethods) &&
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

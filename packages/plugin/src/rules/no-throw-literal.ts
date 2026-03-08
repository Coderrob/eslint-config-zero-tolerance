/**
 * Copyright 2026 Robert Lindley
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { AST_NODE_TYPES, TSESLint, TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../rule-factory';

interface INoThrowLiteralOptions {
  allowThrowingAwaitExpressions?: boolean;
  allowThrowingCallExpressions?: boolean;
  allowThrowingMemberExpressions?: boolean;
}

interface IResolvedNoThrowLiteralOptions {
  allowThrowingAwaitExpressions: boolean;
  allowThrowingCallExpressions: boolean;
  allowThrowingMemberExpressions: boolean;
}

type NoThrowLiteralContext = Readonly<TSESLint.RuleContext<'noThrowLiteral', RuleOptions>>;
type RuleOptions = [INoThrowLiteralOptions];

const DEFAULT_OPTIONS: INoThrowLiteralOptions = {
  allowThrowingAwaitExpressions: false,
  allowThrowingCallExpressions: false,
  allowThrowingMemberExpressions: false,
};

const FUNCTION_BOUNDARY_TYPES = new Set([
  AST_NODE_TYPES.ArrowFunctionExpression,
  AST_NODE_TYPES.FunctionDeclaration,
  AST_NODE_TYPES.FunctionExpression,
]);

/**
 * Checks throw statements and reports disallowed throw argument types.
 *
 * @param context - ESLint rule execution context.
 * @param options - Resolved rule options.
 * @param node - Throw statement node.
 */
function checkThrowStatement(
  context: NoThrowLiteralContext,
  options: IResolvedNoThrowLiteralOptions,
  node: TSESTree.ThrowStatement,
): void {
  const throwArgument = node.argument;
  if (throwArgument === null || isAllowedThrowArgument(throwArgument, options)) {
    return;
  }
  context.report({
    node: throwArgument,
    messageId: 'noThrowLiteral',
    data: { type: formatNodeType(throwArgument.type) },
  });
}

/**
 * Creates listeners for no-throw-literal rule execution.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listeners.
 */
function createNoThrowLiteralListeners(context: NoThrowLiteralContext): TSESLint.RuleListener {
  const options = resolveOptions(context.options);
  return {
    ThrowStatement: checkThrowStatement.bind(undefined, context, options),
  };
}

/**
 * Formats an AST node type for user-facing error messages.
 *
 * @param nodeType - Raw AST node type.
 * @returns Normalized human-readable node type.
 */
function formatNodeType(nodeType: string): string {
  return nodeType
    .replace(/^TS/, '')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .toLowerCase();
}

/**
 * Returns catch parameter name for a catch clause node.
 *
 * @param node - AST node in the ancestry chain.
 * @returns Catch parameter name, or null.
 */
function getCatchParameterName(node: TSESTree.Node): string | null {
  if (node.type !== AST_NODE_TYPES.CatchClause) {
    return null;
  }
  return node.param?.type === AST_NODE_TYPES.Identifier ? node.param.name : null;
}

/**
 * Resolves catch-scope decision while walking ancestor nodes.
 *
 * @param node - Current ancestor node.
 * @param identifierName - Identifier being thrown.
 * @returns Boolean decision, or null when walk should continue.
 */
function getCatchScopeDecision(
  node: TSESTree.Node,
  identifierName: string,
): boolean | null {
  if (isFunctionBoundaryNode(node)) {
    return false;
  }
  const catchParameterName = getCatchParameterName(node);
  return catchParameterName === null ? null : catchParameterName === identifierName;
}

/**
 * Builds throw-node option lookup by node type.
 *
 * @param options - Resolved rule options.
 * @returns Lookup of node type to option-enabled allowance.
 */
function getThrowNodeOptionLookup(options: IResolvedNoThrowLiteralOptions): Map<string, boolean> {
  return new Map([
    [AST_NODE_TYPES.AwaitExpression, options.allowThrowingAwaitExpressions],
    [AST_NODE_TYPES.CallExpression, options.allowThrowingCallExpressions],
    [AST_NODE_TYPES.MemberExpression, options.allowThrowingMemberExpressions],
  ]);
}

/**
 * Returns true when the thrown expression is an acceptable error value.
 *
 * @param node - Throw argument node.
 * @param options - Resolved rule options.
 * @returns True if the throw argument is allowed.
 */
function isAllowedThrowArgument(
  node: TSESTree.Node,
  options: IResolvedNoThrowLiteralOptions,
): boolean {
  if (node.type === AST_NODE_TYPES.NewExpression) {
    return true;
  }
  if (node.type === AST_NODE_TYPES.Identifier) {
    return isCatchParameterIdentifier(node);
  }
  return isOptionAllowedThrowNode(node, options);
}

/**
 * Returns true when an identifier matches the nearest catch parameter in scope.
 *
 * @param node - Identifier node being thrown.
 * @returns True when identifier directly re-throws a catch parameter.
 */
function isCatchParameterIdentifier(node: TSESTree.Identifier): boolean {
  let currentNode: TSESTree.Node | null | undefined = node.parent;
  while (currentNode !== undefined && currentNode !== null) {
    const decision = getCatchScopeDecision(currentNode, node.name);
    if (decision !== null) {
      return decision;
    }
    currentNode = currentNode.parent;
  }
  return false;
}

/**
 * Returns true when a node is a function boundary.
 *
 * @param node - AST node.
 * @returns True when node introduces a new function scope.
 */
function isFunctionBoundaryNode(node: TSESTree.Node): boolean {
  return FUNCTION_BOUNDARY_TYPES.has(node.type);
}

/**
 * Returns true when throw-node allowance is enabled by options.
 *
 * @param node - Throw argument node.
 * @param options - Resolved rule options.
 * @returns True when option-enabled throw node type is allowed.
 */
function isOptionAllowedThrowNode(
  node: TSESTree.Node,
  options: IResolvedNoThrowLiteralOptions,
): boolean {
  const optionLookup = getThrowNodeOptionLookup(options);
  const allowNode = optionLookup.get(node.type);
  return allowNode === undefined ? false : allowNode;
}

/**
 * Resolves allowThrowingAwaitExpressions option.
 *
 * @param options - Raw options.
 * @returns Resolved boolean option value.
 */
function resolveAllowThrowingAwaitExpressions(options: INoThrowLiteralOptions): boolean {
  return resolveBooleanOption(options.allowThrowingAwaitExpressions, false);
}

/**
 * Resolves allowThrowingCallExpressions option.
 *
 * @param options - Raw options.
 * @returns Resolved boolean option value.
 */
function resolveAllowThrowingCallExpressions(options: INoThrowLiteralOptions): boolean {
  return resolveBooleanOption(options.allowThrowingCallExpressions, false);
}

/**
 * Resolves allowThrowingMemberExpressions option.
 *
 * @param options - Raw options.
 * @returns Resolved boolean option value.
 */
function resolveAllowThrowingMemberExpressions(options: INoThrowLiteralOptions): boolean {
  return resolveBooleanOption(options.allowThrowingMemberExpressions, false);
}

/**
 * Resolves a boolean option value with fallback.
 *
 * @param value - Raw option value.
 * @param fallback - Default boolean value.
 * @returns Boolean option value.
 */
function resolveBooleanOption(value: boolean | undefined, fallback: boolean): boolean {
  return value === undefined ? fallback : value;
}

/**
 * Resolves rule options with defaults applied.
 *
 * @param options - Raw rule options.
 * @returns Fully-resolved boolean options.
 */
function resolveOptions(options: RuleOptions): IResolvedNoThrowLiteralOptions {
  const rawOptions = options[0] ?? DEFAULT_OPTIONS;
  return {
    allowThrowingAwaitExpressions: resolveAllowThrowingAwaitExpressions(rawOptions),
    allowThrowingCallExpressions: resolveAllowThrowingCallExpressions(rawOptions),
    allowThrowingMemberExpressions: resolveAllowThrowingMemberExpressions(rawOptions),
  };
}

/**
 * ESLint rule that disallows throwing literals, objects, or templates.
 */
export const noThrowLiteral = createRule({
  name: 'no-throw-literal',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow throwing literals, objects, or templates; always throw a new Error instance',
    },
    messages: {
      noThrowLiteral:
        'Do not throw a {{type}}; throw an Error instance (for example, "throw new Error(message)") instead',
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowThrowingAwaitExpressions: { type: 'boolean' },
          allowThrowingCallExpressions: { type: 'boolean' },
          allowThrowingMemberExpressions: { type: 'boolean' },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [DEFAULT_OPTIONS],
  create: createNoThrowLiteralListeners,
});

export default noThrowLiteral;

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

import type { TSESLint, TSESTree } from '@typescript-eslint/utils';

import { AST_NODE_TYPES } from '@typescript-eslint/utils';

import { findBinding, getArgument, resolveLocalValue } from './support/local-values';

import { readOption } from './support/object-options';

import { createRule } from './support/rule-factory';

import { getCalleeName } from './support/security-ast';

const ERROR_CONSTRUCTORS = new Set([
  'Error',
  'TypeError',
  'RangeError',
  'ReferenceError',
  'SyntaxError',
  'URIError',
  'EvalError',
  'AggregateError',
]);

interface IRequireErrorCauseOptions {
  errorFactoryNames?: readonly string[];
}

type ErrorCauseContext = Readonly<
  TSESLint.RuleContext<'missingCause', [IRequireErrorCauseOptions?]>
>;

type ErrorCreation = TSESTree.NewExpression | TSESTree.CallExpression;

const FUNCTION_BOUNDARIES = new Set([
  AST_NODE_TYPES.FunctionDeclaration,
  AST_NODE_TYPES.FunctionExpression,
  AST_NODE_TYPES.ArrowFunctionExpression,
]);

const AGGREGATE_ERROR = 'AggregateError';

const AGGREGATE_OPTIONS_INDEX = 2;

/**
 * Checks a direct replacement error thrown from a catch block.
 * @param context - ESLint rule context.
 * @param node - AST node to inspect.
 */
function checkThrow(
  context: Readonly<ErrorCauseContext>,
  node: Readonly<TSESTree.ThrowStatement>,
): void {
  const caught = enclosingCatch(node);
  const expression = node.argument;
  if (caught === null || !isErrorCreation(context, expression)) return;
  if (hasPreservedCause(context, expression, caught)) return;
  context.report({ node: expression, messageId: 'missingCause' });
}

/**
 * Creates the throw visitor for error-context preservation.
 * @param context - ESLint rule context.
 * @returns The result of the described check or resolution.
 */
function createListeners(context: Readonly<ErrorCauseContext>): TSESLint.RuleListener {
  return { ThrowStatement: checkThrow.bind(undefined, context) };
}

/**
 * Finds the active catch without crossing a deferred function boundary.
 * @param node - AST node to inspect.
 * @returns The result of the described check or resolution.
 */
function enclosingCatch(node: Readonly<TSESTree.Node>): TSESTree.CatchClause | null {
  const parent = node.parent;
  if (parent == null) return null;
  if (parent.type === AST_NODE_TYPES.CatchClause) return parent;
  return FUNCTION_BOUNDARIES.has(parent.type) ? null : enclosingCatch(parent);
}

/**
 * Returns configured factories accepting the caught exception as an argument.
 * @param context - ESLint rule execution context.
 * @returns The result of the described check or resolution.
 */
function errorFactories(context: Readonly<ErrorCauseContext>): readonly string[] {
  return context.options[0]?.errorFactoryNames ?? [];
}

/**
 * Checks the correct options argument for native Error and AggregateError.
 * @param source - Source code and lexical scopes.
 * @param node - AST node to inspect.
 * @param caught - Catch clause containing the original error.
 * @returns The result of the described check or resolution.
 */
function hasNativeCause(
  source: Readonly<TSESLint.SourceCode>,
  node: Readonly<ErrorCreation>,
  caught: Readonly<TSESTree.CatchClause>,
): boolean {
  const index = getCalleeName(node.callee) === AGGREGATE_ERROR ? AGGREGATE_OPTIONS_INDEX : 1;
  const options = getArgument(node, index);
  return options !== null && isCaughtValue(source, readOption(source, options, 'cause'), caught);
}

/**
 * Checks native options or a configured factory receiving the original exception.
 * @param context - ESLint rule context.
 * @param node - AST node to inspect.
 * @param caught - Catch clause containing the original error.
 * @returns The result of the described check or resolution.
 */
function hasPreservedCause(
  context: Readonly<ErrorCauseContext>,
  node: Readonly<ErrorCreation>,
  caught: Readonly<TSESTree.CatchClause>,
): boolean {
  const name = getCalleeName(node.callee) ?? '';
  if (errorFactories(context).includes(name))
    return node.arguments.some((argument) => isCaughtValue(context.sourceCode, argument, caught));
  return hasNativeCause(context.sourceCode, node, caught);
}

/**
 * Compares lexical bindings, accepting stable aliases of the caught exception.
 * @param source - Source code and lexical scopes.
 * @param node - AST node to inspect.
 * @param caught - Catch clause containing the original error.
 * @returns The result of the described check or resolution.
 */
function isCaughtValue(
  source: Readonly<TSESLint.SourceCode>,
  node: TSESTree.Node | null,
  caught: Readonly<TSESTree.CatchClause>,
): boolean {
  if (node === null || caught.param === null) return false;
  return isSameBinding(source, resolveLocalValue(source, node), caught.param);
}

/** Detects writes that invalidate a subsequent reference to the caught error.
 * @param value - Cause reference or alias capture.
 * @param reference - Reference to the same catch binding.
 * @returns Whether a preceding write may have replaced the exception.
 */
function isEarlierWrite(
  value: Readonly<TSESTree.Identifier>,
  reference: Readonly<TSESLint.Scope.Reference>,
): boolean {
  return (
    reference.isWrite() && reference.init !== true && reference.identifier.range[0] < value.range[0]
  );
}

/**
 * Recognizes native error constructors and explicitly configured factories.
 * @param context - ESLint rule context.
 * @param node - AST node to inspect.
 * @returns The result of the described check or resolution.
 */
function isErrorCreation(
  context: Readonly<ErrorCauseContext>,
  node: Readonly<TSESTree.Expression>,
): node is ErrorCreation {
  if (node.type !== AST_NODE_TYPES.NewExpression && node.type !== AST_NODE_TYPES.CallExpression)
    return false;
  if (node.callee.type !== AST_NODE_TYPES.Identifier) return false;
  return isErrorFactory(context, node.callee);
}

/**
 * Recognizes configured factories and unshadowed native Error bindings.
 * @param context - ESLint rule context.
 * @param callee - Call target to inspect.
 * @returns The result of the described check or resolution.
 */
function isErrorFactory(
  context: Readonly<ErrorCauseContext>,
  callee: Readonly<TSESTree.Identifier>,
): boolean {
  if (errorFactories(context).includes(callee.name)) return true;
  return ERROR_CONSTRUCTORS.has(callee.name) && isGlobalError(context.sourceCode, callee);
}

/**
 * Checks whether a native constructor name is unshadowed.
 * @param source - Source code and lexical scopes.
 * @param node - AST node to inspect.
 * @returns The result of the described check or resolution.
 */
function isGlobalError(
  source: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.Identifier>,
): boolean {
  return (findBinding(source, node)?.defs.length ?? 0) === 0;
}

/** Checks catch identity and writes before the reference or alias capture.
 * @param source - Source code and lexical scopes.
 * @param binding - Binding at the resolved cause reference.
 * @param value - Reference evaluated directly or when capturing an alias.
 * @param caught - Original catch parameter.
 * @returns Whether this reference still denotes the caught exception.
 */
function isOriginalCatchReference(
  source: Readonly<TSESLint.SourceCode>,
  binding: TSESLint.Scope.Variable | null,
  value: Readonly<TSESTree.Identifier>,
  caught: Readonly<TSESTree.Identifier>,
): boolean {
  if (binding === null || binding !== findBinding(source, caught)) return false;
  return !binding.references.some(isEarlierWrite.bind(undefined, value));
}

/**
 * Compares two identifier bindings without accepting shadowed names.
 * @param source - Source code and lexical scopes.
 * @param value - Value being inspected.
 * @param caught - Catch clause containing the original error.
 * @returns The result of the described check or resolution.
 */
function isSameBinding(
  source: Readonly<TSESLint.SourceCode>,
  value: Readonly<TSESTree.Node>,
  caught: Readonly<TSESTree.Node>,
): boolean {
  if (value.type !== AST_NODE_TYPES.Identifier || caught.type !== AST_NODE_TYPES.Identifier)
    return false;
  const binding = findBinding(source, value);
  return isOriginalCatchReference(source, binding, value, caught);
}

/** Requires replacement errors thrown in catch blocks to preserve the original cause. */
export const requireErrorCause = createRule({
  name: 'require-error-cause',
  meta: {
    type: 'problem',
    docs: { description: 'Preserve the caught exception when throwing a replacement error' },
    messages: {
      missingCause:
        'Preserve the caught error with { cause: error }, or pass it to a configured error factory.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          errorFactoryNames: { type: 'array', items: { type: 'string' }, uniqueItems: true },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [],
  create: createListeners,
});

export default requireErrorCause;

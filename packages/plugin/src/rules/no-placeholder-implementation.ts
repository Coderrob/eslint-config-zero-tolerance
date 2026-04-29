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
import { isTestFile } from '../helpers/ast-guards';
import { createRule } from './support/rule-factory';
import { getStaticString, isNullLiteral } from './support/security-ast';

const CONSOLE_OBJECT_NAME = 'console';
const COMMENT_BLOCK_TYPE = 'Block';
const ERROR_CONSTRUCTOR_NAME = 'Error';
const DEFAULT_PLACEHOLDER_TERMS = [
  'TODO',
  'FIXME',
  'not implemented',
  'stub',
  'placeholder',
  'temporary',
  'hack',
];
const CONSOLE_METHODS = ['log', 'warn', 'error', 'info'];

interface INoPlaceholderImplementationOptions {
  allowedTerms?: readonly string[];
  checkComments?: boolean;
  checkTests?: boolean;
}

interface IPlaceholderOptions {
  readonly allowedTerms: readonly string[];
  readonly checkComments: boolean;
  readonly checkTests: boolean;
}

enum NoPlaceholderImplementationMessageId {
  PlaceholderComment = 'placeholderComment',
  PlaceholderImplementation = 'placeholderImplementation',
}

type NoPlaceholderImplementationContext = Readonly<
  TSESLint.RuleContext<
    NoPlaceholderImplementationMessageId,
    [INoPlaceholderImplementationOptions?]
  >
>;

/**
 * Checks console placeholder calls.
 *
 * @param context - ESLint rule execution context.
 * @param options - Normalized rule options.
 * @param node - Call expression to inspect.
 */
function checkConsolePlaceholder(
  context: Readonly<NoPlaceholderImplementationContext>,
  options: Readonly<IPlaceholderOptions>,
  node: Readonly<TSESTree.CallExpression>,
): void {
  if (isSkippedFile(context, options) || !isConsoleCall(node)) {
    return;
  }
  if (hasPlaceholderArgument(options, node)) {
    reportPlaceholder(context, node);
  }
}

/**
 * Checks source comments for placeholder terms.
 *
 * @param context - ESLint rule execution context.
 * @param options - Normalized rule options.
 */
function checkPlaceholderComments(
  context: Readonly<NoPlaceholderImplementationContext>,
  options: Readonly<IPlaceholderOptions>,
): void {
  if (shouldSkipCommentCheck(context, options)) {
    return;
  }
  for (const comment of context.sourceCode.getAllComments()) {
    if (shouldReportComment(options, comment)) {
      context.report({ node: comment, messageId: NoPlaceholderImplementationMessageId.PlaceholderComment });
    }
  }
}

/**
 * Checks return statements for empty placeholder implementations.
 *
 * @param context - ESLint rule execution context.
 * @param options - Normalized rule options.
 * @param node - Return statement to inspect.
 */
function checkPlaceholderReturn(
  context: Readonly<NoPlaceholderImplementationContext>,
  options: Readonly<IPlaceholderOptions>,
  node: Readonly<TSESTree.ReturnStatement>,
): void {
  if (isSkippedFile(context, options) || !isSingleStatementFunctionReturn(node)) {
    return;
  }
  if (isPlaceholderReturnValue(node.argument)) {
    reportPlaceholder(context, node);
  }
}

/**
 * Checks throw statements for placeholder Error messages.
 *
 * @param context - ESLint rule execution context.
 * @param options - Normalized rule options.
 * @param node - Throw statement to inspect.
 */
function checkPlaceholderThrow(
  context: Readonly<NoPlaceholderImplementationContext>,
  options: Readonly<IPlaceholderOptions>,
  node: Readonly<TSESTree.ThrowStatement>,
): void {
  if (!isSkippedFile(context, options) && isPlaceholderError(options, node.argument)) {
    reportPlaceholder(context, node);
  }
}

/**
 * Returns true when text contains a disallowed placeholder term.
 *
 * @param options - Normalized rule options.
 * @param text - Text to inspect.
 * @returns True when a term is present.
 */
function containsPlaceholderTerm(options: Readonly<IPlaceholderOptions>, text: string): boolean {
  const normalizedText = text.toLowerCase();
  for (const term of DEFAULT_PLACEHOLDER_TERMS) {
    if (isDisallowedTerm(options, term, normalizedText)) {
      return true;
    }
  }
  return false;
}

/**
 * Creates listeners for no-placeholder-implementation.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listeners.
 */
function createNoPlaceholderImplementationListeners(
  context: Readonly<NoPlaceholderImplementationContext>,
): TSESLint.RuleListener {
  const options = normalizeOptions(context.options[0]);
  return {
    'Program:exit': checkPlaceholderComments.bind(undefined, context, options),
    CallExpression: checkConsolePlaceholder.bind(undefined, context, options),
    ReturnStatement: checkPlaceholderReturn.bind(undefined, context, options),
    ThrowStatement: checkPlaceholderThrow.bind(undefined, context, options),
  };
}

/**
 * Returns true when a call has any placeholder argument.
 *
 * @param options - Normalized rule options.
 * @param node - Call expression to inspect.
 * @returns True when an argument contains a placeholder.
 */
function hasPlaceholderArgument(
  options: Readonly<IPlaceholderOptions>,
  node: Readonly<TSESTree.CallExpression>,
): boolean {
  for (const argument of node.arguments) {
    if (isPlaceholderNode(options, argument)) {
      return true;
    }
  }
  return false;
}

/**
 * Returns true when a call is a console placeholder call.
 *
 * @param node - Call expression to inspect.
 * @returns True when console method call is used.
 */
function isConsoleCall(node: Readonly<TSESTree.CallExpression>): boolean {
  if (node.callee.type !== AST_NODE_TYPES.MemberExpression) {
    return false;
  }
  return isConsoleObject(node.callee.object) && isConsoleMethod(node.callee.property);
}

/**
 * Returns true when a property is an allowed console method.
 *
 * @param node - Property node to inspect.
 * @returns True when the method is checked.
 */
function isConsoleMethod(node: TSESTree.Expression | TSESTree.PrivateIdentifier): boolean {
  return node.type === AST_NODE_TYPES.Identifier && CONSOLE_METHODS.includes(node.name);
}

/**
 * Returns true when an expression is the console object.
 *
 * @param node - Expression to inspect.
 * @returns True when the node is console.
 */
function isConsoleObject(node: Readonly<TSESTree.Expression>): boolean {
  return node.type === AST_NODE_TYPES.Identifier && node.name === CONSOLE_OBJECT_NAME;
}

/**
 * Returns true when a term is disallowed and present in text.
 *
 * @param options - Normalized rule options.
 * @param term - Placeholder term.
 * @param normalizedText - Lowercase text to inspect.
 * @returns True when the term should report.
 */
function isDisallowedTerm(
  options: Readonly<IPlaceholderOptions>,
  term: string,
  normalizedText: string,
): boolean {
  return !options.allowedTerms.includes(term) && normalizedText.includes(term.toLowerCase());
}

/**
 * Returns true when a comment is documentation rather than implementation.
 *
 * @param comment - Comment node to inspect.
 * @returns True when the comment is a JSDoc-style block.
 */
function isDocumentationComment(comment: Readonly<TSESTree.Comment>): boolean {
  return comment.type === COMMENT_BLOCK_TYPE && comment.value.trimStart().startsWith('*');
}

/**
 * Returns true when an expression is an empty array literal.
 *
 * @param node - Expression to inspect.
 * @returns True when the expression is [].
 */
function isEmptyArray(node: TSESTree.Expression | null): boolean {
  return node?.type === AST_NODE_TYPES.ArrayExpression && node.elements.length === 0;
}

/**
 * Returns true when an expression is an empty object literal.
 *
 * @param node - Expression to inspect.
 * @returns True when the expression is {}.
 */
function isEmptyObject(node: TSESTree.Expression | null): boolean {
  return node?.type === AST_NODE_TYPES.ObjectExpression && node.properties.length === 0;
}

/**
 * Returns true when a constructor expression is Error.
 *
 * @param node - Constructor expression to inspect.
 * @returns True when the constructor is Error.
 */
function isErrorConstructor(node: Readonly<TSESTree.Expression>): boolean {
  return node.type === AST_NODE_TYPES.Identifier && node.name === ERROR_CONSTRUCTOR_NAME;
}

/**
 * Returns true when a block belongs directly to a function body.
 *
 * @param node - Parent node to inspect.
 * @returns True when the node is function-like.
 */
function isFunctionBodyParent(node: Readonly<TSESTree.Node>): boolean {
  return node.type === AST_NODE_TYPES.FunctionDeclaration ||
    node.type === AST_NODE_TYPES.FunctionExpression ||
    node.type === AST_NODE_TYPES.ArrowFunctionExpression;
}

/**
 * Returns true when an expression is `new Error("placeholder")`.
 *
 * @param options - Normalized rule options.
 * @param node - Expression to inspect.
 * @returns True when the expression throws a placeholder error.
 */
function isPlaceholderError(
  options: Readonly<IPlaceholderOptions>,
  node: TSESTree.Expression | null,
): boolean {
  if (node?.type !== AST_NODE_TYPES.NewExpression) {
    return false;
  }
  return isErrorConstructor(node.callee) && isPlaceholderNode(options, node.arguments[0]);
}

/**
 * Returns true when an argument contains a placeholder string.
 *
 * @param options - Normalized rule options.
 * @param node - Argument to inspect.
 * @returns True when a placeholder term is present.
 */
function isPlaceholderNode(
  options: Readonly<IPlaceholderOptions>,
  node: TSESTree.CallExpressionArgument | undefined,
): boolean {
  if (node === undefined || node.type === AST_NODE_TYPES.SpreadElement) {
    return false;
  }
  const value = getStaticString(node);
  return value !== null && containsPlaceholderTerm(options, value);
}

/**
 * Returns true when a return value is an empty stub.
 *
 * @param node - Return expression to inspect.
 * @returns True when the value is null, {}, or [].
 */
function isPlaceholderReturnValue(node: TSESTree.Expression | null): boolean {
  return isNullLiteral(node) || isEmptyObject(node) || isEmptyArray(node);
}

/**
 * Returns true when a return statement is the only body statement.
 *
 * @param node - Return statement to inspect.
 * @returns True when the parent function has no meaningful logic.
 */
function isSingleStatementFunctionReturn(node: Readonly<TSESTree.ReturnStatement>): boolean {
  const parent = node.parent;
  return parent.type === AST_NODE_TYPES.BlockStatement &&
    parent.body.length === 1 &&
    isFunctionBodyParent(parent.parent);
}

/**
 * Returns true when the current filename should be skipped.
 *
 * @param context - ESLint rule execution context.
 * @param options - Normalized rule options.
 * @returns True when test files are exempt.
 */
function isSkippedFile(
  context: Readonly<NoPlaceholderImplementationContext>,
  options: Readonly<IPlaceholderOptions>,
): boolean {
  return !options.checkTests && isTestFile(context.filename);
}

/**
 * Applies default options for the rule.
 *
 * @param options - User supplied options.
 * @returns Normalized rule options.
 */
function normalizeOptions(
  options: INoPlaceholderImplementationOptions | undefined,
): IPlaceholderOptions {
  const fallback: IPlaceholderOptions = {
    allowedTerms: [],
    checkComments: true,
    checkTests: false,
  };
  if (options === undefined) {
    return fallback;
  }
  return normalizeProvidedOptions(options, fallback);
}

/**
 * Applies configured option values over defaults.
 *
 * @param options - User supplied options.
 * @param fallback - Default options.
 * @returns Normalized rule options.
 */
function normalizeProvidedOptions(
  options: Readonly<INoPlaceholderImplementationOptions>,
  fallback: Readonly<IPlaceholderOptions>,
): IPlaceholderOptions {
  return {
    allowedTerms: options.allowedTerms ?? fallback.allowedTerms,
    checkComments: options.checkComments ?? fallback.checkComments,
    checkTests: options.checkTests ?? fallback.checkTests,
  };
}

/**
 * Reports a placeholder implementation.
 *
 * @param context - ESLint rule execution context.
 * @param node - Node to report.
 */
function reportPlaceholder(context: Readonly<NoPlaceholderImplementationContext>, node: Readonly<TSESTree.Node>): void {
  context.report({ node, messageId: NoPlaceholderImplementationMessageId.PlaceholderImplementation });
}

/**
 * Returns true when a comment should be reported.
 *
 * @param options - Normalized rule options.
 * @param comment - Comment node to inspect.
 * @returns True when the comment contains a production placeholder.
 */
function shouldReportComment(options: Readonly<IPlaceholderOptions>, comment: Readonly<TSESTree.Comment>): boolean {
  if (isDocumentationComment(comment)) {
    return false;
  }
  return containsPlaceholderTerm(options, comment.value);
}

/**
 * Returns true when comment checking should be skipped.
 *
 * @param context - ESLint rule execution context.
 * @param options - Normalized rule options.
 * @returns True when comments are disabled or file is skipped.
 */
function shouldSkipCommentCheck(
  context: Readonly<NoPlaceholderImplementationContext>,
  options: Readonly<IPlaceholderOptions>,
): boolean {
  return !options.checkComments || isSkippedFile(context, options);
}

/**
 * ESLint rule that blocks placeholder production implementations.
 */
export const noPlaceholderImplementation = createRule({
  name: 'no-placeholder-implementation',
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow placeholder, stub, TODO, and not implemented production code',
    },
    messages: {
      placeholderComment: 'Placeholder comments are not allowed in production code.',
      placeholderImplementation: 'Placeholder implementations are not allowed in production code.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowedTerms: { type: 'array', items: { type: 'string' } },
          checkComments: { type: 'boolean' },
          checkTests: { type: 'boolean' },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [],
  create: createNoPlaceholderImplementationListeners,
});

export default noPlaceholderImplementation;

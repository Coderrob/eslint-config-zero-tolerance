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
import { createRule } from './support/rule-factory';
import { getCalleeName } from './support/security-ast';

const DEFAULT_VALIDATOR_NAMES = ['parse', 'safeParse', 'validate', 'assertValid'];
const DEFAULT_WRAPPER_NAMES = ['safeJsonParse', 'parseJson'];
const JSON_OBJECT_NAME = 'JSON';
const JSON_PARSE_METHOD_NAME = 'parse';
const UNKNOWN_TYPE_TEXT = 'unknown';

interface INoUnsafeJsonParseOptions {
  allowedWrapperNames?: readonly string[];
  validatorNames?: readonly string[];
}

interface IUnsafeJsonParseOptions {
  readonly allowedWrapperNames: readonly string[];
  readonly validatorNames: readonly string[];
}

enum NoUnsafeJsonParseMessageId {
  ParseAsUnknown = 'parseAsUnknown',
  UnsafeJsonParse = 'unsafeJsonParse',
}

type NoUnsafeJsonParseContext = Readonly<
  TSESLint.RuleContext<NoUnsafeJsonParseMessageId, [INoUnsafeJsonParseOptions?]>
>;

/**
 * Checks assertion expressions around JSON.parse.
 *
 * @param context - ESLint rule execution context.
 * @param node - Assertion expression to inspect.
 */
function checkJsonParseAssertion(
  context: Readonly<NoUnsafeJsonParseContext>,
  node: TSESTree.TSAsExpression | TSESTree.TSTypeAssertion,
): void {
  if (isJsonParseCall(node.expression)) {
    reportUnsafeJsonParse(context, node, createUnknownSuggestion(context.sourceCode, node));
  }
}

/**
 * Checks typed variables initialized from JSON.parse.
 *
 * @param context - ESLint rule execution context.
 * @param node - Variable declarator to inspect.
 */
function checkJsonParseVariable(
  context: Readonly<NoUnsafeJsonParseContext>,
  node: Readonly<TSESTree.VariableDeclarator>,
): void {
  const identifier = getTypedIdentifier(node);
  if (shouldSkipTypedParseVariable(context.sourceCode, identifier)) {
    return;
  }
  if (isJsonParseCall(node.init)) {
    reportUnsafeJsonParse(
      context,
      node.init,
      createTypedVariableSuggestion(context.sourceCode, node),
    );
  }
}

/**
 * Creates listeners for no-unsafe-json-parse.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listeners.
 */
function createNoUnsafeJsonParseListeners(
  context: Readonly<NoUnsafeJsonParseContext>,
): TSESLint.RuleListener {
  normalizeOptions(context.options[0]);
  return {
    TSAsExpression: checkJsonParseAssertion.bind(undefined, context),
    TSTypeAssertion: checkJsonParseAssertion.bind(undefined, context),
    VariableDeclarator: checkJsonParseVariable.bind(undefined, context),
  };
}

/**
 * Creates a suggestion for typed variable declarations.
 *
 * @param sourceCode - ESLint source code helper.
 * @param node - Variable declarator to inspect.
 * @returns Suggestion entries.
 */
function createTypedVariableSuggestion(
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.VariableDeclarator>,
): TSESLint.ReportSuggestionArray<NoUnsafeJsonParseMessageId> {
  return [
    {
      messageId: NoUnsafeJsonParseMessageId.ParseAsUnknown,
      fix: replaceVariableAnnotationWithUnknown.bind(undefined, sourceCode, node),
    },
  ];
}

/**
 * Creates a suggestion for assertion-based variable initializers.
 *
 * @param sourceCode - ESLint source code helper.
 * @param node - Assertion node to inspect.
 * @returns Suggestion entries.
 */
function createUnknownSuggestion(
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: TSESTree.TSAsExpression | TSESTree.TSTypeAssertion,
): TSESLint.ReportSuggestionArray<NoUnsafeJsonParseMessageId> {
  if (!isVariableInitializerAssertion(node)) {
    return [];
  }
  return [
    {
      messageId: NoUnsafeJsonParseMessageId.ParseAsUnknown,
      fix: replaceAssertionWithUnknown.bind(undefined, sourceCode, node),
    },
  ];
}

/**
 * Gets the typed identifier for a variable declarator.
 *
 * @param node - Variable declarator to inspect.
 * @returns The identifier when present.
 */
function getTypedIdentifier(
  node: Readonly<TSESTree.VariableDeclarator>,
): TSESTree.Identifier | null {
  if (node.id.type !== AST_NODE_TYPES.Identifier || node.id.typeAnnotation === undefined) {
    return null;
  }
  return node.id;
}

/**
 * Returns true when an expression is the JSON object.
 *
 * @param node - Expression to inspect.
 * @returns True when the expression is JSON.
 */
function isJsonObject(node: Readonly<TSESTree.Expression>): boolean {
  return node.type === AST_NODE_TYPES.Identifier && node.name === JSON_OBJECT_NAME;
}

/**
 * Returns true when a call invokes JSON.parse directly.
 *
 * @param node - Expression to inspect.
 * @returns True when the expression is JSON.parse(...).
 */
function isJsonParseCall(
  node: TSESTree.Expression | TSESTree.PrivateIdentifier | null,
): node is TSESTree.CallExpression {
  if (node?.type !== AST_NODE_TYPES.CallExpression) {
    return false;
  }
  return isJsonParseCallee(node.callee) && !isValidatorParent(node);
}

/**
 * Returns true when a callee is JSON.parse.
 *
 * @param callee - Callee expression to inspect.
 * @returns True when the callee is JSON.parse.
 */
function isJsonParseCallee(callee: Readonly<TSESTree.Expression>): boolean {
  if (callee.type !== AST_NODE_TYPES.MemberExpression) {
    return false;
  }
  return isJsonObject(callee.object) && getCalleeName(callee) === JSON_PARSE_METHOD_NAME;
}

/**
 * Returns true when a type annotation is unknown.
 *
 * @param sourceCode - ESLint source code helper.
 * @param annotation - Type annotation node to inspect.
 * @returns True when the annotation text is unknown.
 */
function isUnknownAnnotation(
  sourceCode: Readonly<TSESLint.SourceCode>,
  annotation: Readonly<TSESTree.TSTypeAnnotation>,
): boolean {
  return sourceCode.getText(annotation.typeAnnotation).trim() === UNKNOWN_TYPE_TEXT;
}

/**
 * Returns true when a TS as-expression initializes an untyped variable.
 *
 * @param node - Assertion node to inspect.
 * @returns True when the initializer can be suggested.
 */
function isUntypedVariableInitializer(node: Readonly<TSESTree.TSAsExpression>): boolean {
  return (
    node.parent.type === AST_NODE_TYPES.VariableDeclarator &&
    node.parent.init === node &&
    node.parent.id.type === AST_NODE_TYPES.Identifier &&
    node.parent.id.typeAnnotation === undefined
  );
}

/**
 * Returns true when JSON.parse is immediately passed to a validator.
 *
 * @param node - JSON.parse call to inspect.
 * @returns True when a validator call wraps the parse.
 */
function isValidatorParent(node: Readonly<TSESTree.CallExpression>): boolean {
  const parent = node.parent;
  /* istanbul ignore next */
  if (parent.type !== AST_NODE_TYPES.CallExpression) {
    return false;
  }
  const validatorName = getCalleeName(parent.callee);
  /* istanbul ignore next */
  return DEFAULT_VALIDATOR_NAMES.includes(validatorName ?? '');
}

/**
 * Returns true when an assertion is a variable initializer.
 *
 * @param node - Assertion node to inspect.
 * @returns True when the assertion initializes a variable.
 */
function isVariableInitializerAssertion(
  node: TSESTree.TSAsExpression | TSESTree.TSTypeAssertion,
): boolean {
  if (node.type !== AST_NODE_TYPES.TSAsExpression) {
    return false;
  }
  return isUntypedVariableInitializer(node);
}

/**
 * Applies default options for the rule.
 *
 * @param options - User supplied options.
 * @returns Normalized rule options.
 */
function normalizeOptions(options: INoUnsafeJsonParseOptions | undefined): IUnsafeJsonParseOptions {
  /* istanbul ignore next */
  if (options === undefined) {
    return {
      allowedWrapperNames: DEFAULT_WRAPPER_NAMES,
      validatorNames: DEFAULT_VALIDATOR_NAMES,
    };
  }
  return {
    allowedWrapperNames: options.allowedWrapperNames ?? DEFAULT_WRAPPER_NAMES,
    validatorNames: options.validatorNames ?? DEFAULT_VALIDATOR_NAMES,
  };
}

/**
 * Replaces a JSON.parse assertion initializer with an unknown annotation.
 *
 * @param sourceCode - ESLint source code helper.
 * @param node - Assertion node to replace.
 * @param fixer - ESLint fixer.
 * @returns Generated fixes.
 */
function replaceAssertionWithUnknown(
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: TSESTree.TSAsExpression | TSESTree.TSTypeAssertion,
  fixer: Readonly<TSESLint.RuleFixer>,
): TSESLint.RuleFix[] {
  const declarator = node.parent;
  /* istanbul ignore next */
  if (declarator.type !== AST_NODE_TYPES.VariableDeclarator) {
    return [];
  }
  return [
    fixer.insertTextAfter(declarator.id, `: ${UNKNOWN_TYPE_TEXT}`),
    fixer.replaceText(node, sourceCode.getText(node.expression)),
  ];
}

/**
 * Replaces a typed JSON.parse variable annotation with unknown.
 *
 * @param sourceCode - ESLint source code helper.
 * @param node - Variable declarator to update.
 * @param fixer - ESLint fixer.
 * @returns Generated fixes.
 */
function replaceVariableAnnotationWithUnknown(
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.VariableDeclarator>,
  fixer: Readonly<TSESLint.RuleFixer>,
): TSESLint.RuleFix[] {
  const identifier = getTypedIdentifier(node);
  /* istanbul ignore next */
  if (identifier === null || identifier.typeAnnotation === undefined) {
    return [];
  }
  return [fixer.replaceText(identifier.typeAnnotation, `: ${UNKNOWN_TYPE_TEXT}`)];
}

/**
 * Reports unsafe JSON.parse usage.
 *
 * @param context - ESLint rule execution context.
 * @param node - Node to report.
 * @param suggestions - Optional suggestions.
 */
function reportUnsafeJsonParse(
  context: Readonly<NoUnsafeJsonParseContext>,
  node: Readonly<TSESTree.Node>,
  suggestions: Readonly<TSESLint.ReportSuggestionArray<NoUnsafeJsonParseMessageId>>,
): void {
  context.report({
    node,
    messageId: NoUnsafeJsonParseMessageId.UnsafeJsonParse,
    ...(suggestions.length > 0 ? { suggest: suggestions } : {}),
  });
}

/**
 * Returns true when a typed variable cannot be an unsafe typed parse.
 *
 * @param sourceCode - ESLint source code helper.
 * @param identifier - Typed identifier candidate.
 * @returns True when the variable should not report.
 */
function shouldSkipTypedParseVariable(
  sourceCode: Readonly<TSESLint.SourceCode>,
  identifier: TSESTree.Identifier | null,
): boolean {
  if (identifier?.typeAnnotation === undefined) {
    return true;
  }
  return isUnknownAnnotation(sourceCode, identifier.typeAnnotation);
}

/**
 * ESLint rule that blocks typed JSON.parse results without validation.
 */
export const noUnsafeJsonParse = createRule({
  name: 'no-unsafe-json-parse',
  meta: {
    type: 'problem',
    hasSuggestions: true,
    docs: {
      description: 'Disallow treating JSON.parse results as typed data without validation',
    },
    messages: {
      parseAsUnknown: 'Parse JSON as unknown before validating it.',
      unsafeJsonParse: 'JSON.parse results must be validated before being treated as typed data.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          validatorNames: { type: 'array', items: { type: 'string' } },
          allowedWrapperNames: { type: 'array', items: { type: 'string' } },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [],
  create: createNoUnsafeJsonParseListeners,
});

export default noUnsafeJsonParse;

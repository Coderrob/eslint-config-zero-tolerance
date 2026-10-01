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
import { getCallMemberMethodName } from '../helpers/ast-helpers';
import { createRule } from './support/rule-factory';

const BACKSLASH_CODE_POINT = 92;
const BACKSLASH = String.fromCodePoint(BACKSLASH_CODE_POINT);
const DOUBLE_BACKSLASH = `${BACKSLASH}${BACKSLASH}`;
const FIRST_CONTENT_INDEX = 1;
const LAST_CONTENT_INDEX = -1;
const SECOND_TO_LAST_CHARACTER_INDEX = -2;
const INLINE_SNAPSHOT_MATCHERS = new Set([
  'toMatchInlineSnapshot',
  'toThrowErrorMatchingInlineSnapshot',
]);
const KEYWORDS_REQUIRING_SEPARATOR = new Set([
  'await',
  'case',
  'delete',
  'in',
  'instanceof',
  'of',
  'return',
  'throw',
  'typeof',
  'void',
  'yield',
]);
const NONCOMPUTED_KEY_PARENT_TYPES = new Set([
  AST_NODE_TYPES.MethodDefinition,
  AST_NODE_TYPES.Property,
  AST_NODE_TYPES.PropertyDefinition,
  'AccessorProperty',
]);
const RESTRICTED_PARENT_TYPES = new Set([
  AST_NODE_TYPES.ExportAllDeclaration,
  AST_NODE_TYPES.ExportNamedDeclaration,
  AST_NODE_TYPES.ImportDeclaration,
  AST_NODE_TYPES.JSXAttribute,
  AST_NODE_TYPES.TSEnumMember,
  AST_NODE_TYPES.TSExternalModuleReference,
  AST_NODE_TYPES.TSImportType,
  AST_NODE_TYPES.TSLiteralType,
  AST_NODE_TYPES.TSModuleDeclaration,
  'ExportSpecifier',
  'ImportAttribute',
  'ImportSpecifier',
  'TSAbstractAccessorProperty',
  'TSAbstractMethodDefinition',
  'TSAbstractPropertyDefinition',
  'TSPropertySignature',
]);
const TEMPLATE_BACKTICK = '`';
const TEMPLATE_INTERPOLATION_START = '${';
const STRING_RAW_TAG_PREFIX = 'String.raw';

type PreferStringRawContext = Readonly<TSESLint.RuleContext<'preferStringRaw', []>>;

/**
 * Returns replacement text for a `String.raw` tagged template, or null when unsafe.
 *
 * @param sourceCode - ESLint source code helper.
 * @param node - String literal node to transform.
 * @param value - Semantics-preserving raw template contents.
 * @returns Tagged-template replacement text.
 */
function buildStringRawReplacement(
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.StringLiteral>,
  value: string,
): string {
  const separator = shouldAddLeadingSeparator(sourceCode, node) ? ' ' : '';
  return `${separator}${STRING_RAW_TAG_PREFIX}\`${value}\``;
}

/**
 * Checks one string literal and reports when escaped backslashes should use String.raw.
 *
 * @param context - ESLint rule execution context.
 * @param node - Literal node to inspect.
 */
function checkStringLiteral(
  context: Readonly<PreferStringRawContext>,
  node: Readonly<TSESTree.Literal>,
): void {
  if (!isStringLiteral(node)) {
    return;
  }
  const replacementValue = getSafeStringRawValue(context.sourceCode, node);
  if (replacementValue === null) {
    return;
  }
  reportPreferStringRaw(context, node, replacementValue);
}

/**
 * Creates a fixer for literals that should be represented by String.raw.
 *
 * @param sourceCode - ESLint source code helper.
 * @param node - String literal node to transform.
 * @param replacementValue - Semantics-preserving raw template contents.
 * @param fixer - ESLint fixer helper.
 * @returns Rule fix to replace literal with String.raw template.
 */
function createPreferStringRawFix(
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.StringLiteral>,
  replacementValue: string,
  fixer: Readonly<TSESLint.RuleFixer>,
): TSESLint.RuleFix {
  const replacement = buildStringRawReplacement(sourceCode, node, replacementValue);
  return fixer.replaceText(node, replacement);
}

/**
 * Creates listeners for prefer-string-raw rule execution.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listeners.
 */
function createPreferStringRawListeners(
  context: Readonly<PreferStringRawContext>,
): TSESLint.RuleListener {
  return {
    Literal: checkStringLiteral.bind(undefined, context),
  };
}

/**
 * Returns a converted value only when it matches the original runtime value.
 *
 * @param value - Converted raw-template value.
 * @param expectedValue - Original literal runtime value.
 * @returns Converted value, or null when conversion changes behavior.
 */
function getMatchingStringRawValue(value: string, expectedValue: string): string | null {
  return value === expectedValue ? value : null;
}

/**
 * Returns semantics-preserving raw template contents for one literal.
 *
 * @param sourceCode - ESLint source code helper.
 * @param node - String literal node to inspect.
 * @returns Raw template contents, or null when conversion is unsafe.
 */
function getSafeStringRawValue(
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.StringLiteral>,
): string | null {
  if (isStringRawRestricted(node)) {
    return null;
  }
  if (!isSafeStringRawExpression(node)) {
    return null;
  }
  const raw = sourceCode.getText(node);
  if (!isSafeQuotedStringSource(node, raw)) {
    return null;
  }
  const quote = raw.slice(0, FIRST_CONTENT_INDEX);
  const unescaped = unescapeBackslashes(raw.slice(FIRST_CONTENT_INDEX, LAST_CONTENT_INDEX), quote);
  return getMatchingStringRawValue(unescaped, node.value);
}

/**
 * Returns true when a literal source has redundant slash escaping and no raw-template hazards.
 *
 * @param raw - Literal source text.
 * @returns True when redundant backslashes can be removed.
 */
function hasConvertibleBackslashSource(raw: string): boolean {
  if (
    !raw.includes(DOUBLE_BACKSLASH) ||
    raw.slice(SECOND_TO_LAST_CHARACTER_INDEX, LAST_CONTENT_INDEX) === BACKSLASH
  ) {
    return false;
  }
  return !raw.includes(TEMPLATE_BACKTICK) && !raw.includes(TEMPLATE_INTERPOLATION_START);
}

/**
 * Returns true when an AST property-like node uses a computed key.
 *
 * @param node - Property-like parent node.
 * @returns True when its computed flag is explicitly enabled.
 */
function isComputedProperty(node: Readonly<TSESTree.Node>): boolean {
  const computed: unknown = Reflect.get(node, 'computed');
  return typeof computed === 'boolean' && computed;
}

/**
 * Returns true when the literal is an expression-statement directive.
 *
 * @param node - Literal node to inspect.
 * @returns True for directive prologue literals.
 */
function isDirectiveLiteral(node: Readonly<TSESTree.StringLiteral>): boolean {
  const parent = node.parent;
  return (
    parent.type === AST_NODE_TYPES.ExpressionStatement &&
    parent.expression === node &&
    typeof Reflect.get(parent, 'directive') === 'string'
  );
}

/**
 * Returns true when a source character is escaped only for a slash or the active quote.
 *
 * @param current - Current source character.
 * @param next - Following source character.
 * @param quote - Active string quote.
 * @returns True when the escape can be removed in a raw template.
 */
function isEscapedRawCharacter(current: string, next: string | undefined, quote: string): boolean {
  return current === BACKSLASH && (next === BACKSLASH || next === quote);
}

/**
 * Returns true when a literal is the snapshot payload of an inline Jest matcher.
 *
 * @param node - Literal node to inspect.
 * @returns True when the literal must retain its exact source representation.
 */
function isInlineSnapshotArgument(node: Readonly<TSESTree.StringLiteral>): boolean {
  const parent = node.parent;
  if (parent.type !== AST_NODE_TYPES.CallExpression || !parent.arguments.includes(node)) {
    return false;
  }
  const methodName = getCallMemberMethodName(parent);
  return methodName !== null && INLINE_SNAPSHOT_MATCHERS.has(methodName);
}

/**
 * Returns true when source text can be converted without changing its runtime value or grammar.
 *
 * @param node - Literal node to inspect.
 * @param raw - Literal source text.
 * @returns True when a String.raw replacement is safe.
 */
function isSafeQuotedStringSource(node: Readonly<TSESTree.StringLiteral>, raw: string): boolean {
  return hasConvertibleBackslashSource(raw) && node.loc.start.line === node.loc.end.line;
}

/**
 * Returns true when replacing the literal does not alter context-sensitive behavior.
 *
 * @param node - Literal node to inspect.
 * @returns True when the expression context accepts a tagged template replacement.
 */
function isSafeStringRawExpression(node: Readonly<TSESTree.StringLiteral>): boolean {
  return !isInlineSnapshotArgument(node);
}

/**
 * Returns true when a literal node is a string literal.
 *
 * @param node - Literal node to inspect.
 * @returns True when literal value is a string.
 */
function isStringLiteral(node: Readonly<TSESTree.Literal>): node is TSESTree.StringLiteral {
  return typeof node.value === 'string';
}

/**
 * Returns true when expression is the `raw` property identifier.
 *
 * @param node - Member-expression property node.
 * @returns True when property is `raw`.
 */
function isStringRawRestricted(node: Readonly<TSESTree.StringLiteral>): boolean {
  const parent = node.parent;
  if (isDirectiveLiteral(node)) {
    return true;
  }
  if (RESTRICTED_PARENT_TYPES.has(parent.type)) {
    return true;
  }
  return isUncomputedPropertyKey(node);
}

/**
 * Returns true when a literal is a non-computed property key.
 *
 * @param node - Literal node to inspect.
 * @returns True when tagged-template replacement is illegal in the key position.
 */
function isUncomputedPropertyKey(node: Readonly<TSESTree.StringLiteral>): boolean {
  const parent = node.parent;
  return (
    NONCOMPUTED_KEY_PARENT_TYPES.has(parent.type) &&
    Reflect.get(parent, 'key') === node &&
    !isComputedProperty(parent)
  );
}

/**
 * Reports one string literal that should be converted to String.raw.
 *
 * @param context - ESLint rule execution context.
 * @param node - String literal node to report.
 * @param replacementValue - Semantics-preserving raw template contents.
 */
function reportPreferStringRaw(
  context: Readonly<PreferStringRawContext>,
  node: Readonly<TSESTree.StringLiteral>,
  replacementValue: string,
): void {
  context.report({
    node,
    messageId: 'preferStringRaw',
    fix: createPreferStringRawFix.bind(undefined, context.sourceCode, node, replacementValue),
  });
}

/**
 * Returns true when replacing a literal immediately after a keyword needs whitespace.
 *
 * @param sourceCode - ESLint source code helper.
 * @param node - Literal node to inspect.
 * @returns True when a separator must be added before String.raw.
 */
function shouldAddLeadingSeparator(
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.StringLiteral>,
): boolean {
  const previousToken = sourceCode.getTokenBefore(node);
  return (
    previousToken !== null &&
    previousToken.range[1] === node.range[0] &&
    KEYWORDS_REQUIRING_SEPARATOR.has(sourceCode.getText(previousToken))
  );
}

/**
 * Removes only redundant source escapes for backslashes and the active quote character.
 *
 * @param text - Literal source text without surrounding quotes.
 * @param quote - Quote character used by the literal.
 * @returns Candidate String.raw template contents.
 */
function unescapeBackslashes(text: string, quote: string): string {
  let result = '';
  for (let index = 0; index < text.length; index += 1) {
    const current = text[index];
    const next = text[index + 1];
    if (isEscapedRawCharacter(current, next, quote)) {
      result += next;
      index += 1;
    } else {
      result += current;
    }
  }
  return result;
}

/**
 * ESLint rule that prefers String.raw for literals containing escaped backslashes.
 */
export const preferStringRaw = createRule({
  name: 'prefer-string-raw',
  meta: {
    type: 'suggestion',
    fixable: 'code',
    docs: {
      description:
        'Prefer String.raw for string literals containing escaped backslashes (Sonar S7780)',
    },
    messages: {
      preferStringRaw: 'String.raw should be used to avoid escaping backslashes',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createPreferStringRawListeners,
});

export default preferStringRaw;

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
import { getStaticString } from './support/security-ast';

const DEFAULT_ALLOWED_PATTERNS = ['test-', 'dummy', 'example', 'fake', 'placeholder'];
const DEFAULT_MINIMUM_SECRET_LENGTH = 16;
const MESSAGES_PROPERTY_NAME = 'messages';
const SECRET_NAME_PATTERN =
  /(?:password|passwd|secret|token|apiKey|accessKey|privateKey|clientSecret|connectionString)/iu;
const PRIVATE_KEY_PATTERN = /BEGIN [A-Z ]*PRIVATE KEY/iu;
const JWT_PATTERN = /^[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}$/u;
const API_KEY_PATTERN = /^(?:sk_|ghp_|gho_|xox[baprs]-|AKIA)[A-Za-z0-9_-]{12,}$/u;
const CREDENTIAL_URL_PATTERN = /^[a-z][a-z0-9+.-]*:\/\/[^:@\s]+:[^@\s]+@/iu;

interface INoHardcodedSecretsOptions {
  allowedPatterns?: readonly string[];
  checkTests?: boolean;
  minimumSecretLength?: number;
}

enum NoHardcodedSecretsMessageId {
  HardcodedSecret = 'hardcodedSecret',
}

type NoHardcodedSecretsContext = Readonly<
  TSESLint.RuleContext<NoHardcodedSecretsMessageId, [INoHardcodedSecretsOptions?]>
>;

interface IHardcodedSecretsOptions {
  readonly allowedPatterns: readonly string[];
  readonly checkTests: boolean;
  readonly minimumSecretLength: number;
}

/**
 * Checks static string expressions for hardcoded secrets.
 *
 * @param context - ESLint rule execution context.
 * @param options - Normalized rule options.
 * @param node - Expression to inspect.
 */
function checkStaticSecretExpression(
  context: Readonly<NoHardcodedSecretsContext>,
  options: Readonly<IHardcodedSecretsOptions>,
  node: Readonly<TSESTree.Expression>,
): void {
  if (isSkippedFile(context, options)) {
    return;
  }
  const value = getStaticString(node);
  if (value !== null && isSecretValue(options, node, value)) {
    context.report({ node, messageId: NoHardcodedSecretsMessageId.HardcodedSecret });
  }
}

/**
 * Creates listeners for no-hardcoded-secrets.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listeners.
 */
function createNoHardcodedSecretsListeners(
  context: Readonly<NoHardcodedSecretsContext>,
): TSESLint.RuleListener {
  const options = normalizeOptions(context.options[0]);
  return {
    Literal: checkStaticSecretExpression.bind(undefined, context, options),
    TemplateLiteral: checkStaticSecretExpression.bind(undefined, context, options),
  };
}

/**
 * Gets a sensitive assignment name associated with a literal.
 *
 * @param node - Literal expression to inspect.
 * @returns The assignment name when one is available.
 */
function getSensitiveAssignmentName(node: Readonly<TSESTree.Expression>): string | null {
  const parent = node.parent;
  if (isIdentifierVariableDeclarator(parent)) {
    return parent.id.name;
  }
  if (isRuleMessageProperty(parent)) {
    return null;
  }
  if (isIdentifierProperty(parent)) {
    return parent.key.name;
  }
  return null;
}

/**
 * Returns true when a configured allowed pattern matches the value.
 *
 * @param options - Normalized rule options.
 * @param value - Static string value.
 * @returns True when the value is an allowed placeholder.
 */
function isAllowedSecretPlaceholder(
  options: Readonly<IHardcodedSecretsOptions>,
  value: string,
): boolean {
  const normalizedValue = value.toLowerCase();
  for (const pattern of options.allowedPatterns) {
    if (normalizedValue.includes(pattern.toLowerCase())) {
      return true;
    }
  }
  return false;
}

/**
 * Returns true when the value appears in a process.env fallback expression.
 *
 * @param node - Literal expression to inspect.
 * @returns True when the literal is a default for process.env.
 */
function isEnvFallback(node: Readonly<TSESTree.Expression>): boolean {
  const parent = node.parent;
  if (parent.type !== AST_NODE_TYPES.LogicalExpression) {
    return false;
  }
  return (
    parent.left.type === AST_NODE_TYPES.MemberExpression &&
    parent.left.object.type === AST_NODE_TYPES.MemberExpression
  );
}

/**
 * Returns true when a parent node is an identifier property.
 *
 * @param node - Parent node to inspect.
 * @returns True when the property key is an identifier.
 */
function isIdentifierProperty(
  node: Readonly<TSESTree.Node>,
): node is TSESTree.Property & { key: TSESTree.Identifier } {
  return node.type === AST_NODE_TYPES.Property && node.key.type === AST_NODE_TYPES.Identifier;
}

/**
 * Returns true when a parent node is an identifier variable declarator.
 *
 * @param node - Parent node to inspect.
 * @returns True when the declarator id is an identifier.
 */
function isIdentifierVariableDeclarator(
  node: Readonly<TSESTree.Node>,
): node is TSESTree.VariableDeclarator & { id: TSESTree.Identifier } {
  return (
    node.type === AST_NODE_TYPES.VariableDeclarator && node.id.type === AST_NODE_TYPES.Identifier
  );
}

/**
 * Returns true when a value should be ignored before contextual checks.
 *
 * @param options - Normalized rule options.
 * @param value - Static string value.
 * @returns True when the value is empty or allowed.
 */
function isIgnoredSecretValue(options: Readonly<IHardcodedSecretsOptions>, value: string): boolean {
  return value.length === 0 || isAllowedSecretPlaceholder(options, value);
}

/**
 * Returns true when a property key is the ESLint messages map.
 *
 * @param node - Property node to inspect.
 * @returns True when the property is named messages.
 */
function isMessagesProperty(node: Readonly<TSESTree.Property>): boolean {
  return node.key.type === AST_NODE_TYPES.Identifier && node.key.name === MESSAGES_PROPERTY_NAME;
}

/**
 * Returns true when a property belongs to an ESLint rule message map.
 *
 * @param node - Parent node to inspect.
 * @returns True when the literal is a diagnostic message.
 */
function isRuleMessageProperty(node: Readonly<TSESTree.Node>): boolean {
  return (
    node.type === AST_NODE_TYPES.Property &&
    node.parent.type === AST_NODE_TYPES.ObjectExpression &&
    node.parent.parent.type === AST_NODE_TYPES.Property &&
    isMessagesProperty(node.parent.parent)
  );
}

/**
 * Returns true when a value matches secret patterns.
 *
 * @param options - Normalized rule options.
 * @param node - Literal expression to inspect.
 * @param value - Static string value.
 * @returns True when the value should be reported.
 */
function isSecretValue(
  options: Readonly<IHardcodedSecretsOptions>,
  node: Readonly<TSESTree.Expression>,
  value: string,
): boolean {
  if (isStrongSecretPattern(value)) {
    return true;
  }
  if (isIgnoredSecretValue(options, value)) {
    return false;
  }
  return isSensitiveLongValue(options, node, value);
}

/**
 * Returns true when a literal is assigned to a sensitive name.
 *
 * @param node - Literal expression to inspect.
 * @returns True when the surrounding assignment name is sensitive.
 */
function isSensitiveAssignment(node: Readonly<TSESTree.Expression>): boolean {
  return SECRET_NAME_PATTERN.test(getSensitiveAssignmentName(node) ?? '');
}

/**
 * Returns true when a long value appears in a sensitive context.
 *
 * @param options - Normalized rule options.
 * @param node - Literal expression to inspect.
 * @param value - Static string value.
 * @returns True when the contextual secret check matches.
 */
function isSensitiveLongValue(
  options: Readonly<IHardcodedSecretsOptions>,
  node: Readonly<TSESTree.Expression>,
  value: string,
): boolean {
  return (
    value.length >= options.minimumSecretLength &&
    (isSensitiveAssignment(node) || isEnvFallback(node))
  );
}

/**
 * Returns true when the current filename should be skipped.
 *
 * @param context - ESLint rule execution context.
 * @param options - Normalized rule options.
 * @returns True when test files are exempt.
 */
function isSkippedFile(
  context: Readonly<NoHardcodedSecretsContext>,
  options: Readonly<IHardcodedSecretsOptions>,
): boolean {
  return !options.checkTests && isTestFile(context.filename);
}

/**
 * Returns true when a value matches high-confidence secret formats.
 *
 * @param value - Static string value.
 * @returns True when the value matches a known credential format.
 */
function isStrongSecretPattern(value: string): boolean {
  return (
    PRIVATE_KEY_PATTERN.test(value) ||
    JWT_PATTERN.test(value) ||
    API_KEY_PATTERN.test(value) ||
    CREDENTIAL_URL_PATTERN.test(value)
  );
}

/**
 * Applies default options for the rule.
 *
 * @param options - User supplied options.
 * @returns Normalized rule options.
 */
function normalizeOptions(
  options: INoHardcodedSecretsOptions | undefined,
): IHardcodedSecretsOptions {
  const fallback: IHardcodedSecretsOptions = {
    allowedPatterns: DEFAULT_ALLOWED_PATTERNS,
    checkTests: false,
    minimumSecretLength: DEFAULT_MINIMUM_SECRET_LENGTH,
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
  options: Readonly<INoHardcodedSecretsOptions>,
  fallback: Readonly<IHardcodedSecretsOptions>,
): IHardcodedSecretsOptions {
  return {
    allowedPatterns: options.allowedPatterns ?? fallback.allowedPatterns,
    checkTests: options.checkTests ?? fallback.checkTests,
    minimumSecretLength: options.minimumSecretLength ?? fallback.minimumSecretLength,
  };
}

/**
 * ESLint rule that blocks hardcoded credentials and secret-looking literals.
 */
export const noHardcodedSecrets = createRule({
  name: 'no-hardcoded-secrets',
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow hardcoded secrets, credentials, tokens, and secret env defaults',
    },
    messages: {
      hardcodedSecret: 'Hardcoded secrets or credentials are not allowed.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowedPatterns: { type: 'array', items: { type: 'string' } },
          checkTests: { type: 'boolean' },
          minimumSecretLength: { type: 'number' },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [],
  create: createNoHardcodedSecretsListeners,
});

export default noHardcodedSecrets;

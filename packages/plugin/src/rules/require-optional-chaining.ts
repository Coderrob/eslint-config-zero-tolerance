import { AST_NODE_TYPES, ESLintUtils, TSESLint, TSESTree } from '@typescript-eslint/utils';
import { RULE_CREATOR_URL } from '../constants';

const createRule = ESLintUtils.RuleCreator((name) => `${RULE_CREATOR_URL}${name}`);
const LOGICAL_AND_OPERATOR = '&&';
const MEMBER_DOT_PREFIX = '.';
const MEMBER_COMPUTED_PREFIX = '[';
const CALL_PREFIX = '(';
const SIMPLE_GUARD_NODE_TYPES = new Set([
  AST_NODE_TYPES.Identifier,
  AST_NODE_TYPES.ThisExpression,
  AST_NODE_TYPES.Super,
]);

/**
 * Returns inner expression for supported wrapper node types.
 *
 * @param expression - The expression to inspect.
 * @returns The wrapped inner expression or null when not wrapped.
 */
function getWrappedExpression(expression: TSESTree.Expression): TSESTree.Expression | null {
  if (expression.type === AST_NODE_TYPES.ChainExpression) {
    return expression.expression;
  }
  if (expression.type === AST_NODE_TYPES.TSAsExpression) {
    return expression.expression;
  }
  return null;
}

/**
 * Returns the unwrapped expression for chain/parenthesized wrappers.
 *
 * @param expression - The expression to unwrap.
 * @returns The inner expression when wrapped; otherwise the original node.
 */
function unwrapExpression(expression: TSESTree.Expression): TSESTree.Expression {
  const wrappedExpression = getWrappedExpression(expression);
  if (wrappedExpression !== null) {
    return unwrapExpression(wrappedExpression);
  }
  return expression;
}

/**
 * Returns true when a computed property key is side-effect-free.
 * Only identifier names and string/number literal values qualify;
 * call expressions or other dynamic keys may produce side effects and
 * must not be auto-fixed. RegExp, BigInt, and boolean literals are
 * excluded as they are not idiomatic computed property keys.
 *
 * @param property - The computed property expression or private identifier.
 * @returns True when the key is safe to use in an auto-fix.
 */
function isSafeComputedKey(property: TSESTree.Expression | TSESTree.PrivateIdentifier): boolean {
  if (property.type === AST_NODE_TYPES.Identifier) {
    return true;
  }
  if (property.type === AST_NODE_TYPES.Literal) {
    return typeof property.value === 'string' || typeof property.value === 'number';
  }
  return false;
}

/**
 * Returns true when a MemberExpression is safe as a guard.
 *
 * @param node - The MemberExpression node.
 * @returns True when safe.
 */
function isSafeMemberExpression(node: TSESTree.MemberExpression): boolean {
  let isSafe = true;
  if (node.computed) {
    isSafe = isSafeComputedKey(node.property);
  }
  if (!isSafe) {
    return false;
  }
  return isSafeGuardExpression(node.object);
}

/**
 * Returns true when expression kind is safe as an optional-chaining guard.
 *
 * @param expression - The guard expression to validate.
 * @returns True when the expression is a safe guard candidate.
 */
function isSafeGuardExpression(expression: TSESTree.Expression): boolean {
  const node = unwrapExpression(expression);
  if (SIMPLE_GUARD_NODE_TYPES.has(node.type)) {
    return true;
  }
  if (node.type === AST_NODE_TYPES.MemberExpression) {
    return isSafeMemberExpression(node);
  }
  return false;
}

/**
 * Creates replacement text by inserting `?` between guard and guarded access/call.
 *
 * @param leftText - Source text for the guard expression.
 * @param rightText - Source text for the guarded expression.
 * @returns Optional-chained replacement text, or null when not derivable.
 */
function buildOptionalChainReplacement(leftText: string, rightText: string): string | null {
  if (!rightText.startsWith(leftText)) {
    return null;
  }
  return buildOptionalChainFromSuffix(leftText, rightText.slice(leftText.length).trimStart());
}

/**
 * Returns optional-chain replacement when suffix is a supported access/call pattern.
 *
 * @param leftText - Source text for the guard expression.
 * @param suffix - Right-side suffix after removing the guard prefix.
 * @returns Optional-chain replacement text, or null if unsupported.
 */
function buildOptionalChainFromSuffix(leftText: string, suffix: string): string | null {
  if (suffix.startsWith(MEMBER_DOT_PREFIX)) {
    return `${leftText}?.${suffix.slice(1)}`;
  }
  if (suffix.startsWith(MEMBER_COMPUTED_PREFIX) || suffix.startsWith(CALL_PREFIX)) {
    return `${leftText}?.${suffix}`;
  }
  return null;
}

/**
 * Returns fixer text for logical guard patterns that can use optional chaining.
 *
 * @param node - Logical expression to analyze.
 * @param sourceCode - ESLint source code object.
 * @returns Replacement code, or null when no rewrite is applicable.
 */
function getOptionalChainReplacement(
  node: TSESTree.LogicalExpression,
  sourceCode: Readonly<TSESLint.SourceCode>,
): string | null {
  if (node.operator !== LOGICAL_AND_OPERATOR) {
    return null;
  }
  const left = unwrapExpression(node.left);
  if (!isSafeGuardExpression(left)) {
    return null;
  }
  return buildOptionalChainReplacement(sourceCode.getText(left), sourceCode.getText(node.right));
}

/**
 * ESLint rule that requires optional chaining for guard-access patterns.
 */
export const requireOptionalChaining = createRule({
  name: 'require-optional-chaining',
  meta: {
    type: 'suggestion',
    fixable: 'code',
    docs: {
      description: 'Require optional chaining instead of repeated logical guard access',
    },
    messages: {
      useOptionalChaining: 'Use optional chaining instead of repeating the same guard expression',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;

    /**
     * Reports logical `&&` guard patterns that can be optional chained.
     *
     * @param node - The logical expression node to evaluate.
     */
    const checkLogicalExpression = (node: TSESTree.LogicalExpression): void => {
      const replacement = getOptionalChainReplacement(node, sourceCode);
      if (replacement === null) {
        return;
      }

      context.report({
        node,
        messageId: 'useOptionalChaining',
        fix(fixer: TSESLint.RuleFixer) {
          return fixer.replaceText(node, replacement);
        },
      });
    };

    return {
      LogicalExpression: checkLogicalExpression,
    };
  },
});

export default requireOptionalChaining;

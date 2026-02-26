import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/Coderrob/eslint-config-zero-tolerance#${name}`
);

const COMPARISON_OPERATORS = new Set(['===', '!==', '==', '!=']);

/**
 * Returns true when the string literal appears on either side of a
 * comparison expression, which is the primary location where magic strings
 * cause readability and maintenance problems.
 */
function isInComparisonExpression(node: TSESTree.Literal): boolean {
  if (node.parent?.type !== 'BinaryExpression') {
    return false;
  }
  return COMPARISON_OPERATORS.has(
    (node.parent as TSESTree.BinaryExpression).operator
  );
}

/**
 * Returns true when the string literal is the test value of a switch-case
 * clause, another common location for magic strings.
 */
function isInSwitchCase(node: TSESTree.Literal): boolean {
  return (
    node.parent?.type === 'SwitchCase' &&
    (node.parent as TSESTree.SwitchCase).test === node
  );
}

export const noMagicStrings = createRule({
  name: 'no-magic-strings',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow magic strings in comparisons and switch cases; use named constants instead',
    },
    messages: {
      noMagicStrings:
        'Magic string "{{value}}" is not allowed; extract it into a named constant',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      Literal(node) {
        if (typeof node.value !== 'string' || node.value === '') {
          return;
        }
        const stringNode = node as TSESTree.Literal;
        if (
          !isInComparisonExpression(stringNode) &&
          !isInSwitchCase(stringNode)
        ) {
          return;
        }
        context.report({
          node,
          messageId: 'noMagicStrings',
          data: { value: node.value },
        });
      },
    };
  },
});

export default noMagicStrings;

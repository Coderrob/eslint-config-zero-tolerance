import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/Coderrob/eslint-config-zero-tolerance#${name}`
);

const CHECKED_BINARY_OPERATORS = new Set(['===', '!==', '==', '!=', '&&', '||', '??', '+', '-', '/', '%']);

export const noIdenticalExpressions = createRule({
  name: 'no-identical-expressions',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow identical expressions on both sides of a binary or logical operator (Sonar S1764)',
      recommended: 'recommended',
    },
    messages: {
      identicalExpressions:
        'Identical expressions on both sides of "{{operator}}" are always a bug; check for a copy-paste error',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    function checkExpression(node: TSESTree.BinaryExpression | TSESTree.LogicalExpression): void {
      if (!CHECKED_BINARY_OPERATORS.has(node.operator)) {
        return;
      }
      const leftText = context.getSourceCode().getText(node.left);
      const rightText = context.getSourceCode().getText(node.right);
      if (leftText === rightText) {
        context.report({
          node,
          messageId: 'identicalExpressions',
          data: { operator: node.operator },
        });
      }
    }

    return {
      BinaryExpression: checkExpression,
      LogicalExpression: checkExpression,
    };
  },
});

export default noIdenticalExpressions;

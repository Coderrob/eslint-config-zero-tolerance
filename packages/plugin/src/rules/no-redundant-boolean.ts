import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/Coderrob/eslint-config-zero-tolerance#${name}`
);

/** Returns true when the node is a boolean literal (true or false). */
function isBooleanLiteral(node: TSESTree.Node): boolean {
  return node.type === 'Literal' && typeof (node as TSESTree.Literal).value === 'boolean';
}

export const noRedundantBoolean = createRule({
  name: 'no-redundant-boolean',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow redundant comparisons to boolean literals (Sonar S1125)',
      recommended: 'recommended',
    },
    messages: {
      redundantBoolean:
        'Redundant comparison to a boolean literal; use the value directly or negate it with "!"',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      BinaryExpression(node) {
        if (node.operator !== '===' && node.operator !== '!==') {
          return;
        }
        if (isBooleanLiteral(node.left) || isBooleanLiteral(node.right)) {
          context.report({ node, messageId: 'redundantBoolean' });
        }
      },
    };
  },
});

export default noRedundantBoolean;

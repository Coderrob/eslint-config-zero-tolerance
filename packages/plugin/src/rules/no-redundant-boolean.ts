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
    fixable: 'code',
    docs: {
      description:
        'Disallow redundant comparisons to boolean literals (Sonar S1125)',
    },
    messages: {
      redundantBoolean:
        'Redundant comparison to a boolean literal; use the value directly or negate it with "!"',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;

    const getNonLiteralSide = (
      node: TSESTree.BinaryExpression
    ): TSESTree.Expression | null => {
      if (isBooleanLiteral(node.left)) {
        return node.right;
      }
      if (isBooleanLiteral(node.right) && node.left.type !== 'PrivateIdentifier') {
        return node.left;
      }
      return null;
    };

    const getBooleanLiteralValue = (node: TSESTree.BinaryExpression): boolean | null => {
      if (isBooleanLiteral(node.left)) {
        return Boolean((node.left as TSESTree.Literal).value);
      }
      if (isBooleanLiteral(node.right)) {
        return Boolean((node.right as TSESTree.Literal).value);
      }
      return null;
    };

    return {
      BinaryExpression(node) {
        if (node.operator !== '===' && node.operator !== '!==') {
          return;
        }
        if (isBooleanLiteral(node.left) || isBooleanLiteral(node.right)) {
          const nonLiteralSide = getNonLiteralSide(node);
          const literalValue = getBooleanLiteralValue(node);

          context.report({
            node,
            messageId: 'redundantBoolean',
            fix:
              nonLiteralSide !== null && literalValue !== null
                ? (fixer) => {
                    const shouldNegate =
                      (node.operator === '===' && literalValue === false) ||
                      (node.operator === '!==' && literalValue === true);
                    const expressionText = sourceCode.getText(nonLiteralSide);
                    const replacement = shouldNegate
                      ? `!(${expressionText})`
                      : expressionText;
                    return fixer.replaceText(node, replacement);
                  }
                : null,
          });
        }
      },
    };
  },
});

export default noRedundantBoolean;

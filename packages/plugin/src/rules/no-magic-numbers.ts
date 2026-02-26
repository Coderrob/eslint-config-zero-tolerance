import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/Coderrob/eslint-config-zero-tolerance#${name}`
);

/**
 * Returns true when a numeric literal has one of the universally-understood
 * values that do not require a named constant: 0, 1, or -1.
 */
function isAllowedValue(node: TSESTree.Literal): boolean {
  // -1 is represented as UnaryExpression('-', Literal(1))
  if (
    node.value === 1 &&
    node.parent?.type === 'UnaryExpression' &&
    (node.parent as TSESTree.UnaryExpression).operator === '-'
  ) {
    return true;
  }
  return node.value === 0 || node.value === 1;
}

/**
 * Returns true when the numeric literal is the direct initialiser of a
 * `const` variable declaration, making it a named constant.
 */
function isInConstDeclaration(node: TSESTree.Literal): boolean {
  let current: TSESTree.Node = node;
  if (
    current.parent?.type === 'UnaryExpression' &&
    (current.parent as TSESTree.UnaryExpression).operator === '-'
  ) {
    current = current.parent;
  }
  if (current.parent?.type !== 'VariableDeclarator') {
    return false;
  }
  const declaration = current.parent.parent;
  return (
    declaration?.type === 'VariableDeclaration' &&
    (declaration as TSESTree.VariableDeclaration).kind === 'const'
  );
}

/**
 * Returns true when the numeric literal is the initialiser of a TypeScript
 * enum member, which gives it an implicit name.
 */
function isInEnumMember(node: TSESTree.Literal): boolean {
  return node.parent?.type === 'TSEnumMember';
}

export const noMagicNumbers = createRule({
  name: 'no-magic-numbers',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow magic numbers; use named constants instead of raw numeric literals',
    },
    messages: {
      noMagicNumbers:
        'Magic number {{value}} is not allowed; extract it into a named constant',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;
    return {
      Literal(node) {
        if (typeof node.value !== 'number') {
          return;
        }
        const numericNode = node as TSESTree.Literal;
        if (isAllowedValue(numericNode)) {
          return;
        }
        if (isInConstDeclaration(numericNode)) {
          return;
        }
        if (isInEnumMember(numericNode)) {
          return;
        }
        const rawValue = numericNode.raw ?? sourceCode.getText(numericNode);
        context.report({
          node,
          messageId: 'noMagicNumbers',
          data: { value: rawValue },
        });
      },
    };
  },
});

export default noMagicNumbers;

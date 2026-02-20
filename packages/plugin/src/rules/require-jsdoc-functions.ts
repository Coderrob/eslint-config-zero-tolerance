import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/Coderrob/eslint-config-zero-tolerance#${name}`
);

type FunctionNode =
  | TSESTree.FunctionDeclaration
  | TSESTree.FunctionExpression
  | TSESTree.ArrowFunctionExpression;

const TEST_FILE_PATTERN = /\.(test|spec)\.[jt]sx?$/;

export const requireJsdocFunctions = createRule({
  name: 'require-jsdoc-functions',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require JSDoc comments on all functions (except in test files)',
      recommended: 'recommended',
    },
    messages: {
      missingJsdoc: 'Function "{{name}}" is missing a JSDoc comment',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const filename = context.getFilename();

    if (TEST_FILE_PATTERN.test(filename)) {
      return {};
    }

    function getFunctionName(node: FunctionNode): string {
      if (node.type === 'FunctionDeclaration' && node.id) {
        return node.id.name;
      }
      if (
        node.parent &&
        node.parent.type === 'VariableDeclarator' &&
        node.parent.id &&
        node.parent.id.type === 'Identifier'
      ) {
        return node.parent.id.name;
      }
      if (
        node.parent &&
        node.parent.type === 'MethodDefinition' &&
        node.parent.key &&
        node.parent.key.type === 'Identifier'
      ) {
        return node.parent.key.name;
      }
      if (
        node.parent &&
        node.parent.type === 'Property' &&
        node.parent.key &&
        node.parent.key.type === 'Identifier'
      ) {
        return node.parent.key.name;
      }
      return '<anonymous>';
    }

    function hasJsdocComment(node: TSESTree.Node): boolean {
      const sourceCode = context.getSourceCode();
      const comments = sourceCode.getCommentsBefore(node);
      return comments.some((comment) => comment.type === 'Block' && comment.value.startsWith('*'));
    }

    function getTargetNode(node: FunctionNode): TSESTree.Node {
      if (node.parent?.type === 'MethodDefinition') {
        return node.parent;
      }
      if (
        node.parent?.type === 'VariableDeclarator' &&
        node.parent.parent?.type === 'VariableDeclaration'
      ) {
        return node.parent.parent;
      }
      if (node.parent?.type === 'Property') {
        return node.parent;
      }
      return node;
    }

    function checkFunction(node: FunctionNode): void {
      const name = getFunctionName(node);
      const targetNode = getTargetNode(node);

      if (!hasJsdocComment(targetNode)) {
        context.report({
          node,
          messageId: 'missingJsdoc',
          data: { name },
        });
      }
    }

    return {
      FunctionDeclaration: checkFunction,
      FunctionExpression: checkFunction,
      ArrowFunctionExpression: checkFunction,
    };
  },
});

export default requireJsdocFunctions;

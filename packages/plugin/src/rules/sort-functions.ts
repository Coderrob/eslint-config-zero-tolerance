import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/Coderrob/eslint-config-zero-tolerance#${name}`
);

export const sortFunctions = createRule({
  name: 'sort-functions',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require top-level functions to be sorted alphabetically',
    },
    messages: {
      unsortedFunction: 'Function "{{current}}" should come before "{{previous}}"',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    type SortableFunctionNode = TSESTree.FunctionDeclaration | TSESTree.VariableDeclarator;
    type SortableFunction = {
      name: string;
      node: SortableFunctionNode;
    };

    const functions: SortableFunction[] = [];

    const isTopLevelVariableDeclaration = (node: TSESTree.VariableDeclaration): boolean => {
      return (
        node.parent.type === 'Program' ||
        (node.parent.type === 'ExportNamedDeclaration' && node.parent.parent.type === 'Program')
      );
    };

    return {
      FunctionDeclaration(node) {
        const isTopLevelFunction =
          node.parent.type === 'Program' ||
          (node.parent.type === 'ExportNamedDeclaration' && node.parent.parent.type === 'Program');

        if (isTopLevelFunction && node.id !== null) {
          functions.push({ name: node.id.name, node });
        }
      },
      VariableDeclaration(node) {
        if (!isTopLevelVariableDeclaration(node)) {
          return;
        }

        for (const declaration of node.declarations) {
          if (declaration.id.type !== 'Identifier') {
            continue;
          }

          if (
            declaration.init?.type !== 'ArrowFunctionExpression' &&
            declaration.init?.type !== 'FunctionExpression'
          ) {
            continue;
          }

          functions.push({ name: declaration.id.name, node: declaration });
        }
      },
      'Program:exit'() {
        for (let i = 1; i < functions.length; i++) {
          const previous = functions[i - 1].name;
          const current = functions[i].name;
          if (current.toLowerCase() < previous.toLowerCase()) {
            context.report({
              node: functions[i].node,
              messageId: 'unsortedFunction',
              data: { current, previous },
            });
          }
        }
      },
    };
  },
});

export default sortFunctions;

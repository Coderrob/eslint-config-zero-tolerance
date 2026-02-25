import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/Coderrob/eslint-config-zero-tolerance#${name}`
);

export const sortFunctions = createRule({
  name: 'sort-functions',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require top-level function declarations to be sorted alphabetically',
      recommended: 'recommended',
    },
    messages: {
      unsortedFunction: 'Function "{{current}}" should come before "{{previous}}"',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const functions: TSESTree.FunctionDeclaration[] = [];

    return {
      FunctionDeclaration(node) {
        if (node.parent.type === 'Program' && node.id !== null) {
          functions.push(node);
        }
      },
      'Program:exit'() {
        for (let i = 1; i < functions.length; i++) {
          const previous = functions[i - 1].id!.name;
          const current = functions[i].id!.name;
          if (current.toLowerCase() < previous.toLowerCase()) {
            context.report({
              node: functions[i],
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

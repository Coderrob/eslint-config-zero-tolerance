import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/Coderrob/eslint-config-zero-tolerance#${name}`
);

export const sortImports = createRule({
  name: 'sort-imports',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require import declarations to be sorted alphabetically by module path',
      recommended: 'recommended',
    },
    messages: {
      unsortedImport: 'Import "{{current}}" should come before "{{previous}}"',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const imports: TSESTree.ImportDeclaration[] = [];

    return {
      ImportDeclaration(node) {
        imports.push(node);
      },
      'Program:exit'() {
        for (let i = 1; i < imports.length; i++) {
          const previous = imports[i - 1].source.value as string;
          const current = imports[i].source.value as string;
          if (current.toLowerCase() < previous.toLowerCase()) {
            context.report({
              node: imports[i],
              messageId: 'unsortedImport',
              data: { current, previous },
            });
          }
        }
      },
    };
  },
});

export default sortImports;

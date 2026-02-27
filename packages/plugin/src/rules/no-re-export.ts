import { ESLintUtils } from '@typescript-eslint/utils';
import { RULE_CREATOR_URL } from '../constants';

const createRule = ESLintUtils.RuleCreator((name) => `${RULE_CREATOR_URL}${name}`);

/**
 * ESLint rule that disallows re-export statements from parent or grandparent modules.
 */
export const noReExport = createRule({
  name: 'no-re-export',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow re-export statements from peers, parent, or grandparent modules; barrel files may re-export from children or peer modules but not from ancestors',
    },
    messages: {
      noReExport:
        'Re-export statements from peers, parent, or grandparent modules are not allowed; barrel files may re-export from children or peer modules but not from ancestors',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      /**
       * Checks named export declarations for re-exports from parent modules.
       *
       * @param node - The ExportNamedDeclaration node to check.
       */
      ExportNamedDeclaration(node) {
        // Check for re-export with specifiers: export { foo } from './module'
        if (node.source) {
          const importPath = node.source.value;
          // Allow re-exports from children (./*)
          // Disallow re-exports from peers (../), parents (../../*), and grandparents (../../../*)
          if (importPath.startsWith('../')) {
            context.report({
              node,
              messageId: 'noReExport',
            });
          }
        }
      },
      /**
       * Checks all export declarations for re-exports from parent modules.
       *
       * @param node - The ExportAllDeclaration node to check.
       */
      ExportAllDeclaration(node) {
        // Check for wildcard re-export: export * from './module'
        const importPath = node.source.value;
        // Allow re-exports from children (./*)
        // Disallow re-exports from peers (../), parents (../../*), and grandparents (../../../*)
        if (importPath.startsWith('../')) {
          context.report({
            node,
            messageId: 'noReExport',
          });
        }
      },
    };
  },
});

export default noReExport;

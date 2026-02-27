import { ESLintUtils } from '@typescript-eslint/utils';
import { RULE_CREATOR_URL } from '../constants';

const createRule = ESLintUtils.RuleCreator((name) => `${RULE_CREATOR_URL}${name}`);

/**
 * Returns the file name (last path segment) from a file path.
 *
 * @param filePath - Full or relative file system path.
 * @returns The file name portion of the path.
 */
function getFilename(filePath: string): string {
  const parts = filePath.split(/[\\/]/);
  return parts[parts.length - 1];
}

/**
 * Returns true when the file is a barrel file (index.*).
 * Only single-extension index files (e.g. index.ts, index.js, index.mts) are
 * treated as barrel files. Double-extension files such as index.d.ts,
 * index.test.ts, or index.spec.js are intentionally excluded.
 * Barrel files exist solely to aggregate and re-export; they are exempt
 * from the re-export restrictions enforced by this rule.
 *
 * @param filePath - Path to the current file being linted.
 * @returns True if the file is a barrel index file.
 */
function isBarrelFile(filePath: string): boolean {
  return /^index\.\w+$/.test(getFilename(filePath));
}

/**
 * ESLint rule that disallows re-export statements from parent or ancestor modules.
 */
export const noReExport = createRule({
  name: 'no-re-export',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow re-export statements from parent or ancestor modules; barrel files (index.*) are exempt from this restriction',
    },
    messages: {
      noReExport:
        'Re-export statements from parent or ancestor modules are not allowed in non-barrel files',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    if (isBarrelFile(context.filename)) {
      return {};
    }

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

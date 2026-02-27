import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';
import { isIdentifierNode } from '../ast-guards';
import { RULE_CREATOR_URL } from '../constants';

const createRule = ESLintUtils.RuleCreator((name) => `${RULE_CREATOR_URL}${name}`);

/**
 * Extracts the name from an identifier or string literal specifier.
 *
 * @param node - The specifier node (Identifier or StringLiteral).
 * @returns The extracted name, or null if not a valid specifier.
 */
function getSpecifierName(node: TSESTree.Identifier | TSESTree.StringLiteral): string | null {
  if (isIdentifierNode(node)) {
    return node.name;
  }
  return node.value;
}

/**
 * Returns alias/local names when export specifier is an alias.
 * @param specifier - The export specifier to analyze.
 * @returns Object with local and alias names if it's an alias, null otherwise.
 */
function getAliasInfo(
  specifier: TSESTree.ExportSpecifier,
): { local: string; alias: string } | null {
  const localName = getSpecifierName(specifier.local);
  const exportedName = getSpecifierName(specifier.exported);

  const isValidAlias = localName !== null && exportedName !== null && localName !== exportedName;

  return isValidAlias ? { local: localName, alias: exportedName } : null;
}

/**
 * ESLint rule that prevents use of alias in export statements.
 */
export const noExportAlias = createRule({
  name: 'no-export-alias',
  meta: {
    type: 'suggestion',
    fixable: 'code',
    docs: {
      description: 'Prevent use of alias in export statements',
    },
    messages: {
      noExportAlias: 'Export alias "{{alias}}" is not allowed; export "{{local}}" directly',
    },
    schema: [],
  },
  defaultOptions: [],
  /**
   * Creates an ESLint rule that prevents export aliases.
   *
   * @param context - The ESLint rule context.
   * @returns An object with visitor functions for AST nodes.
   */
  create(context) {
    const sourceCode = context.sourceCode;

    /**
     * Processes an export specifier to check for aliases.
     *
     * @param specifier - The export specifier to check.
     */
    const processExportSpecifier = (specifier: TSESTree.ExportSpecifier): void => {
      const aliasInfo = getAliasInfo(specifier);
      if (aliasInfo === null) {
        return;
      }

      context.report({
        node: specifier,
        messageId: 'noExportAlias',
        data: aliasInfo,
        fix(fixer) {
          return fixer.replaceText(specifier, sourceCode.getText(specifier.local));
        },
      });
    };

    return {
      /**
       * Checks named export declarations for aliased specifiers.
       *
       * @param node - The ExportNamedDeclaration node.
       */
      ExportNamedDeclaration(node) {
        for (const specifier of node.specifiers) {
          processExportSpecifier(specifier);
        }
      },
    };
  },
});

export default noExportAlias;

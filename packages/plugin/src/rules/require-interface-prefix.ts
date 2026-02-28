import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';
import { RULE_CREATOR_URL } from '../constants';
import { INTERFACE_REQUIRED_PREFIX } from '../rule-constants';

const createRule = ESLintUtils.RuleCreator((name) => `${RULE_CREATOR_URL}${name}`);

/**
 * ESLint rule that enforces interface names start with "I".
 */
export const requireInterfacePrefix = createRule({
  name: 'require-interface-prefix',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce that interface names start with "I"',
    },
    messages: {
      interfacePrefix: 'Interface name "{{name}}" should start with "I"',
    },
    schema: [],
  },
  defaultOptions: [],
  /**
   * Creates an ESLint rule that enforces interface naming conventions.
   *
   * @param context - The ESLint rule context.
   * @returns An object with visitor functions for AST nodes.
   */
  create(context) {
    /**
     * Checks if an interface name follows the required naming convention.
     *
     * @param interfaceName - The interface name to validate.
     * @returns True if the name is valid, false otherwise.
     */
    const isValidInterfaceName = (interfaceName: string): boolean => {
      return (
        interfaceName.startsWith(INTERFACE_REQUIRED_PREFIX) &&
        interfaceName.length >= 2 &&
        /[A-Z]/.test(interfaceName[1])
      );
    };

    /**
     * Checks a TypeScript interface declaration for proper naming.
     *
     * @param node - The TSInterfaceDeclaration node to check.
     */
    const checkTSInterfaceDeclaration = (node: TSESTree.TSInterfaceDeclaration): void => {
      const interfaceName = node.id.name;

      if (!isValidInterfaceName(interfaceName)) {
        context.report({
          node: node.id,
          messageId: 'interfacePrefix',
          data: { name: interfaceName },
        });
      }
    };

    return {
      TSInterfaceDeclaration: checkTSInterfaceDeclaration,
    };
  },
});

export default requireInterfacePrefix;

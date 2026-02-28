import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';
import { RULE_CREATOR_URL } from '../constants';

const createRule = ESLintUtils.RuleCreator((name) => `${RULE_CREATOR_URL}${name}`);

const ALLOWED_THROW_TYPES = new Set([
  'NewExpression',
  'Identifier',
  'MemberExpression',
  'CallExpression',
  'AwaitExpression',
]);

/**
 * Returns true when the thrown expression is an acceptable error value:
 * a constructor call (new Error()), an identifier (re-throw of caught error),
 * a member expression, a call expression, or an awaited expression.
 *
 * @param node - The thrown expression node to check.
 * @returns True if the throw argument is allowed, false otherwise.
 */
function isAllowedThrowArgument(node: TSESTree.Node): boolean {
  return ALLOWED_THROW_TYPES.has(node.type);
}

/**
 * ESLint rule that disallows throwing literals, objects, or templates.
 */
export const noThrowLiteral = createRule({
  name: 'no-throw-literal',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow throwing literals, objects, or templates; always throw a new Error instance',
    },
    messages: {
      noThrowLiteral: 'Do not throw a {{type}}; use "throw new Error(message)" instead',
    },
    schema: [],
  },
  defaultOptions: [],
  /**
   * Creates an ESLint rule that prevents throwing literals and objects.
   *
   * @param context - The ESLint rule context.
   * @returns An object with visitor functions for AST nodes.
   */
  create(context) {
    /**
     * Checks a throw statement for invalid argument types.
     *
     * @param node - The throw statement node to check.
     */
    const checkThrowStatement = (node: TSESTree.ThrowStatement): void => {
      if (!node.argument || isAllowedThrowArgument(node.argument)) {
        return;
      }

      const type = node.argument.type
        .replace(/^TS/, '')
        .replace(/([A-Z])/g, ' $1')
        .trim()
        .toLowerCase();

      context.report({
        node: node.argument,
        messageId: 'noThrowLiteral',
        data: { type },
      });
    };

    return {
      ThrowStatement: checkThrowStatement,
    };
  },
});

export default noThrowLiteral;

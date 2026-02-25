import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/Coderrob/eslint-config-zero-tolerance#${name}`
);

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
 */
function isAllowedThrowArgument(node: TSESTree.Node): boolean {
  return ALLOWED_THROW_TYPES.has(node.type);
}

export const noThrowLiteral = createRule({
  name: 'no-throw-literal',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow throwing literals, objects, or templates; always throw a new Error instance',
      recommended: 'recommended',
    },
    messages: {
      noThrowLiteral:
        'Do not throw a {{type}}; use "throw new Error(message)" instead',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      ThrowStatement(node) {
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
      },
    };
  },
});

export default noThrowLiteral;

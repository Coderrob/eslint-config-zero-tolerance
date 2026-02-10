import { ESLintUtils } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/Coderrob/eslint-config-zero-tolerance#${name}`
);

export const zodSchemaDescription = createRule({
  name: 'zod-schema-description',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce that Zod schemas have .describe() called',
      recommended: 'recommended',
    },
    messages: {
      zodSchemaDescription: 'Zod schema should have .describe() called',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      VariableDeclarator(node) {
        // Check if the variable is assigned a Zod schema
        if (node.init && node.init.type === 'CallExpression') {
          const hasZodCall = checkForZodCall(node.init);
          if (hasZodCall && !hasDescribeCall(node.init)) {
            context.report({
              node: node.init,
              messageId: 'zodSchemaDescription',
            });
          }
        }
      },
    };

    function checkForZodCall(node: any): boolean {
      if (node.type === 'CallExpression') {
        // Check if callee is a member expression starting with 'z.'
        if (node.callee.type === 'MemberExpression') {
          if (
            node.callee.object.type === 'Identifier' &&
            node.callee.object.name === 'z'
          ) {
            return true;
          }
          return checkForZodCall(node.callee.object);
        }
      }
      return false;
    }

    function hasDescribeCall(node: any): boolean {
      if (node.type === 'CallExpression') {
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.property.type === 'Identifier' &&
          node.callee.property.name === 'describe'
        ) {
          return true;
        }
        // Recursively check the object
        if (node.callee.type === 'MemberExpression') {
          return hasDescribeCall(node.callee);
        }
      }
      return false;
    }
  },
});

export default zodSchemaDescription;

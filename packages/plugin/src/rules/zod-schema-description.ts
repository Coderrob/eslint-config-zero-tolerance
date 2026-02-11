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
      // Traverse a chain like z.string().describe("...").optional()
      // starting from the outermost CallExpression and walking inward.
      if (node.type !== 'CallExpression') {
        return false;
      }

      let current: any = node;

      while (
        current &&
        current.type === 'CallExpression' &&
        current.callee &&
        current.callee.type === 'MemberExpression'
      ) {
        const callee = current.callee;

        if (
          callee.property &&
          callee.property.type === 'Identifier' &&
          callee.property.name === 'describe'
        ) {
          return true;
        }

        // Walk inward through the object of the MemberExpression, if it is
        // itself a CallExpression in the chain.
        if (callee.object && callee.object.type === 'CallExpression') {
          current = callee.object;
        } else {
          break;
        }
      }

      return false;
    }
  },
});

export default zodSchemaDescription;

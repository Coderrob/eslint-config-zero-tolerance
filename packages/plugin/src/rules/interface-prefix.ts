import { ESLintUtils } from '@typescript-eslint/utils';
import { AST_NODE_TYPES } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/Coderrob/eslint-config-zero-tolerance#${name}`
);

export const interfacePrefix = createRule({
  name: 'interface-prefix',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce that interface names start with "I"',
      recommended: 'recommended',
    },
    messages: {
      interfacePrefix: 'Interface name "{{name}}" should start with "I"',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    return {
      TSInterfaceDeclaration(node) {
        const interfaceName = node.id.name;
        if (!interfaceName.startsWith('I') || interfaceName.length < 2 || interfaceName[1] !== interfaceName[1].toUpperCase()) {
          context.report({
            node: node.id,
            messageId: 'interfacePrefix',
            data: {
              name: interfaceName,
            },
          });
        }
      },
    };
  },
});

export default interfacePrefix;

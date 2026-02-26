import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/Coderrob/eslint-config-zero-tolerance#${name}`
);

/** Returns the configured parameter limit, defaulting to 4. */
function resolveMax(options: unknown[]): number {
  const opt = options[0] as { max?: number } | undefined;
  return opt?.max ?? 4;
}

/** Extracts a human-readable function name from the node and its parent. */
function resolveName(
  node: TSESTree.FunctionDeclaration | TSESTree.FunctionExpression | TSESTree.ArrowFunctionExpression
): string {
  if (node.type === 'FunctionDeclaration' && node.id) {
    return node.id.name;
  }
  if (
    node.parent?.type === 'VariableDeclarator' &&
    node.parent.id.type === 'Identifier'
  ) {
    return node.parent.id.name;
  }
  if (
    node.parent?.type === 'MethodDefinition' &&
    node.parent.key.type === 'Identifier'
  ) {
    return node.parent.key.name;
  }
  return '<anonymous>';
}

export const maxParams = createRule({
  name: 'max-params',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce a maximum number of function parameters',
    },
    messages: {
      tooManyParams:
        'Function "{{name}}" has {{count}} parameters (max {{max}}); use an options object to reduce parameter count',
    },
    schema: [
      {
        type: 'object',
        properties: { max: { type: 'number', minimum: 0 } },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [],
  create(context) {
    const max = resolveMax(context.options);

    function checkFunction(
      node: TSESTree.FunctionDeclaration | TSESTree.FunctionExpression | TSESTree.ArrowFunctionExpression
    ): void {
      const count = node.params.length;
      if (count <= max) {
        return;
      }
      context.report({
        node,
        messageId: 'tooManyParams',
        data: { name: resolveName(node), count, max },
      });
    }

    return {
      FunctionDeclaration: checkFunction,
      FunctionExpression: checkFunction,
      ArrowFunctionExpression: checkFunction,
    };
  },
});

export default maxParams;

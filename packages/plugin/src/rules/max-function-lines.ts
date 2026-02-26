import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/Coderrob/eslint-config-zero-tolerance#${name}`
);

/** Returns the configured line limit, defaulting to 30. */
function resolveMax(options: unknown[]): number {
  const opt = options[0] as { max?: number } | undefined;
  return opt?.max ?? 30;
}

/** Counts the lines occupied by a block-statement function body. */
function countBodyLines(body: TSESTree.BlockStatement): number {
  return body.loc.end.line - body.loc.start.line + 1;
}

export const maxFunctionLines = createRule({
  name: 'max-function-lines',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce a maximum number of lines per function body',
    },
    messages: {
      tooManyLines:
        'Function "{{name}}" has {{lines}} lines (max {{max}}); keep functions small and focused',
    },
    schema: [
      {
        type: 'object',
        properties: { max: { type: 'number', minimum: 1 } },
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
      if (!node.body || node.body.type !== 'BlockStatement') {
        return;
      }
      const lines = countBodyLines(node.body);
      if (lines <= max) {
        return;
      }
      const name =
        (node.type === 'FunctionDeclaration' && node.id?.name) ||
        (node.parent?.type === 'VariableDeclarator' &&
          node.parent.id.type === 'Identifier' &&
          node.parent.id.name) ||
        (node.parent?.type === 'MethodDefinition' &&
          node.parent.key.type === 'Identifier' &&
          node.parent.key.name) ||
        '<anonymous>';
      context.report({
        node,
        messageId: 'tooManyLines',
        data: { name, lines, max },
      });
    }

    return {
      FunctionDeclaration: checkFunction,
      FunctionExpression: checkFunction,
      ArrowFunctionExpression: checkFunction,
    };
  },
});

export default maxFunctionLines;

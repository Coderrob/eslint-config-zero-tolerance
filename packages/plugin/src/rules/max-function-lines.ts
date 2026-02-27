import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';
import { RULE_CREATOR_URL } from '../constants';
import { type FunctionNode, isBlockStatementNode } from '../ast-guards';
import { resolveFunctionName } from '../ast-helpers';

const createRule = ESLintUtils.RuleCreator((name) => `${RULE_CREATOR_URL}${name}`);

/**
 * Returns the configured line limit, defaulting to 30.
 *
 * @param options - The rule options array.
 * @returns The maximum allowed number of lines per function.
 */
function resolveMax(options: unknown[]): number {
  const opt = options[0] as { max?: number } | undefined;
  return opt?.max ?? 30;
}

/**
 * Counts the lines occupied by a block-statement function body.
 *
 * @param body - The block statement to count lines for.
 * @returns The number of lines in the block statement.
 */
function countBodyLines(body: TSESTree.BlockStatement): number {
  return body.loc.end.line - body.loc.start.line + 1;
}

/** Returns block body for function nodes, or null for expression-bodied arrows. */
function getBlockBody(node: FunctionNode): TSESTree.BlockStatement | null {
  return isBlockStatementNode(node.body) ? node.body : null;
}

/**
 * ESLint rule that enforces a maximum number of lines per function body.
 */
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

    /**
     * Checks a function node for line count violations.
     *
     * @param node - The function node to check.
     */
    function checkFunction(node: FunctionNode): void {
      const blockBody = getBlockBody(node);
      if (blockBody === null) {
        return;
      }
      const lines = countBodyLines(blockBody);
      if (lines <= max) {
        return;
      }
      context.report({
        node,
        messageId: 'tooManyLines',
        data: { name: resolveFunctionName(node), lines, max },
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

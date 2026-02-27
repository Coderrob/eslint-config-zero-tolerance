import { AST_NODE_TYPES, ESLintUtils, TSESTree } from '@typescript-eslint/utils';
import { RULE_CREATOR_URL } from '../constants';

const createRule = ESLintUtils.RuleCreator((name) => `${RULE_CREATOR_URL}${name}`);

const LOOP_TYPES = new Set([
  AST_NODE_TYPES.ForStatement,
  AST_NODE_TYPES.ForInStatement,
  AST_NODE_TYPES.ForOfStatement,
  AST_NODE_TYPES.WhileStatement,
  AST_NODE_TYPES.DoWhileStatement,
]);

const FUNCTION_BOUNDARY_TYPES = new Set([
  AST_NODE_TYPES.FunctionDeclaration,
  AST_NODE_TYPES.FunctionExpression,
  AST_NODE_TYPES.ArrowFunctionExpression,
]);

/**
 * Walks ancestors from innermost outward and returns true when a loop
 * node is reached before any function boundary, indicating the await
 * executes directly inside a loop body rather than inside a nested function.
 *
 * @param ancestors - The array of ancestor nodes from innermost to outermost.
 * @returns True if the await is inside a loop, false otherwise.
 */
function isInsideLoop(ancestors: TSESTree.Node[]): boolean {
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const boundaryResult = getBoundaryResult(ancestors[i].type);
    if (boundaryResult !== null) {
      return boundaryResult;
    }
  }
  return false;
}

/** Returns loop-boundary evaluation result for a node type, or null if irrelevant. */
function getBoundaryResult(type: TSESTree.Node['type']): boolean | null {
  if (FUNCTION_BOUNDARY_TYPES.has(type)) {
    return false;
  }
  return LOOP_TYPES.has(type) ? true : null;
}

/**
 * ESLint rule that disallows await expressions inside loops.
 */
export const noAwaitInLoop = createRule({
  name: 'no-await-in-loop',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow await expressions inside loops; use Promise.all() for parallel execution',
    },
    messages: {
      noAwaitInLoop:
        'Unexpected await inside a loop; refactor to use Promise.all() or Promise.allSettled() for parallel execution',
    },
    schema: [],
  },
  defaultOptions: [],
  /**
   * Creates an ESLint rule that detects await expressions inside loops.
   *
   * @param context - The ESLint rule context.
   * @returns An object with visitor functions for AST nodes.
   */
  create(context) {
    /**
     * Checks an await expression for being inside a loop.
     *
     * @param node - The await expression node to check.
     */
    const checkAwaitExpression = (node: TSESTree.AwaitExpression): void => {
      const ancestors = context.sourceCode.getAncestors(node);
      if (isInsideLoop(ancestors)) {
        context.report({ node, messageId: 'noAwaitInLoop' });
      }
    };

    return {
      AwaitExpression: checkAwaitExpression,
    };
  },
});

export default noAwaitInLoop;

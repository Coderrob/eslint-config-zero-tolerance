import { ESLintUtils, TSESTree } from '@typescript-eslint/utils';

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/Coderrob/eslint-config-zero-tolerance#${name}`
);

const LOOP_TYPES = new Set([
  'ForStatement',
  'ForInStatement',
  'ForOfStatement',
  'WhileStatement',
  'DoWhileStatement',
]);

const FUNCTION_BOUNDARY_TYPES = new Set([
  'FunctionDeclaration',
  'FunctionExpression',
  'ArrowFunctionExpression',
]);

/**
 * Walks ancestors from innermost outward and returns true when a loop
 * node is reached before any function boundary, indicating the await
 * executes directly inside a loop body rather than inside a nested function.
 */
function isInsideLoop(ancestors: TSESTree.Node[]): boolean {
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const type = ancestors[i].type;
    if (LOOP_TYPES.has(type)) {
      return true;
    }
    if (FUNCTION_BOUNDARY_TYPES.has(type)) {
      return false;
    }
  }
  return false;
}

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
  create(context) {
    return {
      AwaitExpression(node) {
        const ancestors = context.getSourceCode().getAncestors(node) as TSESTree.Node[];
        if (isInsideLoop(ancestors)) {
          context.report({ node, messageId: 'noAwaitInLoop' });
        }
      },
    };
  },
});

export default noAwaitInLoop;

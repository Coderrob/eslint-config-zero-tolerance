import { AST_NODE_TYPES, ESLintUtils, TSESTree } from '@typescript-eslint/utils';
import { RULE_CREATOR_URL } from '../constants';

const createRule = ESLintUtils.RuleCreator((name) => `${RULE_CREATOR_URL}${name}`);

/** Enforces alphabetical ordering of top-level function declarations and function-valued consts. */
export const sortFunctions = createRule({
  name: 'sort-functions',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require top-level functions to be sorted alphabetically',
    },
    messages: {
      unsortedFunction: 'Function "{{current}}" should come before "{{previous}}"',
    },
    schema: [],
  },
  defaultOptions: [],
  /**
   * Creates an ESLint rule that enforces alphabetical ordering of top-level functions.
   *
   * @param context - The ESLint rule context.
   * @returns An object with visitor functions for AST nodes.
   */
  create(context) {
    type SortableFunctionNode = TSESTree.FunctionDeclaration | TSESTree.VariableDeclarator;
    type SortableFunction = {
      name: string;
      node: SortableFunctionNode;
    };

    const functions: SortableFunction[] = [];

    /**
     * Checks if a variable declaration is at the top level (including exported declarations).
     *
     * @param node - The variable declaration node to check.
     * @returns True if the declaration is at the top level.
     */
    const isTopLevelVariableDeclaration = (node: TSESTree.VariableDeclaration): boolean => {
      return (
        node.parent.type === AST_NODE_TYPES.Program ||
        (node.parent.type === AST_NODE_TYPES.ExportNamedDeclaration &&
          node.parent.parent.type === AST_NODE_TYPES.Program)
      );
    };

    /**
     * Checks if a function declaration is at the top level (including exported declarations).
     *
     * @param node - The function declaration node to check.
     * @returns True if the declaration is at the top level.
     */
    const isTopLevelFunctionDeclaration = (node: TSESTree.FunctionDeclaration): boolean => {
      return (
        node.parent.type === AST_NODE_TYPES.Program ||
        (node.parent.type === AST_NODE_TYPES.ExportNamedDeclaration &&
          node.parent.parent.type === AST_NODE_TYPES.Program)
      );
    };

    /**
     * Checks if a variable declarator contains a function expression or arrow function.
     *
     * @param declaration - The variable declarator to check.
     * @returns True if the declarator initializes a function.
     */
    const isFunctionDeclarator = (
      declaration: TSESTree.VariableDeclarator,
    ): declaration is TSESTree.VariableDeclarator & {
      id: TSESTree.Identifier;
      init: TSESTree.Expression;
    } => {
      const init = declaration.init;
      if (declaration.id.type !== AST_NODE_TYPES.Identifier || init === null) {
        return false;
      }
      return isFunctionInitializer(init);
    };

    /**
     * Returns declarator identifier name when declaration is function-valued.
     *
     * @param declaration - The variable declarator to inspect.
     * @returns The identifier name if declaration is function-valued, otherwise null.
     */
    const getFunctionDeclaratorName = (declaration: TSESTree.VariableDeclarator): string | null => {
      if (!isFunctionDeclarator(declaration)) {
        return null;
      }
      return declaration.id.name;
    };

    /**
     * Returns true when initializer node is function-valued.
     * @param init - The expression node to check.
     * @returns True if the expression is a function, false otherwise.
     */
    const isFunctionInitializer = (init: TSESTree.Expression): boolean => {
      return (
        init.type === AST_NODE_TYPES.ArrowFunctionExpression ||
        init.type === AST_NODE_TYPES.FunctionExpression
      );
    };

    /**
     * Processes a function declaration node.
     *
     * @param node - The function declaration node.
     */
    const processFunctionDeclaration = (node: TSESTree.FunctionDeclaration): void => {
      if (!isTopLevelFunctionDeclaration(node)) {
        return;
      }
      functions.push({ name: node.id!.name, node });
    };

    /**
     * Processes a variable declaration node.
     *
     * @param node - The variable declaration node.
     */
    const processVariableDeclaration = (node: TSESTree.VariableDeclaration): void => {
      if (node.kind !== 'const') {
        return;
      }
      if (!isTopLevelVariableDeclaration(node)) {
        return;
      }
      collectFunctionDeclarators(node.declarations);
    };

    /** Collects function-valued variable declarators into sortable list. */
    const collectFunctionDeclarators = (declarations: TSESTree.VariableDeclarator[]): void => {
      for (const declaration of declarations) {
        const functionName = getFunctionDeclaratorName(declaration);
        if (functionName === null) {
          continue;
        }
        functions.push({ name: functionName, node: declaration });
      }
    };

    /**
     * Checks the collected functions for alphabetical ordering.
     */
    const checkFunctionOrdering = (): void => {
      // Compare in source order so each report points at the later misplaced item.
      for (let i = 1; i < functions.length; i++) {
        const previous = functions[i - 1].name;
        const current = functions[i].name;
        if (current.toLowerCase() < previous.toLowerCase()) {
          context.report({
            node: functions[i].node,
            messageId: 'unsortedFunction',
            data: { current, previous },
          });
        }
      }
    };

    return {
      FunctionDeclaration: processFunctionDeclaration,
      VariableDeclaration: processVariableDeclaration,
      'Program:exit': checkFunctionOrdering,
    };
  },
});

export default sortFunctions;

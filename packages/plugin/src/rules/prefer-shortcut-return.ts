/**
 * Copyright 2026 Robert Lindley
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { createRule } from '../rule-factory';

const FIRST_ITEM_INDEX = 0;
const SINGLE_ITEM_COUNT = 1;
const RANGE_START_INDEX = 0;
const RANGE_END_INDEX = 1;

type PreferShortcutReturnContext = Readonly<TSESLint.RuleContext<'preferShortcutReturn', []>>;

interface IReplacementPlan {
  endNode: TSESTree.Node;
  shortcutReturnText: string;
}

interface IReplacementInput {
  condition: TSESTree.Expression;
  endNode: TSESTree.Node;
  sourceCode: Readonly<TSESLint.SourceCode>;
  whenFalse: boolean;
  whenTrue: boolean;
}

interface ITrailingBooleanReturn {
  nextReturn: TSESTree.ReturnStatement;
  whenFalse: boolean;
}

interface IIfBooleanPairInput {
  endNode: TSESTree.Node;
  ifNode: TSESTree.IfStatement;
  sourceCode: Readonly<TSESLint.SourceCode>;
  whenFalse: boolean;
  whenTrue: boolean;
}

interface IIfThenBooleanPair {
  endNode: TSESTree.Node;
  whenFalse: boolean;
  whenTrue: boolean;
}

/**
 * Builds a shortcut return statement for boolean-return if patterns.
 *
 * @param sourceCode - ESLint source code helper.
 * @param condition - If-statement condition expression.
 * @param whenTrue - Boolean returned when condition is truthy.
 * @param whenFalse - Boolean returned when condition is falsy.
 * @returns Replacement return statement text, or null when no shortcut is valid.
 */
function buildShortcutReturnText(
  sourceCode: Readonly<TSESLint.SourceCode>,
  condition: TSESTree.Expression,
  whenTrue: boolean,
  whenFalse: boolean,
): string | null {
  const conditionText = sourceCode.getText(condition);
  if (hasMatchingBooleanPair(whenTrue, whenFalse)) {
    return `return !!(${conditionText});`;
  }
  if (hasInverseBooleanPair(whenTrue, whenFalse)) {
    return `return !(${conditionText});`;
  }
  return null;
}

/**
 * Creates listeners for rule execution.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listeners.
 */
function createListeners(context: PreferShortcutReturnContext): TSESLint.RuleListener {
  return {
    IfStatement: reportIfShortcutReturn.bind(undefined, context),
  };
}

/**
 * Creates a fixer that replaces an if/return pattern with a shortcut return.
 *
 * @param node - If statement node.
 * @param replacement - Replacement plan.
 * @param fixer - ESLint fixer.
 * @returns Single replacement fix.
 */
function createReportFix(
  node: TSESTree.IfStatement,
  replacement: IReplacementPlan,
  fixer: TSESLint.RuleFixer,
): TSESLint.RuleFix {
  return fixer.replaceTextRange(
    [node.range[RANGE_START_INDEX], replacement.endNode.range[RANGE_END_INDEX]],
    replacement.shortcutReturnText,
  );
}

/**
 * Reads a boolean return statement from a block containing one statement.
 *
 * @param blockStatement - Block statement to inspect.
 * @returns Return statement, or null when block does not match.
 */
function getBooleanReturnFromBlock(
  blockStatement: TSESTree.BlockStatement,
): TSESTree.ReturnStatement | null {
  if (blockStatement.body.length !== SINGLE_ITEM_COUNT) {
    return null;
  }
  const statement = blockStatement.body[FIRST_ITEM_INDEX];
  return statement.type === AST_NODE_TYPES.ReturnStatement ? statement : null;
}

/**
 * Reads a boolean return value from a statement.
 *
 * @param statement - Statement to inspect.
 * @returns Boolean value, or null when statement is not a boolean return.
 */
function getBooleanReturnFromStatement(statement: TSESTree.Statement): boolean | null {
  const returnStatement = getReturnStatementFromStatement(statement);
  return returnStatement === null ? null : getBooleanReturnFromValue(returnStatement.argument);
}

/**
 * Reads a boolean value from a return argument expression.
 *
 * @param value - Return argument expression.
 * @returns Boolean value, or null when not a boolean literal.
 */
function getBooleanReturnFromValue(value: TSESTree.Expression | null): boolean | null {
  if (value?.type !== AST_NODE_TYPES.Literal) {
    return null;
  }
  return typeof value.value === 'boolean' ? value.value : null;
}

/**
 * Returns the immediately following boolean return statement in the same block.
 *
 * @param node - If statement node.
 * @returns Next boolean return statement, or null.
 */
function getFollowingBooleanReturnStatement(
  node: TSESTree.IfStatement,
): TSESTree.ReturnStatement | null {
  const parent = getParentBlockStatement(node);
  if (parent === null) {
    return null;
  }
  const nextStatement = getNextStatementInBlock(parent, node);
  return getReturnStatementFromStatement(nextStatement);
}

/**
 * Creates a replacement plan for if/else boolean return patterns.
 *
 * @param sourceCode - ESLint source code helper.
 * @param node - If statement node.
 * @returns Replacement plan, or null when pattern does not match.
 */
function getIfElseReplacement(
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: TSESTree.IfStatement,
): IReplacementPlan | null {
  const booleanPair = zIfElseBooleanPair(node);
  return booleanPair === null
    ? null
    : resolveReplacementForIfBooleanPair({
        sourceCode,
        ifNode: node,
        endNode: node,
        whenTrue: booleanPair.whenTrue,
        whenFalse: booleanPair.whenFalse,
      });
}

/**
 * Creates a replacement plan for if + trailing return boolean patterns.
 *
 * @param sourceCode - ESLint source code helper.
 * @param node - If statement node.
 * @returns Replacement plan, or null when pattern does not match.
 */
function getIfThenReturnReplacement(
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: TSESTree.IfStatement,
): IReplacementPlan | null {
  if (node.alternate !== null) {
    return null;
  }
  const booleanPair = zIfThenBooleanPair(node);
  return booleanPair === null
    ? null
    : resolveReplacementForIfBooleanPair({
        sourceCode,
        ifNode: node,
        endNode: booleanPair.endNode,
        whenTrue: booleanPair.whenTrue,
        whenFalse: booleanPair.whenFalse,
      });
}

/**
 * Returns the next statement for a node inside a block.
 *
 * @param blockStatement - Parent block statement.
 * @param node - Node to locate in the block body.
 * @returns Next statement, or null when missing.
 */
function getNextStatementInBlock(
  blockStatement: TSESTree.BlockStatement,
  node: TSESTree.Statement,
): TSESTree.Statement | null {
  const index = blockStatement.body.indexOf(node);
  return blockStatement.body[index + SINGLE_ITEM_COUNT] ?? null;
}

/**
 * Returns a block-statement parent for the provided statement.
 *
 * @param node - Statement node.
 * @returns Parent block statement, or null.
 */
function getParentBlockStatement(node: TSESTree.Statement): TSESTree.BlockStatement | null {
  const parent = node.parent;
  return parent.type === AST_NODE_TYPES.BlockStatement ? parent : null;
}

/**
 * Reads a return statement from either a return statement or a single-return block.
 *
 * @param statement - Statement to inspect.
 * @returns Return statement, or null when none is available.
 */
function getReturnStatementFromNonNullStatement(
  statement: TSESTree.Statement,
): TSESTree.ReturnStatement | null {
  if (statement.type === AST_NODE_TYPES.ReturnStatement) {
    return statement;
  }
  return statement.type === AST_NODE_TYPES.BlockStatement
    ? getBooleanReturnFromBlock(statement)
    : null;
}

/**
 * Reads a return statement from either a return statement or a single-return block.
 *
 * @param statement - Statement to inspect.
 * @returns Return statement, or null when none is available.
 */
function getReturnStatementFromStatement(
  statement: TSESTree.Statement | null,
): TSESTree.ReturnStatement | null {
  return statement === null ? null : getReturnStatementFromNonNullStatement(statement);
}

/**
 * Returns true when a pair matches false/true ordering.
 *
 * @param whenTrue - Truthy branch return value.
 * @param whenFalse - Falsy branch return value.
 * @returns True when pair is false then true.
 */
function hasInverseBooleanPair(whenTrue: boolean, whenFalse: boolean): boolean {
  return !whenTrue && whenFalse;
}

/**
 * Returns true when a pair matches true/false ordering.
 *
 * @param whenTrue - Truthy branch return value.
 * @param whenFalse - Falsy branch return value.
 * @returns True when pair is true then false.
 */
function hasMatchingBooleanPair(whenTrue: boolean, whenFalse: boolean): boolean {
  return whenTrue && !whenFalse;
}

/**
 * Reports if-statements that can be reduced to shortcut boolean returns.
 *
 * @param context - ESLint rule execution context.
 * @param node - If statement node.
 */
function reportIfShortcutReturn(
  context: PreferShortcutReturnContext,
  node: TSESTree.IfStatement,
): void {
  const replacement = resolveReplacement(context.sourceCode, node);
  if (replacement === null) {
    return;
  }
  context.report({
    node,
    messageId: 'preferShortcutReturn',
    fix: createReportFix.bind(undefined, node, replacement),
  });
}

/**
 * Returns extracted boolean pair for an `if (...) return ...; else return ...;` pattern.
 *
 * @param sourceCode - ESLint source code helper.
 * @param node - If statement node.
 * @returns Replacement plan, or null when pattern does not match.
 */
function resolveReplacement(
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: TSESTree.IfStatement,
): IReplacementPlan | null {
  return getIfElseReplacement(sourceCode, node) ?? getIfThenReturnReplacement(sourceCode, node);
}

/**
 * Resolves the first available replacement plan for a matching if pattern.
 *
 * @param sourceCode - ESLint source code helper.
 * @param node - If statement node.
 * @returns Replacement plan, or null when no pattern matches.
 */
function resolveReplacementForBooleanPair(input: IReplacementInput): IReplacementPlan | null {
  const shortcutReturnText = buildShortcutReturnText(
    input.sourceCode,
    input.condition,
    input.whenTrue,
    input.whenFalse,
  );
  return shortcutReturnText === null ? null : { endNode: input.endNode, shortcutReturnText };
}

/**
 * Returns extracted boolean pair for an `if (...) return ...; return ...;` pattern.
 *
 * @param node - If statement node.
 * @returns Boolean pair data, or null when pattern does not match.
 */
function resolveReplacementForIfBooleanPair(input: IIfBooleanPairInput): IReplacementPlan | null {
  return resolveReplacementForBooleanPair({
    sourceCode: input.sourceCode,
    condition: input.ifNode.test,
    whenTrue: input.whenTrue,
    whenFalse: input.whenFalse,
    endNode: input.endNode,
  });
}

/**
 * Creates a replacement plan from a validated boolean-return pair.
 *
 * @param sourceCode - ESLint source code helper.
 * @param condition - If-statement condition expression.
 * @param whenTrue - Boolean returned when condition is truthy.
 * @param whenFalse - Boolean returned when condition is falsy.
 * @param endNode - Node where replacement should end.
 * @returns Replacement plan, or null when pair is not transformable.
 */
function zIfElseBooleanPair(node: TSESTree.IfStatement): IIfThenBooleanPair | null {
  if (node.alternate === null) {
    return null;
  }
  const whenTrue = getBooleanReturnFromStatement(node.consequent);
  const whenFalse = getBooleanReturnFromStatement(node.alternate);
  return whenTrue === null || whenFalse === null ? null : { endNode: node, whenTrue, whenFalse };
}

/**
 * Creates a replacement plan from if-node boolean outcomes.
 *
 * @param sourceCode - ESLint source code helper.
 * @param ifNode - Source if statement.
 * @param endNode - Node where replacement should end.
 * @param whenTrue - Boolean returned when condition is truthy.
 * @param whenFalse - Boolean returned when condition is falsy.
 * @returns Replacement plan, or null when pair is not transformable.
 */
function zIfThenBooleanPair(node: TSESTree.IfStatement): IIfThenBooleanPair | null {
  const whenTrue = getBooleanReturnFromStatement(node.consequent);
  const trailingReturn = zTrailingBooleanReturn(node);
  if (whenTrue === null || trailingReturn === null) {
    return null;
  }
  return { endNode: trailingReturn.nextReturn, whenTrue, whenFalse: trailingReturn.whenFalse };
}

/**
 * Reads the trailing boolean return that follows an if statement.
 *
 * @param node - If statement node.
 * @returns Trailing return data, or null.
 */
function zTrailingBooleanReturn(node: TSESTree.IfStatement): ITrailingBooleanReturn | null {
  const nextReturn = getFollowingBooleanReturnStatement(node);
  if (nextReturn === null) {
    return null;
  }
  const whenFalse = getBooleanReturnFromValue(nextReturn.argument);
  return whenFalse === null ? null : { nextReturn, whenFalse };
}

/**
 * ESLint rule that prefers shortcut returns for boolean if patterns.
 */
export const preferShortcutReturn = createRule({
  name: 'prefer-shortcut-return',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Prefer shortcut boolean returns by replacing if/return true-false patterns with direct return expressions',
    },
    fixable: 'code',
    messages: {
      preferShortcutReturn:
        'Replace this if-return boolean pattern with a shortcut return expression',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createListeners,
});

export default preferShortcutReturn;

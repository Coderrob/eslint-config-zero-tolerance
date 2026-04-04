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
import { hasCallCalleeNamePath } from '../helpers/ast/calls';
import { unwrapTsExpression } from '../helpers/ast/types';
import { VARIABLE_KIND_CONST } from './support/rule-constants';
import { createRule } from './support/rule-factory';

type RequireExportedObjectTypeContext = Readonly<
  TSESLint.RuleContext<'requireExportedObjectType', []>
>;

const OBJECT_FREEZE_PATH = ['Object', 'freeze'];

/**
 * Checks one program body for exported object constants without type annotations.
 *
 * @param context - ESLint rule execution context.
 * @param node - Program node being traversed.
 */
function checkProgram(context: RequireExportedObjectTypeContext, node: TSESTree.Program): void {
  const exportedBindings = getIndirectlyExportedBindings(node.body);
  for (const statement of node.body) {
    reportDirectExportViolations(context, statement);
    reportIndirectExportViolations(context, statement, exportedBindings);
  }
}

/**
 * Creates listeners for exported object-const type-annotation checks.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listener map.
 */
function createRequireExportedObjectTypeListeners(
  context: RequireExportedObjectTypeContext,
): TSESLint.RuleListener {
  return {
    Program: checkProgram.bind(undefined, context),
  };
}

/**
 * Returns one direct-export variable declaration from a statement.
 *
 * @param statement - Program statement to inspect.
 * @returns Direct-export variable declaration, or null.
 */
function getDirectExportDeclaration(
  statement: TSESTree.ProgramStatement,
): TSESTree.VariableDeclaration | null {
  if (
    statement.type !== AST_NODE_TYPES.ExportNamedDeclaration ||
    statement.declaration?.type !== AST_NODE_TYPES.VariableDeclaration
  ) {
    return null;
  }
  return statement.declaration;
}

/**
 * Returns the first call argument as an expression.
 *
 * @param expression - Call expression to inspect.
 * @returns First argument expression, or null.
 */
function getFirstCallExpressionArgument(
  expression: TSESTree.CallExpression,
): TSESTree.Expression | null {
  const firstArgument = expression.arguments.at(0) ?? null;
  return firstArgument === null ? null : unwrapCallExpressionArgument(firstArgument);
}

/**
 * Returns one indirectly exported const declaration from a statement.
 *
 * @param statement - Program statement to inspect.
 * @returns Indirectly exported const declaration, or null.
 */
function getIndirectExportDeclaration(
  statement: TSESTree.ProgramStatement,
): TSESTree.VariableDeclaration | null {
  if (statement.type !== AST_NODE_TYPES.VariableDeclaration) {
    return null;
  }
  return statement.kind === VARIABLE_KIND_CONST ? statement : null;
}

/**
 * Returns the local binding names exported via `export { Foo }` syntax.
 *
 * @param body - Program body nodes to inspect.
 * @returns Set of indirectly exported local binding names.
 */
function getIndirectlyExportedBindings(
  body: ReadonlyArray<TSESTree.ProgramStatement>,
): ReadonlySet<string> {
  const exportedBindings = new Set<string>();
  for (const statement of body) {
    if (!isIndirectExportStatement(statement)) {
      continue;
    }
    for (const specifier of statement.specifiers) {
      exportedBindings.add(specifier.local.name);
    }
  }
  return exportedBindings;
}

/**
 * Returns true when an expression is `Object.freeze({ ... })`.
 *
 * @param expression - Expression to inspect.
 * @returns True when the call freezes an object literal.
 */
function isFrozenObjectLiteralCall(expression: TSESTree.Expression): boolean {
  if (
    expression.type !== AST_NODE_TYPES.CallExpression ||
    !hasCallCalleeNamePath(expression, OBJECT_FREEZE_PATH)
  ) {
    return false;
  }
  const firstArgument = getFirstCallExpressionArgument(expression);
  return (
    firstArgument !== null &&
    unwrapTsExpression(firstArgument).type === AST_NODE_TYPES.ObjectExpression
  );
}

/**
 * Returns true when a statement is an indirect local export list.
 *
 * @param statement - Program statement to inspect.
 * @returns True when the statement exports local bindings.
 */
function isIndirectExportStatement(
  statement: TSESTree.ProgramStatement,
): statement is TSESTree.ExportNamedDeclaration & {
  declaration: null;
  source: null;
} {
  return (
    statement.type === AST_NODE_TYPES.ExportNamedDeclaration &&
    statement.declaration === null &&
    statement.source === null
  );
}

/**
 * Returns true when a declarator is exported indirectly through an export list.
 *
 * @param declarator - Variable declarator to inspect.
 * @param exportedBindings - Set of indirectly exported local names.
 * @returns True when the declarator's local binding is exported.
 */
function isIndirectlyExportedDeclarator(
  declarator: TSESTree.VariableDeclarator,
  exportedBindings: ReadonlySet<string>,
): boolean {
  return (
    declarator.id.type === AST_NODE_TYPES.Identifier && exportedBindings.has(declarator.id.name)
  );
}

/**
 * Returns true when an initializer is a direct object literal or frozen object literal.
 *
 * @param expression - Initializer expression to inspect.
 * @returns True when the initializer is object-like.
 */
function isObjectLikeInitializer(expression: TSESTree.Expression): boolean {
  const unwrappedExpression = unwrapTsExpression(expression);
  return (
    unwrappedExpression.type === AST_NODE_TYPES.ObjectExpression ||
    isFrozenObjectLiteralCall(unwrappedExpression)
  );
}

/**
 * Returns true when a declarator is an untyped exported object constant.
 *
 * @param declarator - Variable declarator to inspect.
 * @returns True when the declarator should be reported.
 */
function isUntypedExportedObjectDeclarator(declarator: TSESTree.VariableDeclarator): boolean {
  return (
    declarator.id.type === AST_NODE_TYPES.Identifier &&
    declarator.id.typeAnnotation === undefined &&
    declarator.init !== null &&
    isObjectLikeInitializer(declarator.init)
  );
}

/**
 * Reports exported-object violations for direct export declarations.
 *
 * @param context - ESLint rule execution context.
 * @param statement - Program statement to inspect.
 */
function reportDirectExportViolations(
  context: RequireExportedObjectTypeContext,
  statement: TSESTree.ProgramStatement,
): void {
  const declaration = getDirectExportDeclaration(statement);
  if (declaration === null || declaration.kind !== VARIABLE_KIND_CONST) {
    return;
  }
  for (const declarator of declaration.declarations) {
    reportExportedDeclaratorViolation(context, declarator);
  }
}

/**
 * Reports one exported object const when it lacks an identifier type annotation.
 *
 * @param context - ESLint rule execution context.
 * @param declarator - Variable declarator to inspect.
 */
function reportExportedDeclaratorViolation(
  context: RequireExportedObjectTypeContext,
  declarator: TSESTree.VariableDeclarator,
): void {
  if (!isUntypedExportedObjectDeclarator(declarator)) {
    return;
  }
  context.report({
    node: declarator.id,
    messageId: 'requireExportedObjectType',
  });
}

/**
 * Reports exported-object violations for indirectly exported const declarations.
 *
 * @param context - ESLint rule execution context.
 * @param statement - Program statement to inspect.
 * @param exportedBindings - Set of indirectly exported local names.
 */
function reportIndirectExportViolations(
  context: RequireExportedObjectTypeContext,
  statement: TSESTree.ProgramStatement,
  exportedBindings: ReadonlySet<string>,
): void {
  const declaration = getIndirectExportDeclaration(statement);
  if (declaration === null) {
    return;
  }
  for (const declarator of declaration.declarations) {
    if (isIndirectlyExportedDeclarator(declarator, exportedBindings)) {
      reportExportedDeclaratorViolation(context, declarator);
    }
  }
}

/**
 * Returns one call-expression argument when it is a plain expression.
 *
 * @param argument - Call-expression argument to inspect.
 * @returns Argument expression, or null for spread arguments.
 */
function unwrapCallExpressionArgument(
  argument: TSESTree.CallExpressionArgument,
): TSESTree.Expression | null {
  switch (argument.type) {
    case AST_NODE_TYPES.SpreadElement:
      return null;
    default:
      return argument;
  }
}

/** Requires exported object constants to declare an explicit type annotation. */
export const requireExportedObjectType = createRule({
  name: 'require-exported-object-type',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require exported object constants to declare an explicit type annotation',
    },
    messages: {
      requireExportedObjectType:
        'Exported object constants must declare an explicit type annotation.',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createRequireExportedObjectTypeListeners,
});

export default requireExportedObjectType;

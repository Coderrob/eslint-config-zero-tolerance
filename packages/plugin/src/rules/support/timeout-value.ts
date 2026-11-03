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
import { findBinding, resolveLocalValue } from './local-values';

const ARITHMETIC = new Map<string, (left: number, right: number) => number>([
  ['+', (left, right) => left + right],
  ['-', (left, right) => left - right],
  ['*', (left, right) => left * right],
  ['/', (left, right) => left / right],
  ['%', (left, right) => left % right],
  ['**', (left, right) => left ** right],
]);
const UNARY_ARITHMETIC = new Map<string, (value: number) => number>([
  ['+', (value) => +value],
  ['-', (value) => -value],
]);
const RUNTIME_VALUES = new Set([AST_NODE_TYPES.CallExpression, AST_NODE_TYPES.MemberExpression]);
const UNDEFINED_NAME = 'undefined';
const INVALID_GLOBAL_VALUES = new Set([UNDEFINED_NAME, 'NaN', 'Infinity']);
const NULLISH_OPERATOR = '??';
const OR_OPERATOR = '||';
const VOID_OPERATOR = 'void';

/** Combines numeric operands without coercion or code execution.
 * @param operation - Supported arithmetic operation.
 * @param left - Left operand or runtime marker.
 * @param right - Right operand or runtime marker.
 * @returns The computed number, or null if either operand is unresolved.
 */
function applyArithmetic(
  operation: (left: number, right: number) => number,
  left: number | null,
  right: number | null,
): number | null {
  if ([left, right].some(Number.isNaN)) return Number.NaN;
  if (left === null || right === null) return null;
  return operation(left, right);
}

/** Evaluates whitelisted arithmetic operators on numeric operands only.
 * @param source - Source code and lexical bindings.
 * @param node - Binary expression.
 * @param seen - Expressions already visited on this evaluation path.
 * @returns Its constant result or an unknown/invalid marker.
 */
function arithmeticNumber(
  source: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.BinaryExpression>,
  seen: readonly TSESTree.Node[],
): number | null {
  const operation = ARITHMETIC.get(node.operator);
  if (operation === undefined) return Number.NaN;
  return applyArithmetic(
    operation,
    timeoutNumber(source, node.left, seen),
    timeoutNumber(source, node.right, seen),
  );
}

/** Rejects invalid predefined values while preserving shadowed runtime identifiers.
 * @param source - Source code and lexical bindings.
 * @param node - Resolved identifier.
 * @returns NaN for invalid globals, or null for unknown runtime values.
 */
function identifierNumber(
  source: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.Identifier>,
): number | null {
  return INVALID_GLOBAL_VALUES.has(node.name) && isGlobalIdentifier(source, node)
    ? Number.NaN
    : null;
}

/** Matches a predefined constant only when no source declaration shadows it.
 * @param source - Source code and lexical bindings.
 * @param node - Identifier to inspect.
 * @param name - Predefined constant name.
 * @returns Whether this reference names the unshadowed constant.
 */
function isGlobalConstant(
  source: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.Identifier>,
  name: string,
): boolean {
  return node.name === name && isGlobalIdentifier(source, node);
}

/** Distinguishes predefined globals from parameters, imports, and local declarations.
 * @param source - Source code and lexical bindings.
 * @param node - Identifier whose binding is inspected.
 * @returns Whether the identifier has no source-defined binding.
 */
function isGlobalIdentifier(
  source: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.Identifier>,
): boolean {
  return (findBinding(source, node)?.defs.length ?? 0) === 0;
}

/** Applies logical short-circuiting to a known numeric left operand.
 * @param operator - Logical operator.
 * @param left - Known numeric left operand.
 * @returns Whether the left operand supplies the result.
 */
function isLeftOperandSelected(operator: string, left: number): boolean {
  if (operator === NULLISH_OPERATOR) return true;
  return operator === OR_OPERATOR ? Boolean(left) : !left;
}

/** Identifies statically nullish expressions used by fallback operators.
 * @param source - Source code and lexical bindings.
 * @param node - Resolved expression.
 * @returns Whether the expression is null or global undefined.
 */
function isNullishValue(
  source: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.Node>,
): boolean {
  if (node.type === AST_NODE_TYPES.Literal) return node.value === null;
  if (node.type === AST_NODE_TYPES.Identifier)
    return isGlobalConstant(source, node, UNDEFINED_NAME);
  return node.type === AST_NODE_TYPES.UnaryExpression && node.operator === VOID_OPERATOR;
}
/** Recognizes unresolved leaves that may provide an API-specific timeout object.
 * @param source - Source code and lexical bindings.
 * @param node - Timeout expression.
 * @returns Whether a runtime identifier, call, or member may supply an options object.
 */
export function isRuntimeTimeoutObject(
  source: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.Node>,
): boolean {
  return runtimeNumber(source, resolveLocalValue(source, node)) === null;
}

/** Recognizes usable numeric timeout expressions without executing user code.
 * @param source - Source code and lexical bindings.
 * @param node - Timeout expression to inspect.
 * @returns Whether the timeout is positive and finite, or remains a runtime value.
 */
export function isTimeoutExpression(
  source: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.Node>,
): boolean {
  return isUsableNumber(timeoutNumber(source, node, []));
}

/** Validates resolved timeout numbers while allowing unresolved runtime values.
 * @param value - Numeric value or runtime marker.
 * @returns Whether the timeout can be used without a known disabled or nonfinite value.
 */
function isUsableNumber(value: number | null): boolean {
  return value === null || (Number.isFinite(value) && value > 0);
}

/** Evaluates fallback expressions, rejecting branches known to disable the timeout.
 * @param source - Source code and lexical bindings.
 * @param node - Logical expression.
 * @param seen - Expressions already visited on this evaluation path.
 * @returns The selected numeric value or an unknown/invalid marker.
 */
function logicalNumber(
  source: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.LogicalExpression>,
  seen: readonly TSESTree.Node[],
): number | null {
  const leftNode = resolveLocalValue(source, node.left);
  if (isNullishValue(source, leftNode)) return nullishBranch(source, node, seen);
  const left = timeoutNumber(source, leftNode, seen);
  if (left === null)
    return isUsableNumber(timeoutNumber(source, node.right, seen)) ? null : Number.NaN;
  return selectedLogicalNumber(source, node, left, seen);
}

/** Selects a known nullish logical operand without treating null as numeric zero.
 * @param source - Source code and lexical bindings.
 * @param node - Logical expression with a nullish left side.
 * @param seen - Expressions already visited on this evaluation path.
 * @returns Its fallback value, or NaN for a nullish AND result.
 */
function nullishBranch(
  source: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.LogicalExpression>,
  seen: readonly TSESTree.Node[],
): number | null {
  return node.operator === NULLISH_OPERATOR || node.operator === OR_OPERATOR
    ? timeoutNumber(source, node.right, seen)
    : Number.NaN;
}

/** Recognizes runtime values while rejecting invalid global constants and unsupported syntax.
 * @param source - Source code and lexical bindings.
 * @param node - Resolved leaf expression.
 * @returns Null for runtime values, or NaN when unsupported.
 */
function runtimeNumber(
  source: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.Node>,
): number | null {
  if (node.type === AST_NODE_TYPES.Identifier) return identifierNumber(source, node);
  return RUNTIME_VALUES.has(node.type) ? null : Number.NaN;
}

/** Selects a logical branch when the left operand is numeric.
 * @param source - Source code and lexical bindings.
 * @param node - Logical expression.
 * @param left - Statically evaluated left operand.
 * @param seen - Expressions already visited on this evaluation path.
 * @returns The branch that supplies the timeout value.
 */
function selectedLogicalNumber(
  source: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.LogicalExpression>,
  left: number,
  seen: readonly TSESTree.Node[],
): number | null {
  if (Number.isNaN(left)) return Number.NaN;
  return isLeftOperandSelected(node.operator, left)
    ? left
    : timeoutNumber(source, node.right, seen);
}

/** Handles literals, unary arithmetic, and runtime leaves.
 * @param source - Source code and lexical bindings.
 * @param node - Resolved expression.
 * @param seen - Expressions already visited on this evaluation path.
 * @returns Its numeric value or an unknown/invalid marker.
 */
function simpleNumber(
  source: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.Node>,
  seen: readonly TSESTree.Node[],
): number | null {
  if (node.type === AST_NODE_TYPES.Literal)
    return typeof node.value === 'number' ? node.value : Number.NaN;
  if (node.type === AST_NODE_TYPES.UnaryExpression) return unaryNumber(source, node, seen);
  return runtimeNumber(source, node);
}

/** Evaluates supported syntax: null denotes unknown runtime values, NaN invalid values.
 * @param source - Source code and lexical bindings.
 * @param node - Expression being evaluated.
 * @param seen - Expressions already visited on this evaluation path.
 * @returns A numeric constant, null for runtime values, or NaN for unsupported syntax.
 */
function timeoutNumber(
  source: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.Node>,
  seen: readonly TSESTree.Node[],
): number | null {
  const value = resolveLocalValue(source, node);
  if (seen.includes(value)) return Number.NaN;
  if (value.type === AST_NODE_TYPES.BinaryExpression)
    return arithmeticNumber(source, value, [...seen, value]);
  if (value.type === AST_NODE_TYPES.LogicalExpression)
    return logicalNumber(source, value, [...seen, value]);
  return simpleNumber(source, value, [...seen, value]);
}

/** Evaluates unary numeric signs without accepting boolean or string coercion.
 * @param source - Source code and lexical bindings.
 * @param node - Unary expression.
 * @param seen - Expressions already visited on this evaluation path.
 * @returns Its constant result or an unknown/invalid marker.
 */
function unaryNumber(
  source: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.UnaryExpression>,
  seen: readonly TSESTree.Node[],
): number | null {
  const operation = UNARY_ARITHMETIC.get(node.operator);
  if (operation === undefined) return Number.NaN;
  const value = timeoutNumber(source, node.argument, seen);
  return value === null ? null : operation(value);
}

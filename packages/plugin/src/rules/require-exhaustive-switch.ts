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
import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils';
import ts from 'typescript';
import { createRule } from './support/rule-factory';

const BOOLEAN_TYPE_TEXT = 'boolean';
const FALSE_LITERAL = 'false';
const MINIMUM_EXHAUSTIVE_CASE_COUNT = 2;
const TRUE_LITERAL = 'true';

type RequireExhaustiveSwitchContext = Readonly<
  TSESLint.RuleContext<'requireExhaustiveSwitch', []>
>;

interface ISwitchAnalysis {
  expectedCaseTexts: readonly string[];
  presentCaseTexts: ReadonlySet<string>;
}

interface ITypeContext {
  checker: ts.TypeChecker;
  type: ts.Type;
}

/**
 * Checks switch statements for missing cases over finite discriminant types.
 *
 * @param context - ESLint rule execution context.
 * @param node - Switch statement node.
 */
function checkSwitchStatement(
  context: Readonly<RequireExhaustiveSwitchContext>,
  node: Readonly<TSESTree.SwitchStatement>,
): void {
  const switchAnalysis = getSwitchAnalysis(context, node);
  if (switchAnalysis === null) {
    return;
  }
  const missingCases = getMissingCaseTexts(switchAnalysis);
  if (missingCases.length === 0) {
    return;
  }
  context.report({
    node: node.discriminant,
    messageId: 'requireExhaustiveSwitch',
    data: { cases: missingCases.join(', ') },
  });
}

/**
 * Creates listeners for exhaustive-switch checks.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listener map.
 */
function createRequireExhaustiveSwitchListeners(
  context: Readonly<RequireExhaustiveSwitchContext>,
): TSESLint.RuleListener {
  return {
    SwitchStatement: checkSwitchStatement.bind(undefined, context),
  };
}

/**
 * Formats a TypeScript bigint literal to source text.
 *
 * @param value - TypeScript bigint literal value.
 * @returns Bigint literal text.
 */
function formatBigIntValue(value: Readonly<ts.PseudoBigInt>): string {
  return `${value.negative ? '-' : ''}${value.base10Value}n`;
}

/**
 * Returns `true` and `false` when the switch discriminant is boolean.
 *
 * @param checker - TypeScript type checker.
 * @param type - TypeScript type to inspect.
 * @returns Boolean case texts, or null when the type is not boolean.
 */
function getBooleanCaseTexts(checker: Readonly<ts.TypeChecker>, type: Readonly<ts.Type>): string[] | null {
  return checker.typeToString(type) === BOOLEAN_TYPE_TEXT
    ? [FALSE_LITERAL, TRUE_LITERAL]
    : null;
}

/**
 * Returns case texts for union types when all members are finite.
 *
 * @param checker - TypeScript type checker.
 * @param types - Union member types.
 * @returns Unique case texts, or null when any member is open-ended.
 */
function getCaseTextsFromUnionMembers(
  checker: Readonly<ts.TypeChecker>,
  types: readonly ts.Type[],
): string[] | null {
  const caseTexts: string[] = [];
  for (const type of types) {
    const caseText = getFiniteCaseText(checker, type);
    if (caseText === null) {
      return null;
    }
    caseTexts.push(caseText);
  }
  return [...new Set(caseTexts)];
}

/**
 * Returns direct case texts that do not require union expansion.
 *
 * @param checker - TypeScript type checker.
 * @param type - TypeScript type to inspect.
 * @returns Direct case texts, or null when another strategy is required.
 */
function getDirectCaseTexts(checker: Readonly<ts.TypeChecker>, type: Readonly<ts.Type>): string[] | null {
  const booleanCaseTexts = getBooleanCaseTexts(checker, type);
  if (booleanCaseTexts !== null) {
    return booleanCaseTexts;
  }
  return getEnumCaseTexts(type);
}

/**
 * Returns case texts for enum types.
 *
 * @param type - TypeScript type to inspect.
 * @returns Enum case texts, or null when the type is not an enum.
 */
function getEnumCaseTexts(type: Readonly<ts.Type>): string[] | null {
  return isEnumType(type) ? getEnumMemberCaseTexts(type.getSymbol()) : null;
}

/**
 * Returns enum member case texts for an enum symbol.
 *
 * @param symbol - Enum symbol.
 * @returns Enum member case texts, or null when no members are available.
 */
function getEnumMemberCaseTexts(symbol: ts.Symbol | undefined): string[] | null {
  if (symbol?.exports === undefined || symbol.exports.size === 0) {
    return null;
  }
  const caseTexts: string[] = [];
  symbol.exports.forEach(
    /** @param memberSymbol - Enum member symbol. */
    (memberSymbol) => caseTexts.push(`${symbol.name}.${memberSymbol.name}`),
  );
  return caseTexts;
}

/**
 * Returns expected case texts for a discriminant expression.
 *
 * @param context - ESLint rule execution context.
 * @param node - Discriminant expression.
 * @returns Expected finite case texts, or an empty array when the type is open-ended.
 */
function getExpectedCaseTexts(
  context: Readonly<RequireExhaustiveSwitchContext>,
  node: Readonly<TSESTree.Expression>,
): string[] {
  const typeContext = getTypeContext(context, node);
  if (typeContext === null) {
    return [];
  }
  return getFiniteCaseTexts(typeContext.checker, typeContext.type);
}

/**
 * Returns case text for a single finite type member.
 *
 * @param checker - TypeScript type checker.
 * @param type - TypeScript type to inspect.
 * @returns One finite case text, or null when not representable.
 */
function getFiniteCaseText(checker: Readonly<ts.TypeChecker>, type: Readonly<ts.Type>): string | null {
  const literalCaseText = getLiteralCaseText(type);
  if (literalCaseText !== null) {
    return literalCaseText;
  }
  return isFiniteBooleanLiteralType(type) || isEnumLiteralType(type)
    ? checker.typeToString(type)
    : null;
}

/**
 * Returns case texts for a TypeScript type when it is finite and enumerable.
 *
 * @param checker - TypeScript type checker.
 * @param type - TypeScript type to inspect.
 * @returns Finite case texts, or an empty array when the type cannot be enumerated.
 */
function getFiniteCaseTexts(checker: Readonly<ts.TypeChecker>, type: Readonly<ts.Type>): string[] {
  const directCaseTexts = getDirectCaseTexts(checker, type);
  if (directCaseTexts !== null) {
    return directCaseTexts;
  }
  const finiteCaseText = getFiniteCaseText(checker, type);
  if (finiteCaseText !== null) {
    return [finiteCaseText];
  }
  return getUnionCaseTexts(checker, type) ?? [];
}

/**
 * Returns true when a switch statement has a default clause.
 *
 * @param node - Switch statement node.
 * @returns True when any case has a null test.
 */
function getHasDefaultCase(node: Readonly<TSESTree.SwitchStatement>): boolean {
  return node.cases.some(
    /** @param switchCase - Case to inspect. */
    (switchCase) => switchCase.test === null,
  );
}

/**
 * Returns literal case text for string, number, and bigint literals.
 *
 * @param type - TypeScript type to inspect.
 * @returns Literal case text, or null when the type is not a supported literal.
 */
function getLiteralCaseText(type: Readonly<ts.Type>): string | null {
  if (isStringLiteralType(type)) {
    return JSON.stringify(type.value);
  }
  if (isNumberLiteralType(type)) {
    return String(type.value);
  }
  return isBigIntLiteralType(type) ? formatBigIntValue(type.value) : null;
}

/**
 * Returns the missing case texts from switch analysis.
 *
 * @param switchAnalysis - Expected and present switch cases.
 * @returns Missing case texts.
 */
function getMissingCaseTexts(switchAnalysis: Readonly<ISwitchAnalysis>): string[] {
  return switchAnalysis.expectedCaseTexts.filter(
    /** @param caseText - Expected finite case text. */
    (caseText) => !switchAnalysis.presentCaseTexts.has(caseText),
  );
}

/**
 * Returns the normalized text for present switch cases.
 *
 * @param sourceCode - ESLint source code helper.
 * @param node - Switch statement node.
 * @returns Set of present case texts.
 */
function getPresentCaseTexts(
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.SwitchStatement>,
): Set<string> {
  return new Set(
    node.cases
      .map(
        /** @param switchCase - Case to inspect. */
        (switchCase) => switchCase.test,
      )
      .filter(isCaseTestExpression)
      .map(
        /** @param caseTest - Case test to normalize. */
        (caseTest) => normalizeCaseText(sourceCode, caseTest),
      ),
  );
}

/**
 * Returns switch analysis details when the switch should be checked.
 *
 * @param context - ESLint rule execution context.
 * @param node - Switch statement node.
 * @returns Expected and present cases, or null when the switch is out of scope.
 */
function getSwitchAnalysis(
  context: Readonly<RequireExhaustiveSwitchContext>,
  node: Readonly<TSESTree.SwitchStatement>,
): Readonly<ISwitchAnalysis> | null {
  if (getHasDefaultCase(node)) {
    return null;
  }
  const expectedCaseTexts = getExpectedCaseTexts(context, node.discriminant);
  if (expectedCaseTexts.length < MINIMUM_EXHAUSTIVE_CASE_COUNT) {
    return null;
  }
  return {
    expectedCaseTexts,
    presentCaseTexts: getPresentCaseTexts(context.sourceCode, node),
  };
}

/**
 * Returns type context when type-aware linting is available.
 *
 * @param context - ESLint rule execution context.
 * @param node - Expression whose type should be inspected.
 * @returns Checker and resolved type, or null when unavailable.
 */
function getTypeContext(
  context: Readonly<RequireExhaustiveSwitchContext>,
  node: Readonly<TSESTree.Expression>,
): ITypeContext | null {
  try {
    const parserServices = ESLintUtils.getParserServices(context);
    const checker = parserServices.program.getTypeChecker();
    const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node);
    return {
      checker,
      type: checker.getTypeAtLocation(tsNode),
    };
  } catch {
    return null;
  }
}

/**
 * Returns case texts for union types when all members are finite.
 *
 * @param checker - TypeScript type checker.
 * @param type - TypeScript type to inspect.
 * @returns Union case texts, or null when any member is open-ended.
 */
function getUnionCaseTexts(checker: Readonly<ts.TypeChecker>, type: Readonly<ts.Type>): string[] | null {
  return isUnionType(type) ? getCaseTextsFromUnionMembers(checker, type.types) : null;
}

/**
 * Returns true when a type is a bigint literal.
 *
 * @param type - TypeScript type to inspect.
 * @returns True when the type is a bigint literal.
 */
function isBigIntLiteralType(type: Readonly<ts.Type>): type is ts.BigIntLiteralType {
  return (type.flags & ts.TypeFlags.BigIntLiteral) !== 0;
}

/**
 * Returns true when a switch case test exists.
 *
 * @param node - Case test node, or null for default.
 * @returns True when the node is a real switch case expression.
 */
function isCaseTestExpression(node: TSESTree.Expression | null): node is TSESTree.Expression {
  return node !== null;
}

/**
 * Returns true when a type is an enum literal.
 *
 * @param type - TypeScript type to inspect.
 * @returns True when the type is an enum literal.
 */
function isEnumLiteralType(type: Readonly<ts.Type>): boolean {
  return (type.flags & ts.TypeFlags.EnumLiteral) !== 0;
}

/**
 * Returns true when a type is an enum.
 *
 * @param type - TypeScript type to inspect.
 * @returns True when the type symbol is an enum.
 */
function isEnumType(type: Readonly<ts.Type>): boolean {
  const symbol = type.getSymbol();
  return symbol !== undefined && (symbol.flags & ts.SymbolFlags.Enum) !== 0;
}

/**
 * Returns true when a type is boolean literal `true` or `false`.
 *
 * @param type - TypeScript type to inspect.
 * @returns True when the type is a boolean literal.
 */
function isFiniteBooleanLiteralType(type: Readonly<ts.Type>): boolean {
  return (type.flags & ts.TypeFlags.BooleanLiteral) !== 0;
}

/**
 * Returns true when a type is a numeric literal.
 *
 * @param type - TypeScript type to inspect.
 * @returns True when the type is a number literal.
 */
function isNumberLiteralType(type: Readonly<ts.Type>): type is ts.NumberLiteralType {
  return (type.flags & ts.TypeFlags.NumberLiteral) !== 0;
}

/**
 * Returns true when a type is a string literal.
 *
 * @param type - TypeScript type to inspect.
 * @returns True when the type is a string literal.
 */
function isStringLiteralType(type: Readonly<ts.Type>): type is ts.StringLiteralType {
  return (type.flags & ts.TypeFlags.StringLiteral) !== 0;
}

/**
 * Returns true when a type is a union.
 *
 * @param type - TypeScript type to inspect.
 * @returns True when the type is a union.
 */
function isUnionType(type: Readonly<ts.Type>): type is ts.UnionType {
  return (type.flags & ts.TypeFlags.Union) !== 0;
}

/**
 * Normalizes a switch case AST node to a stable text representation.
 *
 * @param sourceCode - ESLint source code helper.
 * @param node - Case test expression.
 * @returns Normalized case text.
 */
function normalizeCaseText(
  sourceCode: Readonly<TSESLint.SourceCode>,
  node: Readonly<TSESTree.Expression>,
): string {
  if (node.type === AST_NODE_TYPES.Literal && typeof node.value === 'string') {
    return JSON.stringify(node.value);
  }
  return sourceCode.getText(node);
}

/** ESLint rule that requires exhaustive switches over finite discriminant types. */
export const requireExhaustiveSwitch = createRule({
  name: 'require-exhaustive-switch',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Require exhaustive switch statements over finite union, enum, and boolean discriminants',
    },
    messages: {
      requireExhaustiveSwitch:
        'Switch is not exhaustive; add cases for: {{cases}} or add a default branch.',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createRequireExhaustiveSwitchListeners,
});

export default requireExhaustiveSwitch;

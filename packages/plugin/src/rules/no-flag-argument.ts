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
import type { FunctionNode } from '../helpers/ast-guards';
import { createFunctionNodeListeners } from './support/function-listeners';
import { createRule } from './support/rule-factory';

type NoFlagArgumentContext = Readonly<TSESLint.RuleContext<'noFlagArgument', []>>;

/**
 * Checks one function node for boolean flag parameters.
 *
 * @param context - ESLint rule context.
 * @param node - Function node to inspect.
 */
function checkFunctionNode(context: NoFlagArgumentContext, node: FunctionNode): void {
  for (const parameter of node.params) {
    const parameterIdentifier = getParameterIdentifier(parameter);
    if (parameterIdentifier === null || !hasBooleanTypeAnnotation(parameterIdentifier)) {
      continue;
    }
    reportFlagParameter(context, parameter, parameterIdentifier.name);
  }
}

/**
 * Creates visitors that report boolean flag parameters.
 *
 * @param context - ESLint rule context.
 * @returns Rule visitor map.
 */
function createNoFlagArgumentListeners(context: NoFlagArgumentContext): TSESLint.RuleListener {
  return createFunctionNodeListeners(checkFunctionNode.bind(undefined, context));
}

/**
 * Returns identifier node for supported parameters.
 *
 * @param parameter - Function parameter node.
 * @returns Identifier node for direct/defaulted parameters, otherwise null.
 */
function getParameterIdentifier(parameter: TSESTree.Parameter): TSESTree.Identifier | null {
  if (parameter.type === AST_NODE_TYPES.Identifier) {
    return parameter;
  }
  if (
    parameter.type === AST_NODE_TYPES.AssignmentPattern &&
    parameter.left.type === AST_NODE_TYPES.Identifier
  ) {
    return parameter.left;
  }
  return null;
}

/**
 * Returns true when identifier has explicit boolean type annotation.
 *
 * @param identifier - Identifier node.
 * @returns True if identifier type is boolean.
 */
function hasBooleanTypeAnnotation(identifier: TSESTree.Identifier): boolean {
  return identifier.typeAnnotation?.typeAnnotation.type === AST_NODE_TYPES.TSBooleanKeyword;
}

/**
 * Reports one boolean flag parameter.
 *
 * @param context - ESLint rule context.
 * @param parameter - Boolean parameter node.
 * @param parameterName - Boolean parameter name.
 */
function reportFlagParameter(
  context: NoFlagArgumentContext,
  parameter: TSESTree.Parameter,
  parameterName: string,
): void {
  context.report({
    node: parameter,
    messageId: 'noFlagArgument',
    data: { name: parameterName },
  });
}

/** Disallows boolean flag parameters to encourage explicit methods/commands. */
export const noFlagArgument = createRule({
  name: 'no-flag-argument',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow boolean flag arguments in function declarations; prefer explicit methods or command objects',
    },
    messages: {
      noFlagArgument:
        'Parameter "{{name}}" is a boolean flag; refactor with explicit methods, a parameter object, or a command',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createNoFlagArgumentListeners,
});

export default noFlagArgument;

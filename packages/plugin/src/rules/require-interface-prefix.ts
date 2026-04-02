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
import { INTERFACE_REQUIRED_PREFIX } from './support/rule-constants';
import { createRule } from './support/rule-factory';

const INTERFACE_SECOND_CHARACTER_INDEX = 1;
const INTERFACE_MINIMUM_LENGTH = 2;

type RequireInterfacePrefixContext = Readonly<TSESLint.RuleContext<'interfacePrefix', []>>;

/**
 * Checks a TypeScript interface declaration for proper naming.
 *
 * @param context - ESLint rule execution context.
 * @param node - The TSInterfaceDeclaration node to check.
 */
function checkTSInterfaceDeclaration(
  context: RequireInterfacePrefixContext,
  node: TSESTree.TSInterfaceDeclaration,
): void {
  const interfaceName = node.id.name;
  if (isValidInterfaceName(interfaceName)) {
    return;
  }
  context.report({
    node: node.id,
    messageId: 'interfacePrefix',
    data: { name: interfaceName },
  });
}

/**
 * Creates listeners for require-interface-prefix rule execution.
 *
 * @param context - ESLint rule execution context.
 * @returns Rule listeners.
 */
function createRequireInterfacePrefixListeners(
  context: RequireInterfacePrefixContext,
): TSESLint.RuleListener {
  return {
    TSInterfaceDeclaration: checkTSInterfaceDeclaration.bind(undefined, context),
  };
}

/**
 * Checks if an interface name follows the required naming convention.
 *
 * @param interfaceName - The interface name to validate.
 * @returns True if the name is valid, false otherwise.
 */
function isValidInterfaceName(interfaceName: string): boolean {
  if (!interfaceName.startsWith(INTERFACE_REQUIRED_PREFIX)) {
    return false;
  }
  if (interfaceName.length < INTERFACE_MINIMUM_LENGTH) {
    return false;
  }
  return /[A-Z]/u.test(interfaceName[INTERFACE_SECOND_CHARACTER_INDEX]);
}

/**
 * ESLint rule that enforces interface names start with "I".
 */
export const requireInterfacePrefix = createRule({
  name: 'require-interface-prefix',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce that interface names start with "I"',
    },
    messages: {
      interfacePrefix: 'Interface name "{{name}}" should start with "I"',
    },
    schema: [],
  },
  defaultOptions: [],
  create: createRequireInterfacePrefixListeners,
});

export default requireInterfacePrefix;

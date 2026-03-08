import { ESLintUtils } from '@typescript-eslint/utils';
import { RULE_CREATOR_URL } from './constants';

/**
 * Builds the canonical documentation URL for a rule.
 *
 * @param name - Rule name.
 * @returns Fully qualified docs URL.
 */
function createRuleDocumentationUrl(name: string): string {
  return `${RULE_CREATOR_URL}${name}`;
}

/**
 * Shared ESLint RuleCreator instance used by all plugin rules.
 */
export const createRule = ESLintUtils.RuleCreator(createRuleDocumentationUrl);

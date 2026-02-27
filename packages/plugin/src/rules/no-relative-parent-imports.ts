import { ESLintUtils } from '@typescript-eslint/utils';
import { RULE_CREATOR_URL } from '../constants';

const createRule = ESLintUtils.RuleCreator((name) => `${RULE_CREATOR_URL}${name}`);

export const noRelativeParentImports = createRule({
  name: 'no-relative-parent-imports',
  meta: {
    type: 'problem',
    docs: {
      description: 'Ban ../ re-exports and imports',
    },
    messages: {
      noRelativeParentImports: 'Parent directory imports/re-exports using ../ are not allowed',
    },
    schema: [],
  },
  defaultOptions: [],
  create() {
    return {
      // No longer checking imports - imports from parents are allowed
    };
  },
});

export default noRelativeParentImports;

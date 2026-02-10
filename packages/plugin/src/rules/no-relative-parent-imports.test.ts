import { TSESLint } from '@typescript-eslint/utils';
import { noRelativeParentImports } from './no-relative-parent-imports';

const ruleTester = new TSESLint.RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
});

ruleTester.run('no-relative-parent-imports', noRelativeParentImports, {
  valid: [
    {
      code: 'import { foo } from "./sibling";',
    },
    {
      code: 'import { bar } from "./child/module";',
    },
    {
      code: 'import pkg from "package-name";',
    },
    {
      code: 'export { foo } from "./sibling";',
    },
  ],
  invalid: [
    {
      code: 'import { foo } from "../parent";',
      errors: [
        {
          messageId: 'noRelativeParentImports',
        },
      ],
    },
    {
      code: 'import { bar } from "../../grandparent";',
      errors: [
        {
          messageId: 'noRelativeParentImports',
        },
      ],
    },
    {
      code: 'export { foo } from "../parent";',
      errors: [
        {
          messageId: 'noRelativeParentImports',
        },
      ],
    },
    {
      code: 'export * from "../parent/module";',
      errors: [
        {
          messageId: 'noRelativeParentImports',
        },
      ],
    },
  ],
});

import { TSESLint } from '@typescript-eslint/utils';
import { noRelativeParentImports } from './no-relative-parent-imports';

const ruleTester = new TSESLint.RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
});

ruleTester.run('no-relative-parent-imports', noRelativeParentImports, {
  valid: [
    {
      code: 'import { foo } from "./sibling";',
      name: 'same directory import',
    },
    {
      code: 'import { bar } from "./child/module";',
      name: 'child directory import',
    },
    {
      code: 'import pkg from "package-name";',
      name: 'npm package import',
    },
    {
      code: 'export { foo } from "./sibling";',
      name: 'same directory re-export',
    },
    {
      code: 'import type { IUser } from "./types";',
      name: 'type-only import from sibling',
    },
    {
      code: 'export type { IUser } from "./types";',
      name: 'type-only re-export from sibling',
    },
    {
      code: 'import("./dynamic-module");',
      name: 'dynamic import from sibling',
    },
    {
      code: 'import { foo } from "@/utils";',
      name: 'path alias import',
    },
    {
      code: 'import { bar } from "~/components";',
      name: 'tilde path alias import',
    },
  ],
  invalid: [
    {
      code: 'import { foo } from "../parent";',
      name: 'parent directory import',
      errors: [
        {
          messageId: 'noRelativeParentImports',
        },
      ],
    },
    {
      code: 'import { bar } from "../../grandparent";',
      name: 'grandparent directory import',
      errors: [
        {
          messageId: 'noRelativeParentImports',
        },
      ],
    },
    {
      code: 'export { foo } from "../parent";',
      name: 'parent directory re-export',
      errors: [
        {
          messageId: 'noRelativeParentImports',
        },
      ],
    },
    {
      code: 'export * from "../parent/module";',
      name: 'wildcard re-export from parent',
      errors: [
        {
          messageId: 'noRelativeParentImports',
        },
      ],
    },
    {
      code: 'import type { IUser } from "../types";',
      name: 'type-only import from parent',
      errors: [
        {
          messageId: 'noRelativeParentImports',
        },
      ],
    },
    {
      code: 'export type { IUser } from "../types";',
      name: 'type-only re-export from parent',
      errors: [
        {
          messageId: 'noRelativeParentImports',
        },
      ],
    },
    {
      code: 'import { foo } from "../../../deeply/nested";',
      name: 'deeply nested parent import',
      errors: [
        {
          messageId: 'noRelativeParentImports',
        },
      ],
    },
    {
      code: 'export * as namespace from "../parent";',
      name: 'namespace re-export from parent',
      errors: [
        {
          messageId: 'noRelativeParentImports',
        },
      ],
    },
  ],
});

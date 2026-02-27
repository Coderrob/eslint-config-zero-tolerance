import { RuleTester } from '@typescript-eslint/rule-tester';
import * as tsParser from '@typescript-eslint/parser';
import { noRelativeParentImports } from './no-relative-parent-imports';

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsParser,
  },
} as any);

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
      name: 'same directory re-export (allowed)',
    },
    {
      code: 'export { foo } from "../sibling";',
      name: 'peer directory re-export (allowed)',
    },
    {
      code: 'export * from "../parent";',
      name: 'parent directory re-export (allowed by this rule)',
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
    {
      code: 'import { foo } from "../parent";',
      name: 'parent directory import (now allowed)',
    },
    {
      code: 'import { bar } from "../../grandparent";',
      name: 'grandparent directory import (now allowed)',
    },
    {
      code: 'import type { IUser } from "../types";',
      name: 'type-only import from parent (now allowed)',
    },
    {
      code: 'import { foo } from "../../../deeply/nested";',
      name: 'deeply nested parent import (now allowed)',
    },
  ],
  invalid: [
    // No invalid cases - all imports are allowed
  ],
} as any);

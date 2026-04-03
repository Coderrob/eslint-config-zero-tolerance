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

import { ruleTester } from '../testing/test-helper';
import { requireExportedObjectType } from './require-exported-object-type';

ruleTester.run('require-exported-object-type', requireExportedObjectType, {
  valid: [
    {
      code: "export const STATUS: Readonly<Record<string, string>> = Object.freeze({ Active: 'active' });",
      name: 'should allow exported frozen object constants with an explicit type annotation',
    },
    {
      code: "export const STATUS: Record<string, string> = { Active: 'active' };",
      name: 'should allow exported object literals with an explicit type annotation',
    },
    {
      code: "const STATUS = Object.freeze({ Active: 'active' });",
      name: 'should allow non-exported frozen object constants without a type annotation',
    },
    {
      code: "const STATUS: Readonly<Record<string, string>> = { Active: 'active' }; export { STATUS };",
      name: 'should allow indirectly exported object constants with an explicit type annotation',
    },
    {
      code: 'export const STATUS = createStatusMap();',
      name: 'should allow exported non-object factory results without a type annotation',
    },
  ],
  invalid: [
    {
      code: "export const STATUS = Object.freeze({ Active: 'active' });",
      name: 'should report exported frozen object constants without a type annotation',
      errors: [
        {
          messageId: 'requireExportedObjectType',
        },
      ],
    },
    {
      code: "export const STATUS = { Active: 'active' };",
      name: 'should report exported object literals without a type annotation',
      errors: [
        {
          messageId: 'requireExportedObjectType',
        },
      ],
    },
    {
      code: "const STATUS = Object.freeze({ Active: 'active' }); export { STATUS as StatusMap };",
      name: 'should report indirectly exported frozen object constants without a type annotation',
      errors: [
        {
          messageId: 'requireExportedObjectType',
        },
      ],
    },
    {
      code: "export const STATUS = Object.freeze({ Active: 'active' } as const);",
      name: 'should report exported frozen object constants with wrapper expressions but no type annotation',
      errors: [
        {
          messageId: 'requireExportedObjectType',
        },
      ],
    },
  ],
});

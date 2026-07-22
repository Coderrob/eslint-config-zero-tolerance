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

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { createSchemaValidator, extractNamedExports } from './validate-bdd-specs.mjs';
import { validateBuiltRegistration } from './validate-rule-naming.mjs';

test('should validate complete BDD structure through the shared JSON Schema', () => {
  const schema = JSON.parse(readFileSync(new URL('../bdd-spec.schema.json', import.meta.url)));
  const validate = createSchemaValidator(schema);
  const document = {
    $schema: '../../../../bdd-spec.schema.json',
    schemaVersion: '1.0.0',
    sourceFile: 'packages/plugin/src/rules/example.ts',
    module: { name: 'example', description: 'Example rule.', exports: ['example'] },
    specifications: [
      {
        feature: 'Example behavior',
        scenarios: [
          { name: 'should report an example', given: 'input', when: 'linted', then: 'reported' },
        ],
      },
    ],
  };

  assert.equal(validate(document), true);
  document.specifications[0].scenarios[0].name = 'reports an example';
  assert.equal(validate(document), false);
  assert.equal(
    validate.errors?.some((error) => error.keyword === 'pattern'),
    true,
  );
});

test('should discover direct, aliased, destructured, and type exports with TypeScript syntax', () => {
  const exports = extractNamedExports(`
    export const direct = 1, { nested } = value;
    const local = 1;
    export { local as alias };
    export type Example = string;
    export default direct;
  `);

  assert.deepEqual([...exports].sort(), ['Example', 'alias', 'direct', 'nested']);
});

test('should identify missing and unexpected built registrations', () => {
  const plugin = {
    rules: { alpha: {}, extra: {} },
  };

  assert.deepEqual(validateBuiltRegistration(plugin, ['alpha', 'missing']), [
    'plugin rules registry: missing rule "missing"',
    'plugin rules registry: unexpected rule "extra"',
  ]);
});

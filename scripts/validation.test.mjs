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
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, test } from 'node:test';
import { createSchemaValidator, extractNamedExports } from './validate-bdd-specs.mjs';
import { inspectRuleSource, validateBuiltRegistration } from './validate-rule-naming.mjs';

const temporaryDirectories = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

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

test('should inspect rule naming independently of TypeScript formatting', () => {
  const directory = mkdtempSync(join(tmpdir(), 'zero-tolerance-validation-'));
  temporaryDirectories.push(directory);
  const rulePath = join(directory, 'example-rule.ts');
  writeFileSync(
    rulePath,
    `export const exampleRule = createRule(
      {
        name: 'example-rule',
        meta: {}, defaultOptions: [], create() { return {}; }
      }
    );
    export default exampleRule;`,
  );

  assert.deepEqual(inspectRuleSource(rulePath), {
    configuredName: 'example-rule',
    defaultExport: 'exampleRule',
    namedExport: 'exampleRule',
  });
});

test('should identify missing and unexpected built registrations and preset entries', () => {
  const plugin = {
    rules: { alpha: {}, extra: {} },
    configs: Object.fromEntries(
      ['recommended', 'strict', 'legacy-recommended', 'legacy-strict'].map((name) => [
        name,
        { rules: { 'scope/alpha': 'error', 'scope/extra': 'off' } },
      ]),
    ),
  };

  assert.deepEqual(validateBuiltRegistration(plugin, ['alpha', 'missing']), [
    'plugin rules registry: missing rule "missing"',
    'plugin rules registry: unexpected rule "extra"',
  ]);
});

import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as tsParser from '@typescript-eslint/parser';
import { RuleTester } from '@typescript-eslint/rule-tester';
import { RequireBddSpecMessageId, requireBddSpec } from './require-bdd-spec';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const tmpDir = mkdtempSync(join(tmpdir(), 'require-bdd-spec-test-'));
const THEN_FIELD = 'then';

afterAll(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

/** Absolute path to a fixture source file. Creates the file with the given content. */
function buildValidBddSpec(sourceFilePath: string, namedExports: string[]): unknown {
  return {
    $schema: '../../../../bdd-spec.schema.json',
    schemaVersion: '1.0.0',
    sourceFile: sourceFilePath,
    module: {
      name: 'fixture-module',
      description: 'A fixture module for testing',
      exports: namedExports,
    },
    specifications: [
      {
        feature: 'Fixture feature',
        scenarios: [
          {
            name: 'should behave correctly',
            given: 'a valid source file',
            when: 'the rule runs',
            [THEN_FIELD]: 'no errors are reported',
          },
        ],
      },
    ],
  };
}

/** Writes a sibling BDD spec for the given source file path. */
function makeBddSpec(sourceFilePath: string, spec: unknown): void {
  writeFileSync(sourceFilePath + '.bdd.json', JSON.stringify(spec, null, 2));
}

/** Builds a minimal valid BDD spec object for a source file with given named exports. */
function makeSourceFile(name: string, content: string): string {
  const filePath = join(tmpDir, name);
  writeFileSync(filePath, content);
  return filePath;
}

// ─── Fixture setup ─────────────────────────────────────────────────────────────

// Valid: source with exported const and a valid BDD spec
const validSourceFile = makeSourceFile('valid-source.ts', 'export const myHelper = 1;\n');
makeBddSpec(validSourceFile, buildValidBddSpec(validSourceFile, ['myHelper']));

// Valid: source with multiple exports and a matching BDD spec
const multiExportSourceFile = makeSourceFile(
  'multi-export-source.ts',
  'export function doThing(): void {}\nexport type MyType = string;\n',
);
makeBddSpec(multiExportSourceFile, buildValidBddSpec(multiExportSourceFile, ['doThing', 'MyType']));

// Valid: source with no named exports and an empty exports list in the BDD spec
const noExportSourceFile = makeSourceFile('no-export-source.ts', 'const x = 1;\n');
makeBddSpec(noExportSourceFile, buildValidBddSpec(noExportSourceFile, []));

// Invalid: BDD spec missing entirely
const missingSpecSourceFile = makeSourceFile('missing-spec-source.ts', 'export const a = 1;\n');

// Invalid: BDD spec is malformed JSON
const malformedJsonSourceFile = makeSourceFile('malformed-json-source.ts', 'export const b = 2;\n');
writeFileSync(malformedJsonSourceFile + '.bdd.json', '{ this is not valid json }');

// Invalid: BDD spec missing required top-level fields
const missingFieldsSourceFile = makeSourceFile('missing-fields-source.ts', 'export const c = 3;\n');
makeBddSpec(missingFieldsSourceFile, { $schema: 'some-schema.json' });

// Invalid: BDD spec with wrong schemaVersion
const wrongVersionSourceFile = makeSourceFile('wrong-version-source.ts', 'export const d = 4;\n');
makeBddSpec(wrongVersionSourceFile, {
  $schema: '../../../../bdd-spec.schema.json',
  schemaVersion: '2.0.0',
  sourceFile: wrongVersionSourceFile,
  module: { name: 'x', description: 'x', exports: ['d'] },
  specifications: [
    {
      feature: 'f',
      scenarios: [{ name: 'should x', given: 'g', when: 'w', [THEN_FIELD]: 't' }],
    },
  ],
});

// Invalid: BDD spec has export in module.exports that is not in the source
const missingExportInSourceFile = makeSourceFile(
  'missing-export-in-source.ts',
  'export const real = 1;\n',
);
makeBddSpec(
  missingExportInSourceFile,
  buildValidBddSpec(missingExportInSourceFile, ['real', 'nonExistent']),
);

// Invalid: BDD spec is missing an export that is in the source
const missingExportInSpecFile = makeSourceFile(
  'missing-export-in-spec.ts',
  'export const foo = 1;\nexport const bar = 2;\n',
);
makeBddSpec(missingExportInSpecFile, buildValidBddSpec(missingExportInSpecFile, ['foo']));

// Invalid: specifications array is empty
const emptySpecificationsSourceFile = makeSourceFile(
  'empty-specifications-source.ts',
  'export const e = 5;\n',
);
makeBddSpec(emptySpecificationsSourceFile, {
  $schema: '../../../../bdd-spec.schema.json',
  schemaVersion: '1.0.0',
  sourceFile: emptySpecificationsSourceFile,
  module: { name: 'e', description: 'e', exports: ['e'] },
  specifications: [],
});

// Invalid: scenario name does not start with "should"
const badScenarioNameSourceFile = makeSourceFile(
  'bad-scenario-name-source.ts',
  'export const f = 6;\n',
);
makeBddSpec(badScenarioNameSourceFile, {
  $schema: '../../../../bdd-spec.schema.json',
  schemaVersion: '1.0.0',
  sourceFile: badScenarioNameSourceFile,
  module: { name: 'f', description: 'f', exports: ['f'] },
  specifications: [
    {
      feature: 'Feature f',
      scenarios: [{ name: 'does something bad', given: 'g', when: 'w', [THEN_FIELD]: 't' }],
    },
  ],
});

// Invalid: module.exports is not an array
const modExportsNotArraySourceFile = makeSourceFile(
  'mod-exports-not-array-source.ts',
  'export const g = 7;\n',
);
makeBddSpec(modExportsNotArraySourceFile, {
  $schema: '../../../../bdd-spec.schema.json',
  schemaVersion: '1.0.0',
  sourceFile: modExportsNotArraySourceFile,
  module: { name: 'g', description: 'g', exports: 'g' },
  specifications: [
    {
      feature: 'Feature g',
      scenarios: [{ name: 'should something', given: 'g', when: 'w', [THEN_FIELD]: 't' }],
    },
  ],
});

// Invalid: scenario missing required "then" field
const missingThenSourceFile = makeSourceFile('missing-then-source.ts', 'export const h = 8;\n');
makeBddSpec(missingThenSourceFile, {
  $schema: '../../../../bdd-spec.schema.json',
  schemaVersion: '1.0.0',
  sourceFile: missingThenSourceFile,
  module: { name: 'h', description: 'h', exports: ['h'] },
  specifications: [
    {
      feature: 'Feature h',
      scenarios: [{ name: 'should do something', given: 'g', when: 'w' }],
    },
  ],
});

// Valid: export-list alias should be treated as exported alias name.
const exportListAliasSourceFile = makeSourceFile(
  'export-list-alias-source.ts',
  'const helper = 1;\nexport { helper as helperAlias };\n',
);
makeBddSpec(
  exportListAliasSourceFile,
  buildValidBddSpec(exportListAliasSourceFile, ['helperAlias']),
);

// Invalid: module.description is missing.
const missingModuleDescriptionSourceFile = makeSourceFile(
  'missing-module-description-source.ts',
  'export const i = 9;\n',
);
makeBddSpec(missingModuleDescriptionSourceFile, {
  $schema: '../../../../bdd-spec.schema.json',
  schemaVersion: '1.0.0',
  sourceFile: missingModuleDescriptionSourceFile,
  module: { name: 'i', exports: ['i'] },
  specifications: [
    {
      feature: 'Feature i',
      scenarios: [{ name: 'should do i', given: 'g', when: 'w', [THEN_FIELD]: 't' }],
    },
  ],
});

// Invalid: feature entry is not an object.
const nonObjectFeatureSourceFile = makeSourceFile(
  'non-object-feature-source.ts',
  'export const j = 10;\n',
);
makeBddSpec(nonObjectFeatureSourceFile, {
  $schema: '../../../../bdd-spec.schema.json',
  schemaVersion: '1.0.0',
  sourceFile: nonObjectFeatureSourceFile,
  module: { name: 'j', description: 'j', exports: ['j'] },
  specifications: ['not-an-object'],
});

// Invalid: scenarios field is not an array.
const scenariosNotArraySourceFile = makeSourceFile(
  'scenarios-not-array-source.ts',
  'export const k = 11;\n',
);
makeBddSpec(scenariosNotArraySourceFile, {
  $schema: '../../../../bdd-spec.schema.json',
  schemaVersion: '1.0.0',
  sourceFile: scenariosNotArraySourceFile,
  module: { name: 'k', description: 'k', exports: ['k'] },
  specifications: [{ feature: 'Feature k', scenarios: 'not-array' }],
});

// Invalid: top-level module field has the wrong type.
const badModuleTypeSourceFile = makeSourceFile(
  'bad-module-type-source.ts',
  'export const l = 12;\n',
);
makeBddSpec(badModuleTypeSourceFile, {
  $schema: '../../../../bdd-spec.schema.json',
  schemaVersion: '1.0.0',
  sourceFile: badModuleTypeSourceFile,
  module: 'wrong-type',
  specifications: [
    {
      feature: 'Feature l',
      scenarios: [{ name: 'should do l', given: 'g', when: 'w', [THEN_FIELD]: 't' }],
    },
  ],
});

// Invalid: feature name is missing.
const missingFeatureNameSourceFile = makeSourceFile(
  'missing-feature-name-source.ts',
  'export const m = 13;\n',
);
makeBddSpec(missingFeatureNameSourceFile, {
  $schema: '../../../../bdd-spec.schema.json',
  schemaVersion: '1.0.0',
  sourceFile: missingFeatureNameSourceFile,
  module: { name: 'm', description: 'm', exports: ['m'] },
  specifications: [
    {
      scenarios: [{ name: 'should do m', given: 'g', when: 'w', [THEN_FIELD]: 't' }],
    },
  ],
});

// Invalid: feature scenarios array is empty.
const emptyFeatureScenariosSourceFile = makeSourceFile(
  'empty-feature-scenarios-source.ts',
  'export const n = 14;\n',
);
makeBddSpec(emptyFeatureScenariosSourceFile, {
  $schema: '../../../../bdd-spec.schema.json',
  schemaVersion: '1.0.0',
  sourceFile: emptyFeatureScenariosSourceFile,
  module: { name: 'n', description: 'n', exports: ['n'] },
  specifications: [{ feature: 'Feature n', scenarios: [] }],
});

// Invalid: sourceFile is an empty string.
const emptySourceFileFieldSourceFile = makeSourceFile(
  'empty-source-file-field-source.ts',
  'export const o = 15;\n',
);
makeBddSpec(emptySourceFileFieldSourceFile, {
  $schema: '../../../../bdd-spec.schema.json',
  schemaVersion: '1.0.0',
  sourceFile: '',
  module: { name: 'o', description: 'o', exports: ['o'] },
  specifications: [
    {
      feature: 'Feature o',
      scenarios: [{ name: 'should do o', given: 'g', when: 'w', [THEN_FIELD]: 't' }],
    },
  ],
});

// Invalid: sourceFile points to a missing file.
const missingSourceFilePathSourceFile = makeSourceFile(
  'missing-source-file-path-source.ts',
  'export const p = 16;\n',
);
makeBddSpec(missingSourceFilePathSourceFile, {
  $schema: '../../../../bdd-spec.schema.json',
  schemaVersion: '1.0.0',
  sourceFile: join(tmpDir, 'does-not-exist.ts'),
  module: { name: 'p', description: 'p', exports: ['p'] },
  specifications: [
    {
      feature: 'Feature p',
      scenarios: [{ name: 'should do p', given: 'g', when: 'w', [THEN_FIELD]: 't' }],
    },
  ],
});

// Invalid: sourceFile has wrong type.
const nonStringSourceFileFieldSourceFile = makeSourceFile(
  'non-string-source-file-field-source.ts',
  'export const q = 17;\n',
);
makeBddSpec(nonStringSourceFileFieldSourceFile, {
  $schema: '../../../../bdd-spec.schema.json',
  schemaVersion: '1.0.0',
  sourceFile: 123,
  module: { name: 'q', description: 'q', exports: ['q'] },
  specifications: [
    {
      feature: 'Feature q',
      scenarios: [{ name: 'should do q', given: 'g', when: 'w', [THEN_FIELD]: 't' }],
    },
  ],
});

// Invalid: specifications has wrong top-level type.
const nonArraySpecificationsSourceFile = makeSourceFile(
  'non-array-specifications-source.ts',
  'export const r = 18;\n',
);
makeBddSpec(nonArraySpecificationsSourceFile, {
  $schema: '../../../../bdd-spec.schema.json',
  schemaVersion: '1.0.0',
  sourceFile: nonArraySpecificationsSourceFile,
  module: { name: 'r', description: 'r', exports: ['r'] },
  specifications: 'not-array',
});

// Invalid: root spec value is not an object.
const rootArraySpecSourceFile = makeSourceFile(
  'root-array-spec-source.ts',
  'export const s = 19;\n',
);
writeFileSync(rootArraySpecSourceFile + '.bdd.json', '[]');

// Invalid: module.name is missing.
const missingModuleNameSourceFile = makeSourceFile(
  'missing-module-name-source.ts',
  'export const t = 20;\n',
);
makeBddSpec(missingModuleNameSourceFile, {
  $schema: '../../../../bdd-spec.schema.json',
  schemaVersion: '1.0.0',
  sourceFile: missingModuleNameSourceFile,
  module: { description: 't', exports: ['t'] },
  specifications: [
    {
      feature: 'Feature t',
      scenarios: [{ name: 'should do t', given: 'g', when: 'w', [THEN_FIELD]: 't' }],
    },
  ],
});

// Invalid: $schema has wrong type.
const nonStringSchemaFieldSourceFile = makeSourceFile(
  'non-string-schema-field-source.ts',
  'export const u = 21;\n',
);
makeBddSpec(nonStringSchemaFieldSourceFile, {
  $schema: 42,
  schemaVersion: '1.0.0',
  sourceFile: nonStringSchemaFieldSourceFile,
  module: { name: 'u', description: 'u', exports: ['u'] },
  specifications: [
    {
      feature: 'Feature u',
      scenarios: [{ name: 'should do u', given: 'g', when: 'w', [THEN_FIELD]: 't' }],
    },
  ],
});

// Invalid: module.exports contains an empty string entry.
const invalidModuleExportEntrySourceFile = makeSourceFile(
  'invalid-module-export-entry-source.ts',
  'export const v = 22;\n',
);
makeBddSpec(invalidModuleExportEntrySourceFile, {
  $schema: '../../../../bdd-spec.schema.json',
  schemaVersion: '1.0.0',
  sourceFile: invalidModuleExportEntrySourceFile,
  module: { name: 'v', description: 'v', exports: ['v', ''] },
  specifications: [
    {
      feature: 'Feature v',
      scenarios: [{ name: 'should do v', given: 'g', when: 'w', [THEN_FIELD]: 't' }],
    },
  ],
});

// Invalid: scenario entry is not an object.
const nonObjectScenarioSourceFile = makeSourceFile(
  'non-object-scenario-source.ts',
  'export const w = 23;\n',
);
makeBddSpec(nonObjectScenarioSourceFile, {
  $schema: '../../../../bdd-spec.schema.json',
  schemaVersion: '1.0.0',
  sourceFile: nonObjectScenarioSourceFile,
  module: { name: 'w', description: 'w', exports: ['w'] },
  specifications: [{ feature: 'Feature w', scenarios: [123] }],
});

// Invalid: scenario missing name triggers should-prefix early return path.
const missingScenarioNameSourceFile = makeSourceFile(
  'missing-scenario-name-source.ts',
  'export const x = 24;\n',
);
makeBddSpec(missingScenarioNameSourceFile, {
  $schema: '../../../../bdd-spec.schema.json',
  schemaVersion: '1.0.0',
  sourceFile: missingScenarioNameSourceFile,
  module: { name: 'x', description: 'x', exports: ['x'] },
  specifications: [
    {
      feature: 'Feature x',
      scenarios: [{ given: 'g', when: 'w', [THEN_FIELD]: 't' }],
    },
  ],
});

// Valid: trailing comma in export list exercises empty-segment handling.
const trailingCommaExportListSourceFile = makeSourceFile(
  'trailing-comma-export-list-source.ts',
  'const helper = 1;\nexport { helper as helperAlias, };\n',
);
makeBddSpec(
  trailingCommaExportListSourceFile,
  buildValidBddSpec(trailingCommaExportListSourceFile, ['helperAlias']),
);

// ─── Rule tester setup ────────────────────────────────────────────────────────

const ruleTestConfig = {
  languageOptions: {
    parser: tsParser,
  },
};
const ruleTester = new RuleTester(ruleTestConfig);

ruleTester.run('require-bdd-spec', requireBddSpec, {
  valid: [
    {
      name: 'should skip test files (no BDD spec check)',
      code: 'export const myRule = 1;',
      filename: join(tmpDir, 'some-rule.test.ts'),
    },
    {
      name: 'should pass when source has a single export matching BDD spec',
      code: 'export const myHelper = 1;',
      filename: validSourceFile,
    },
    {
      name: 'should pass when source has multiple exports all listed in BDD spec',
      code: 'export function doThing(): void {}\nexport type MyType = string;',
      filename: multiExportSourceFile,
    },
    {
      name: 'should pass when source has no exports and BDD spec exports list is empty',
      code: 'const x = 1;',
      filename: noExportSourceFile,
    },
    {
      name: 'should pass when source uses export-list alias and BDD spec matches alias',
      code: 'const helper = 1;\nexport { helper as helperAlias };',
      filename: exportListAliasSourceFile,
    },
    {
      name: 'should pass when export lists contain trailing commas',
      code: 'const helper = 1;\nexport { helper as helperAlias, };',
      filename: trailingCommaExportListSourceFile,
    },
  ],
  invalid: [
    {
      name: 'should report missing BDD spec file',
      code: 'export const a = 1;',
      filename: missingSpecSourceFile,
      errors: [{ messageId: RequireBddSpecMessageId.MissingBddSpec }],
    },
    {
      name: 'should report malformed JSON in BDD spec',
      code: 'export const b = 2;',
      filename: malformedJsonSourceFile,
      errors: [{ messageId: RequireBddSpecMessageId.InvalidBddSpec }],
    },
    {
      name: 'should report missing required top-level fields',
      code: 'export const c = 3;',
      filename: missingFieldsSourceFile,
      errors: [{ messageId: RequireBddSpecMessageId.InvalidBddSpec }],
    },
    {
      name: 'should report wrong schemaVersion value',
      code: 'export const d = 4;',
      filename: wrongVersionSourceFile,
      errors: [{ messageId: RequireBddSpecMessageId.InvalidBddSpec }],
    },
    {
      name: 'should report export listed in BDD spec but missing from source',
      code: 'export const real = 1;',
      filename: missingExportInSourceFile,
      errors: [{ messageId: RequireBddSpecMessageId.InvalidBddSpec }],
    },
    {
      name: 'should report export in source but missing from BDD spec',
      code: 'export const foo = 1;\nexport const bar = 2;',
      filename: missingExportInSpecFile,
      errors: [{ messageId: RequireBddSpecMessageId.InvalidBddSpec }],
    },
    {
      name: 'should report empty specifications array',
      code: 'export const e = 5;',
      filename: emptySpecificationsSourceFile,
      errors: [{ messageId: RequireBddSpecMessageId.InvalidBddSpec }],
    },
    {
      name: 'should report scenario name not starting with "should"',
      code: 'export const f = 6;',
      filename: badScenarioNameSourceFile,
      errors: [{ messageId: RequireBddSpecMessageId.InvalidBddSpec }],
    },
    {
      name: 'should report module.exports that is not an array',
      code: 'export const g = 7;',
      filename: modExportsNotArraySourceFile,
      errors: [{ messageId: RequireBddSpecMessageId.InvalidBddSpec }],
    },
    {
      name: 'should report scenario missing required "then" field',
      code: 'export const h = 8;',
      filename: missingThenSourceFile,
      errors: [{ messageId: RequireBddSpecMessageId.InvalidBddSpec }],
    },
    {
      name: 'should report missing module.description field',
      code: 'export const i = 9;',
      filename: missingModuleDescriptionSourceFile,
      errors: [{ messageId: RequireBddSpecMessageId.InvalidBddSpec }],
    },
    {
      name: 'should report non-object feature values',
      code: 'export const j = 10;',
      filename: nonObjectFeatureSourceFile,
      errors: [{ messageId: RequireBddSpecMessageId.InvalidBddSpec }],
    },
    {
      name: 'should report scenarios fields that are not arrays',
      code: 'export const k = 11;',
      filename: scenariosNotArraySourceFile,
      errors: [{ messageId: RequireBddSpecMessageId.InvalidBddSpec }],
    },
    {
      name: 'should report top-level module type mismatches',
      code: 'export const l = 12;',
      filename: badModuleTypeSourceFile,
      errors: [{ messageId: RequireBddSpecMessageId.InvalidBddSpec }],
    },
    {
      name: 'should report missing feature names',
      code: 'export const m = 13;',
      filename: missingFeatureNameSourceFile,
      errors: [{ messageId: RequireBddSpecMessageId.InvalidBddSpec }],
    },
    {
      name: 'should report empty feature scenarios arrays',
      code: 'export const n = 14;',
      filename: emptyFeatureScenariosSourceFile,
      errors: [{ messageId: RequireBddSpecMessageId.InvalidBddSpec }],
    },
    {
      name: 'should report empty sourceFile values',
      code: 'export const o = 15;',
      filename: emptySourceFileFieldSourceFile,
      errors: [{ messageId: RequireBddSpecMessageId.InvalidBddSpec }],
    },
    {
      name: 'should report non-existent sourceFile paths',
      code: 'export const p = 16;',
      filename: missingSourceFilePathSourceFile,
      errors: [{ messageId: RequireBddSpecMessageId.InvalidBddSpec }],
    },
    {
      name: 'should report non-string sourceFile fields',
      code: 'export const q = 17;',
      filename: nonStringSourceFileFieldSourceFile,
      errors: [{ messageId: RequireBddSpecMessageId.InvalidBddSpec }],
    },
    {
      name: 'should report non-array top-level specifications values',
      code: 'export const r = 18;',
      filename: nonArraySpecificationsSourceFile,
      errors: [{ messageId: RequireBddSpecMessageId.InvalidBddSpec }],
    },
    {
      name: 'should report non-object root spec values',
      code: 'export const s = 19;',
      filename: rootArraySpecSourceFile,
      errors: [{ messageId: RequireBddSpecMessageId.InvalidBddSpec }],
    },
    {
      name: 'should report missing module.name fields',
      code: 'export const t = 20;',
      filename: missingModuleNameSourceFile,
      errors: [{ messageId: RequireBddSpecMessageId.InvalidBddSpec }],
    },
    {
      name: 'should report non-string $schema fields',
      code: 'export const u = 21;',
      filename: nonStringSchemaFieldSourceFile,
      errors: [{ messageId: RequireBddSpecMessageId.InvalidBddSpec }],
    },
    {
      name: 'should report invalid module.exports entries',
      code: 'export const v = 22;',
      filename: invalidModuleExportEntrySourceFile,
      errors: [{ messageId: RequireBddSpecMessageId.InvalidBddSpec }],
    },
    {
      name: 'should report non-object scenarios',
      code: 'export const w = 23;',
      filename: nonObjectScenarioSourceFile,
      errors: [{ messageId: RequireBddSpecMessageId.InvalidBddSpec }],
    },
    {
      name: 'should report scenarios missing names',
      code: 'export const x = 24;',
      filename: missingScenarioNameSourceFile,
      errors: [{ messageId: RequireBddSpecMessageId.InvalidBddSpec }],
    },
  ],
});

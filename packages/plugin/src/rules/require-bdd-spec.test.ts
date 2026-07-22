import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, parse, relative } from 'node:path';
import { ruleTester } from '../testing/test-helper';
import { RequireBddSpecMessageId, requireBddSpec } from './require-bdd-spec';

const temporaryDirectory = mkdtempSync(join(tmpdir(), 'require-bdd-spec-test-'));

afterAll(() => rmSync(temporaryDirectory, { force: true, recursive: true }));

/** Creates a source fixture and its sibling BDD document. */
function createFixture(name: string, code: string, exports: readonly string[]): string {
  const sourcePath = join(temporaryDirectory, `${name}.ts`);
  writeFileSync(sourcePath, code);
  writeFileSync(
    `${sourcePath}.bdd.json`,
    JSON.stringify({ sourceFile: sourceReference(sourcePath), module: { exports } }),
  );
  return sourcePath;
}

/** Returns the workspace-relative reference expected by the rule. */
function sourceReference(sourcePath: string): string {
  return relative(parse(sourcePath).root, sourcePath).replace(/\\/gu, '/');
}

const validSource = createFixture('valid', 'export const example = true;\n', ['example']);
const allExportFormsCode = `
  export const direct = 1, { nested, renamed: alias = 1, ...objectRest } = value;
  export let [first = 1, , ...arrayRest] = values;
  export function run() {}
  export class Example {}
  export interface Contract {}
  export type Kind = string;
  export enum State { Ready }
  const local = true;
  export { local as exposed, local as 'literal-export' };
  export default direct;
`;
const allExportForms = createFixture('all-export-forms', allExportFormsCode, [
  'direct',
  'nested',
  'alias',
  'objectRest',
  'first',
  'arrayRest',
  'run',
  'Example',
  'Contract',
  'Kind',
  'State',
  'exposed',
  'literal-export',
]);
const malformedSource = createFixture('malformed', 'export const example = true;\n', ['example']);
writeFileSync(`${malformedSource}.bdd.json`, '{');
const structuralOnlySource = join(temporaryDirectory, 'structural-only.ts');
writeFileSync(structuralOnlySource, 'const internal = true;\n');
writeFileSync(`${structuralOnlySource}.bdd.json`, '[]');
const missingModuleSource = join(temporaryDirectory, 'missing-module.ts');
writeFileSync(missingModuleSource, 'const internal = true;\n');
writeFileSync(
  `${missingModuleSource}.bdd.json`,
  JSON.stringify({ sourceFile: sourceReference(missingModuleSource) }),
);
const missingExportsSource = join(temporaryDirectory, 'missing-exports.ts');
writeFileSync(missingExportsSource, 'const internal = true;\n');
writeFileSync(
  `${missingExportsSource}.bdd.json`,
  JSON.stringify({
    sourceFile: sourceReference(missingExportsSource),
    module: {},
  }),
);
const wrongReferenceSource = createFixture('wrong-reference', 'export const example = true;\n', [
  'example',
]);
writeFileSync(
  `${wrongReferenceSource}.bdd.json`,
  JSON.stringify({
    sourceFile: 'packages/plugin/src/rules/other.ts',
    module: { exports: ['example'] },
  }),
);
const exportMismatchSource = createFixture('export-mismatch', 'export const actual = true;\n', [
  'documented',
]);

ruleTester.run('require-bdd-spec', requireBddSpec, {
  valid: [
    {
      name: 'should skip test files',
      code: 'export const example = true;',
      filename: join(temporaryDirectory, 'example.test.ts'),
    },
    {
      name: 'should accept matching source references and exports',
      code: 'export const example = true;',
      filename: validSource,
    },
    {
      name: 'should derive direct, destructured, type, aliased, and literal exports from the AST',
      code: allExportFormsCode,
      filename: allExportForms,
    },
    {
      name: 'should leave structural schema validation to the workspace validator',
      code: 'const internal = true;',
      filename: structuralOnlySource,
    },
    {
      name: 'should leave missing structural module fields to the workspace validator',
      code: 'const internal = true;',
      filename: missingModuleSource,
    },
    {
      name: 'should leave missing structural export fields to the workspace validator',
      code: 'const internal = true;',
      filename: missingExportsSource,
    },
    {
      name: 'should leave malformed JSON diagnostics to the workspace validator',
      code: 'export const example = true;',
      filename: malformedSource,
    },
  ],
  invalid: [
    {
      name: 'should report a missing sibling BDD document',
      code: 'export const example = true;',
      filename: join(temporaryDirectory, 'missing.ts'),
      errors: [{ messageId: RequireBddSpecMessageId.MissingBddSpec }],
    },
    {
      name: 'should report an incorrect source reference',
      code: 'export const example = true;',
      filename: wrongReferenceSource,
      errors: [{ messageId: RequireBddSpecMessageId.InvalidBddSpec }],
    },
    {
      name: 'should report documented and actual export differences together',
      code: 'export const actual = true;',
      filename: exportMismatchSource,
      errors: [{ messageId: RequireBddSpecMessageId.InvalidBddSpec }],
    },
  ],
});

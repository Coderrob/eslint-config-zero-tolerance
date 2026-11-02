import { runInNewContext } from 'node:vm';
import * as tsParser from '@typescript-eslint/parser';
import { type ESLint, Linter } from 'eslint';
import ts from 'typescript';
import eslintPlugin from './index';

const INPUT_VALUES = [undefined, null, false, true, 0, 1, '', 'value'];
const EXPECTED_GETTER_READS = 2;
const linter = new Linter();
const plugin: ESLint.Plugin = { rules: Reflect.get(eslintPlugin, 'rules') };

function configuration(ruleName: string): Linter.Config[] {
  return [
    {
      files: ['**/*.{ts,js}'],
      languageOptions: { parser: tsParser },
      plugins: { contract: plugin },
      rules: { [`contract/${ruleName}`]: 'error' },
    },
  ];
}

function evaluate(source: string, input: unknown): unknown {
  return runInNewContext(source, { input });
}

function typeErrors(source: string): readonly ts.Diagnostic[] {
  const filename = 'contract.ts';
  const options: ts.CompilerOptions = { noEmit: true, strict: true, types: [], skipLibCheck: true };
  const originalHost = ts.createCompilerHost(options);
  const host: ts.CompilerHost = {
    ...originalHost,
    getSourceFile: (file, target, onError, shouldCreateNew) =>
      file === filename
        ? ts.createSourceFile(file, source, target)
        : originalHost.getSourceFile(file, target, onError, shouldCreateNew),
  };
  const program = ts.createProgram([filename], options, host);
  return ts.getPreEmitDiagnostics(program).filter((error) => error.file?.fileName === filename);
}

describe('rule behavioral contracts', () => {
  it('should detect a broken parameter contract after an enum conversion', () => {
    const source =
      'export enum Status { Active = "active", Inactive = "inactive" } function read(value: Status) { return value; } read("active");';
    expect(typeErrors(source).length).toBeGreaterThan(0);
  });
  it('should preserve the assignability of values and function parameters in a literal union', () => {
    const source =
      'export type Status = "active" | "inactive"; function read(value: Status) { return value; } read("active");';
    expect(typeErrors(source)).toEqual([]);
    const result = linter.verifyAndFix(source, configuration('no-literal-unions'), {
      filename: 'contract.ts',
    });
    expect(result.fixed).toBe(false);
    expect(result.output).toBe(source);
    expect(typeErrors(result.output)).toEqual([]);
    expect(result.messages.map((message) => message.messageId)).toEqual(['noLiteralUnions']);
  });
  it.each(INPUT_VALUES)('should preserve boolean results for parameter %p', (input) => {
    const source = 'function read(value) { return value ? true : false; } read(input);';
    const result = linter.verifyAndFix(source, configuration('no-redundant-boolean'));
    expect(result.fixed).toBe(true);
    expect(result.messages).toEqual([]);
    expect(evaluate(result.output, input)).toBe(evaluate(source, input));
    expect(typeof evaluate(result.output, input)).toBe('boolean');
  });

  it.each(INPUT_VALUES)(
    'should preserve fallback calls and return values for parameter %p',
    (input) => {
      const source = `function read(value) {
      let calls = 0;
      const fallback = () => { calls += 1; return 'fallback'; };
      const result = value != null ? value : fallback();
      return { result, calls };
    } read(input);`;
      const result = linter.verifyAndFix(source, configuration('prefer-nullish-coalescing'));
      expect(result.fixed).toBe(true);
      expect(result.messages).toEqual([]);
      expect(evaluate(result.output, input)).toEqual(evaluate(source, input));
    },
  );

  it('should retain getter read counts and the value returned by a repeated read', () => {
    const source = `let reads = 0;
      const object = { get value() { reads += 1; return reads; } };
      const result = object.value != null ? object.value : 0;
      ({ result, reads });`;
    const result = linter.verifyAndFix(source, configuration('prefer-nullish-coalescing'));
    expect(result.fixed).toBe(false);
    expect(result.output).toBe(source);
    expect(evaluate(result.output, undefined)).toEqual({
      result: EXPECTED_GETTER_READS,
      reads: EXPECTED_GETTER_READS,
    });
  });

  it('should retain a literal value when String is shadowed by a parameter', () => {
    const source = String.raw`function read(String) { return 'C:\\Users'; } read({ raw: () => 'wrong' });`;
    const result = linter.verifyAndFix(source, configuration('prefer-string-raw'));
    expect(result.fixed).toBe(false);
    expect(result.output).toBe(source);
    expect(evaluate(result.output, undefined)).toBe(String.raw`C:\Users`);
  });

  it('should keep runtime import order across files linted by the same instance', () => {
    const source = "import { z } from './z';\nimport { a } from './a';";
    const result = linter.verifyAndFix(source, configuration('sort-imports'));
    expect(result.fixed).toBe(false);
    expect(result.output).toBe(source);
    expect(result.messages.map((message) => message.messageId)).toEqual(['unsortedImport']);
    expect(linter.verify('', configuration('sort-imports'))).toEqual([]);
  });

  it('should isolate async binding detection between linted files', () => {
    const config = configuration('no-floating-promises');
    const first = linter.verify('async function run() {} run();', config);
    expect(first.map((message) => message.messageId)).toEqual(['noFloatingPromises']);
    expect(linter.verify('function run() {} run();', config)).toEqual([]);
    expect(linter.verify('run();', config)).toEqual([]);
  });
});

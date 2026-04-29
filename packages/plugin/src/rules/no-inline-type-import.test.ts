import { ruleTester } from '../testing/test-helper';
import { noInlineTypeImport } from './no-inline-type-import';

ruleTester.run('no-inline-type-import', noInlineTypeImport, {
  valid: [
    {
      code: `
        import type { PipelineContext } from "../types/pipeline";
        import type {
          CompilerOptions,
          Program,
          SourceFile,
          TypeChecker,
        } from "typescript";

        export interface SourceLoadResult {
          readonly context: PipelineContext;
          readonly checker: TypeChecker;
          readonly configPath?: string;
          readonly errors: readonly string[];
          readonly options: CompilerOptions;
          readonly program: Program;
          readonly sourceFiles: readonly SourceFile[];
          readonly sourceFileMap: ReadonlyMap<string, SourceFile>;
        }
      `,
      name: 'should allow top-level type imports',
    },
    {
      code: `
        import type { Program } from "typescript";

        export type ProgramFactory = () => Program;
      `,
      name: 'should allow imported types in type aliases',
    },
  ],
  invalid: [
    {
      code: `
        export interface SourceLoadResult {
          readonly context: import("../types/pipeline").PipelineContext;
          readonly checker: import("typescript").TypeChecker;
          readonly configPath?: string;
          readonly errors: readonly string[];
          readonly options: import("typescript").CompilerOptions;
          readonly program: import("typescript").Program;
          readonly sourceFiles: readonly import("typescript").SourceFile[];
          readonly sourceFileMap: ReadonlyMap<string, import("typescript").SourceFile>;
        }
      `,
      name: 'should report inline type imports in interface members',
      output: `
        import type { PipelineContext } from "../types/pipeline";
import type { CompilerOptions, Program, SourceFile, TypeChecker } from "typescript";
export interface SourceLoadResult {
          readonly context: PipelineContext;
          readonly checker: TypeChecker;
          readonly configPath?: string;
          readonly errors: readonly string[];
          readonly options: CompilerOptions;
          readonly program: Program;
          readonly sourceFiles: readonly SourceFile[];
          readonly sourceFileMap: ReadonlyMap<string, SourceFile>;
        }
      `,
      errors: [
        { messageId: 'noInlineTypeImport' },
        { messageId: 'noInlineTypeImport' },
        { messageId: 'noInlineTypeImport' },
        { messageId: 'noInlineTypeImport' },
        { messageId: 'noInlineTypeImport' },
        { messageId: 'noInlineTypeImport' },
      ],
    },
    {
      code: 'export type ProgramLike = import("typescript").Program;',
      name: 'should report inline type imports in type aliases',
      output: 'import type { Program } from "typescript";\nexport type ProgramLike = Program;',
      errors: [{ messageId: 'noInlineTypeImport' }],
    },
    {
      code: 'import type { Program } from "typescript";\nexport type ProgramLike = import("typescript").Program;',
      name: 'should reuse existing top-level type import',
      output: 'import type { Program } from "typescript";\nexport type ProgramLike = Program;',
      errors: [{ messageId: 'noInlineTypeImport' }],
    },
    {
      code: 'import { createProgram } from "typescript";\nexport type ProgramLike = import("typescript").Program;',
      name: 'should insert type import after existing runtime imports',
      output:
        'import { createProgram } from "typescript";\nimport type { Program } from "typescript";\n\nexport type ProgramLike = Program;',
      errors: [{ messageId: 'noInlineTypeImport' }],
    },
    {
      code: 'import type { Node } from "typescript";\nexport type ProgramLike = import("typescript").Program;',
      name: 'should insert missing type import when same module import lacks requested specifier',
      output:
        'import type { Node } from "typescript";\nimport type { Program } from "typescript";\n\nexport type ProgramLike = Program;',
      errors: [{ messageId: 'noInlineTypeImport' }],
    },
    {
      code: 'import { Program } from "other";\nexport type ProgramLike = import("typescript").Program;',
      name: 'should not fix inline type imports when an import binding collides',
      output: null,
      errors: [{ messageId: 'noInlineTypeImport' }],
    },
    {
      code: 'type Program = string;\nexport type ProgramLike = import("typescript").Program;',
      name: 'should not fix inline type imports when the type name collides',
      output: null,
      errors: [{ messageId: 'noInlineTypeImport' }],
    },
    {
      code: 'export type TypeScriptModule = import("typescript");',
      name: 'should not fix inline module imports without a simple qualifier',
      output: null,
      errors: [{ messageId: 'noInlineTypeImport' }],
    },
  ],
});

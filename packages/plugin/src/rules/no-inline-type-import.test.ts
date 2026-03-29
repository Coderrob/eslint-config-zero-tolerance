import { ruleTester } from '../test-helper';
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
      errors: [{ messageId: 'noInlineTypeImport' }],
    },
  ],
});

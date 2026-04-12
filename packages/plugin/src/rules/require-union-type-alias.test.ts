import { ruleTester } from '../testing/test-helper';
import { requireUnionTypeAlias } from './require-union-type-alias';

ruleTester.run('require-union-type-alias', requireUnionTypeAlias, {
  valid: [
    {
      name: 'should allow a type alias that is itself a union of type references',
      code: 'type SourceKind = DirectoryImportSourceSelection | SourceType;',
    },
    {
      name: 'should allow a type alias union with undefined',
      code: 'type Result = TypeA | TypeB | undefined;',
    },
    {
      name: 'should allow a single type reference with undefined',
      code: 'interface IConfig { value: TypeA | undefined; }',
    },
    {
      name: 'should allow a single type reference with null',
      code: 'interface IConfig { value: TypeA | null; }',
    },
    {
      name: 'should allow keyword-only unions',
      code: 'interface IConfig { value: string | number; }',
    },
    {
      name: 'should allow literal-only unions',
      code: "type Status = 'active' | 'inactive';",
    },
    {
      name: 'should allow a single type reference in a union with null and undefined',
      code: 'function run(x: TypeA | null | undefined): void {}',
    },
    {
      name: 'should allow non-union type annotations',
      code: 'const x: TypeA = getVal();',
    },
    {
      name: 'should allow empty function parameters',
      code: 'function run(): void {}',
    },
    {
      name: 'should allow literal type union in interface property',
      code: "interface IConfig { mode: 'fast' | 'safe'; }",
    },
  ],
  invalid: [
    {
      name: 'should report inline union of two type references in interface property',
      code: 'interface IConfig { value: TypeA | TypeB; }',
      errors: [{ messageId: 'requireUnionTypeAlias' }],
    },
    {
      name: 'should report inline union of type references with undefined in property',
      code: 'interface IConfig { sourceType: DirectoryImportSourceSelection | SourceType | undefined; }',
      errors: [{ messageId: 'requireUnionTypeAlias' }],
    },
    {
      name: 'should report inline union of type references in function parameter',
      code: 'function process(input: TypeA | TypeB): void {}',
      errors: [{ messageId: 'requireUnionTypeAlias' }],
    },
    {
      name: 'should report inline union of type references in function return type',
      code: 'function get(): TypeA | TypeB { return null!; }',
      errors: [{ messageId: 'requireUnionTypeAlias' }],
    },
    {
      name: 'should report inline union of type references in variable declaration',
      code: 'const x: TypeA | TypeB = getVal();',
      errors: [{ messageId: 'requireUnionTypeAlias' }],
    },
    {
      name: 'should report inline union nested inside a generic type argument',
      code: 'interface IConfig { value: Readonly<TypeA | TypeB>; }',
      errors: [{ messageId: 'requireUnionTypeAlias' }],
    },
    {
      name: 'should report inline union of three type references',
      code: 'interface IConfig { value: TypeA | TypeB | TypeC; }',
      errors: [{ messageId: 'requireUnionTypeAlias' }],
    },
    {
      name: 'should report inline union of type references in class property',
      code: 'class Service { handler: TypeA | TypeB = null!; }',
      errors: [{ messageId: 'requireUnionTypeAlias' }],
    },
    {
      name: 'should report inline union of generic type references',
      code: 'function handle(items: Array<string> | Set<string>): void {}',
      errors: [{ messageId: 'requireUnionTypeAlias' }],
    },
    {
      name: 'should report inline union of type references in type literal property',
      code: 'type Config = { source: SourceA | SourceB; };',
      errors: [{ messageId: 'requireUnionTypeAlias' }],
    },
  ],
});

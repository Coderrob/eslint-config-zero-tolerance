import { ruleTester } from '../testing/test-helper';
import { noTestInterfaceDeclaration } from './no-test-interface-declaration';

ruleTester.run('no-test-interface-declaration', noTestInterfaceDeclaration, {
  valid: [
    {
      name: 'should allow interface declarations in non-test files',
      code: 'interface IUser { name: string; }',
      filename: 'src/models/user.ts',
    },
    {
      name: 'should allow type aliases in test files',
      code: 'type MockData = { value: number };',
      filename: 'src/models/user.test.ts',
    },
    {
      name: 'should allow inline type literals in test files',
      code: 'const user: { name: string } = { name: "Alice" };',
      filename: 'src/models/user.test.ts',
    },
    {
      name: 'should allow function declarations in test files',
      code: 'function helper() { return 42; }',
      filename: 'src/utils/helper.spec.ts',
    },
    {
      name: 'should allow interface declarations in production files under __tests__ sibling',
      code: 'interface IConfig { port: number; }',
      filename: 'src/config.ts',
    },
  ],
  invalid: [
    {
      name: 'should report interface declaration in .test.ts file',
      code: 'interface IUser { name: string; }',
      filename: 'src/models/user.test.ts',
      errors: [
        {
          messageId: 'noTestInterfaceDeclaration',
          data: { name: 'IUser' },
        },
      ],
    },
    {
      name: 'should report interface declaration in .spec.ts file',
      code: 'interface IResponse { status: number; }',
      filename: 'src/api/client.spec.ts',
      errors: [
        {
          messageId: 'noTestInterfaceDeclaration',
          data: { name: 'IResponse' },
        },
      ],
    },
    {
      name: 'should report interface declaration in __tests__ directory',
      code: 'interface IMockService { call(): void; }',
      filename: 'src/__tests__/service.ts',
      errors: [
        {
          messageId: 'noTestInterfaceDeclaration',
          data: { name: 'IMockService' },
        },
      ],
    },
    {
      name: 'should report interface declaration in .e2e.ts file',
      code: 'interface ITestPayload { data: string; }',
      filename: 'src/api/endpoint.e2e.ts',
      errors: [
        {
          messageId: 'noTestInterfaceDeclaration',
          data: { name: 'ITestPayload' },
        },
      ],
    },
    {
      name: 'should report interface declaration in .integration.ts file',
      code: 'interface IDbFixture { id: number; }',
      filename: 'src/db/repo.integration.ts',
      errors: [
        {
          messageId: 'noTestInterfaceDeclaration',
          data: { name: 'IDbFixture' },
        },
      ],
    },
    {
      name: 'should report multiple interface declarations in a test file',
      code: 'interface IFoo { x: number; }\ninterface IBar { y: string; }',
      filename: 'src/utils/helpers.test.ts',
      errors: [
        {
          messageId: 'noTestInterfaceDeclaration',
          data: { name: 'IFoo' },
        },
        {
          messageId: 'noTestInterfaceDeclaration',
          data: { name: 'IBar' },
        },
      ],
    },
    {
      name: 'should report exported interface declaration in a test file',
      code: 'export interface IShared { value: string; }',
      filename: 'src/shared.test.ts',
      errors: [
        {
          messageId: 'noTestInterfaceDeclaration',
          data: { name: 'IShared' },
        },
      ],
    },
  ],
});

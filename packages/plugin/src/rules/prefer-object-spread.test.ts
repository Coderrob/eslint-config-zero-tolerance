import { ruleTester } from '../testing/test-helper';
import { preferObjectSpread } from './prefer-object-spread';

ruleTester.run('prefer-object-spread', preferObjectSpread, {
  valid: [
    {
      name: 'should allow object spread syntax',
      code: 'const result = { ...foo };',
    },
    {
      name: 'should allow object spread with multiple sources',
      code: 'const result = { ...foo, ...bar };',
    },
    {
      name: 'should allow object spread with inline properties',
      code: 'const result = { ...foo, a: 1 };',
    },
    {
      name: 'should allow Object.assign with a non-empty first argument',
      code: 'const result = Object.assign(target, source);',
    },
    {
      name: 'should allow Object.assign with a variable as first argument',
      code: 'const result = Object.assign(existingObj, { a: 1 });',
    },
    {
      name: 'should allow Object.assign on a different object',
      code: 'const result = MyUtils.assign({}, source);',
    },
    {
      name: 'should allow Object.assign with no arguments',
      code: 'const result = Object.assign();',
    },
    {
      name: 'should allow Object.assign with computed property access',
      code: 'const result = Object["assign"]({}, source);',
    },
    {
      name: 'should allow Object.create call',
      code: 'const result = Object.create(null);',
    },
    {
      name: 'should allow Object.assign with a non-empty object first argument',
      code: 'const result = Object.assign({ a: 1 }, source);',
    },
    {
      name: 'should allow Object.assign with only spread sources',
      code: 'const result = Object.assign({}, ...sources);',
    },
    {
      name: 'should allow Object.assign with source and spread sources',
      code: 'const result = Object.assign({}, foo, ...sources);',
    },
  ],
  invalid: [
    {
      name: 'should report Object.assign with empty object and one source',
      code: 'const result = Object.assign({}, source);',
      errors: [{ messageId: 'preferObjectSpread' }],
      output: 'const result = { ...source };',
    },
    {
      name: 'should report Object.assign with empty object and multiple sources',
      code: 'const result = Object.assign({}, foo, bar);',
      errors: [{ messageId: 'preferObjectSpread' }],
      output: 'const result = { ...foo, ...bar };',
    },
    {
      name: 'should report Object.assign with empty object and an object literal source',
      code: 'const result = Object.assign({}, { a: 1, b: 2 });',
      errors: [{ messageId: 'preferObjectSpread' }],
      output: 'const result = { a: 1, b: 2 };',
    },
    {
      name: 'should report Object.assign with empty object, a variable, and object literal',
      code: 'const result = Object.assign({}, foo, { a: 1 });',
      errors: [{ messageId: 'preferObjectSpread' }],
      output: 'const result = { ...foo, a: 1 };',
    },
    {
      name: 'should report Object.assign with only an empty object literal',
      code: 'const result = Object.assign({});',
      errors: [{ messageId: 'preferObjectSpread' }],
      output: 'const result = {};',
    },
    {
      name: 'should report Object.assign with empty object and three variable sources',
      code: 'const result = Object.assign({}, a, b, c);',
      errors: [{ messageId: 'preferObjectSpread' }],
      output: 'const result = { ...a, ...b, ...c };',
    },
    {
      name: 'should report Object.assign with empty object and skip empty object source',
      code: 'const result = Object.assign({}, foo, {});',
      errors: [{ messageId: 'preferObjectSpread' }],
      output: 'const result = { ...foo };',
    },
    {
      name: 'should report Object.assign with only empty object sources',
      code: 'const result = Object.assign({}, {});',
      errors: [{ messageId: 'preferObjectSpread' }],
      output: 'const result = {};',
    },
    {
      name: 'should report Object.assign in nested expression',
      code: 'doSomething(Object.assign({}, defaults, overrides));',
      errors: [{ messageId: 'preferObjectSpread' }],
      output: 'doSomething({ ...defaults, ...overrides });',
    },
    {
      name: 'should report Object.assign with empty object and member expression source',
      code: 'const result = Object.assign({}, step.aiEnrichment, enrichment);',
      errors: [{ messageId: 'preferObjectSpread' }],
      output: 'const result = { ...step.aiEnrichment, ...enrichment };',
    },
    {
      name: 'should report Object.assign with mixed object literal and variables',
      code: 'const result = Object.assign({}, { x: 1 }, bar, { y: 2 });',
      errors: [{ messageId: 'preferObjectSpread' }],
      output: 'const result = { x: 1, ...bar, y: 2 };',
    },
    {
      name: 'should report Object.assign with empty object and a call expression source',
      code: 'const result = Object.assign({}, getDefaults());',
      errors: [{ messageId: 'preferObjectSpread' }],
      output: 'const result = { ...getDefaults() };',
    },
    {
      name: 'should report Object.assign with a null source',
      code: 'const result = Object.assign({}, null);',
      errors: [{ messageId: 'preferObjectSpread' }],
      output: 'const result = { ...null };',
    },
    {
      name: 'should report Object.assign with an undefined source',
      code: 'const result = Object.assign({}, undefined);',
      errors: [{ messageId: 'preferObjectSpread' }],
      output: 'const result = { ...undefined };',
    },
    {
      name: 'should parenthesize autofix in expression statements',
      code: 'Object.assign({}, source);',
      errors: [{ messageId: 'preferObjectSpread' }],
      output: '({ ...source });',
    },
    {
      name: 'should parenthesize autofix in concise arrow function bodies',
      code: 'const clone = () => Object.assign({}, source);',
      errors: [{ messageId: 'preferObjectSpread' }],
      output: 'const clone = () => ({ ...source });',
    },
  ],
});

import { ruleTester } from '../testing/test-helper';
import { preferStructuredClone } from './prefer-structured-clone';

describe('prefer-structured-clone', () => {
  ruleTester.run('prefer-structured-clone', preferStructuredClone, {
    valid: [
      {
        name: 'should allow structuredClone usage',
        code: 'const clone = structuredClone(value);',
      },
      {
        name: 'should allow plain JSON.parse calls',
        code: 'const clone = JSON.parse(serializedValue);',
      },
      {
        name: 'should allow JSON.parse with a reviver',
        code: 'const clone = JSON.parse(JSON.stringify(value), reviveValue);',
      },
      {
        name: 'should allow JSON.stringify with a replacer',
        code: 'const clone = JSON.parse(JSON.stringify(value, replacer));',
      },
      {
        name: 'should allow JSON.stringify with replacer and spacing arguments',
        code: 'const clone = JSON.parse(JSON.stringify(value, null, 2));',
      },
      {
        name: 'should allow computed JSON.parse access',
        code: 'const clone = JSON["parse"](JSON.stringify(value));',
      },
      {
        name: 'should allow computed JSON.stringify access',
        code: 'const clone = JSON.parse(JSON["stringify"](value));',
      },
      {
        name: 'should allow JSON.parse with a spread argument',
        code: 'const clone = JSON.parse(...args);',
      },
      {
        name: 'should allow non-JSON parse methods',
        code: 'const clone = serializer.parse(JSON.stringify(value));',
      },
      {
        name: 'should allow non-JSON stringify methods',
        code: 'const clone = JSON.parse(serializer.stringify(value));',
      },
    ],
    invalid: [
      {
        name: 'should report the canonical JSON deep clone pattern',
        code: 'const clone = JSON.parse(JSON.stringify(value));',
        errors: [{ messageId: 'preferStructuredClone' }],
        output: null,
      },
      {
        name: 'should report JSON deep clone of a member expression',
        code: 'const clone = JSON.parse(JSON.stringify(source.payload));',
        errors: [{ messageId: 'preferStructuredClone' }],
        output: null,
      },
      {
        name: 'should report JSON deep clone inside a return statement',
        code: 'return JSON.parse(JSON.stringify(buildPayload()));',
        errors: [{ messageId: 'preferStructuredClone' }],
        output: null,
      },
      {
        name: 'should report a typed JSON parse call without autofix',
        code: 'const clone = JSON.parse<MyType>(JSON.stringify(value));',
        errors: [{ messageId: 'preferStructuredClone' }],
        output: null,
      },
      {
        name: 'should report JSON deep clone of an object literal',
        code: 'const clone = JSON.parse(JSON.stringify({ nested: value }));',
        errors: [{ messageId: 'preferStructuredClone' }],
        output: null,
      },
      {
        name: 'should preserve sequence expressions as a single structuredClone argument',
        code: 'const clone = JSON.parse(JSON.stringify((first(), second())));',
        errors: [{ messageId: 'preferStructuredClone' }],
        output: null,
      },
      {
        name: 'should not autofix JSON cloning that drops undefined properties',
        code: 'const clone = JSON.parse(JSON.stringify({ optional: undefined }));',
        errors: [{ messageId: 'preferStructuredClone' }],
        output: null,
      },
      {
        name: 'should not autofix JSON cloning that serializes dates',
        code: 'const clone = JSON.parse(JSON.stringify({ createdAt: new Date() }));',
        errors: [{ messageId: 'preferStructuredClone' }],
        output: null,
      },
    ],
  });
});

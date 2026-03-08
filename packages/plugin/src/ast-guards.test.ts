import { isTestFile } from './ast-guards';

describe('isTestFile', () => {
  it('should return true for test file suffixes', () => {
    expect(isTestFile('src/foo.test.ts')).toBe(true);
    expect(isTestFile('src/foo.spec.tsx')).toBe(true);
    expect(isTestFile('src/foo.test.mts')).toBe(true);
    expect(isTestFile('src/foo.spec.cjs')).toBe(true);
  });

  it('should return true for e2e and integration file suffixes', () => {
    expect(isTestFile('src/login.e2e.ts')).toBe(true);
    expect(isTestFile('src/auth.integration.ts')).toBe(true);
  });

  it('should return true for __tests__ directory paths', () => {
    expect(isTestFile('src/__tests__/foo.ts')).toBe(true);
    expect(isTestFile('src\\__tests__\\foo.ts')).toBe(true);
  });

  it('should return false for non-test files', () => {
    expect(isTestFile('src/foo.ts')).toBe(false);
    expect(isTestFile('src/test-utils.ts')).toBe(false);
  });
});

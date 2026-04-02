import { getFilename, isBarrelFile, isParentDirectoryImportPath } from './import-path-helpers';

describe('import-path-helpers', () => {
  // ── getFilename ──────────────────────────────────────────────────────────

  describe('getFilename', () => {
    it('should return the file name from a Unix path', () => {
      expect(getFilename('/src/rules/no-export-alias.ts')).toBe('no-export-alias.ts');
    });

    it('should return the file name from a Windows path', () => {
      expect(getFilename('C:\\src\\rules\\no-export-alias.ts')).toBe('no-export-alias.ts');
    });

    it('should return the file name when no directory separator is present', () => {
      expect(getFilename('no-export-alias.ts')).toBe('no-export-alias.ts');
    });

    it('should return an empty string for an empty path', () => {
      expect(getFilename('')).toBe('');
    });
  });

  // ── isBarrelFile ─────────────────────────────────────────────────────────

  describe('isBarrelFile', () => {
    it('should return true for index.ts', () => {
      expect(isBarrelFile('/src/index.ts')).toBe(true);
    });

    it('should return true for index.js', () => {
      expect(isBarrelFile('/src/index.js')).toBe(true);
    });

    it('should return true for index.mts', () => {
      expect(isBarrelFile('/src/index.mts')).toBe(true);
    });

    it('should return false for a non-index file', () => {
      expect(isBarrelFile('/src/rules/no-export-alias.ts')).toBe(false);
    });

    it('should return false for index.test.ts (double extension)', () => {
      expect(isBarrelFile('/src/index.test.ts')).toBe(false);
    });

    it('should return false for index.d.ts (double extension)', () => {
      expect(isBarrelFile('/src/index.d.ts')).toBe(false);
    });
  });

  // ── isParentDirectoryImportPath ──────────────────────────────────────────

  describe('isParentDirectoryImportPath', () => {
    it('should return true for parent directory token', () => {
      expect(isParentDirectoryImportPath('..')).toBe(true);
    });

    it('should return true for parent traversal paths', () => {
      expect(isParentDirectoryImportPath('../module')).toBe(true);
    });

    it('should return false for current directory paths', () => {
      expect(isParentDirectoryImportPath('./module')).toBe(false);
    });

    it('should return false for package imports', () => {
      expect(isParentDirectoryImportPath('react')).toBe(false);
    });
  });
});

import { isParentDirectoryImportPath } from './import-path-helpers';

describe('import-path-helpers', () => {
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

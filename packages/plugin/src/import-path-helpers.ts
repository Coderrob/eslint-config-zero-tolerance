const PARENT_DIRECTORY_IMPORT = '..';
const PARENT_DIRECTORY_IMPORT_PREFIX = '../';

/**
 * Returns true when an import path traverses to a parent directory.
 *
 * @param importPath - Import path to evaluate.
 * @returns True when the path is `..` or starts with `../`.
 */
export function isParentDirectoryImportPath(importPath: string): boolean {
  return (
    importPath === PARENT_DIRECTORY_IMPORT || importPath.startsWith(PARENT_DIRECTORY_IMPORT_PREFIX)
  );
}

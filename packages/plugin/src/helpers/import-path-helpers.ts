const PARENT_DIRECTORY_IMPORT = '..';
const PARENT_DIRECTORY_IMPORT_PREFIX = '../';

/**
 * Returns the file name (last path segment) from a file path.
 *
 * @param filePath - Full or relative file system path.
 * @returns The file name portion of the path.
 */
export function getFilename(filePath: string): string {
  const lastSeparator = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'));
  return filePath.slice(lastSeparator + 1);
}

/**
 * Returns true when the file is a barrel index file (e.g. `index.ts`).
 *
 * Only single-extension index files are recognised. Double-extension files
 * such as `index.d.ts`, `index.test.ts`, or `index.spec.js` are excluded.
 *
 * @param filePath - Path to the current file being linted.
 * @returns True if the file is a barrel index file.
 */
export function isBarrelFile(filePath: string): boolean {
  return /^index\.\w+$/u.test(getFilename(filePath));
}

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

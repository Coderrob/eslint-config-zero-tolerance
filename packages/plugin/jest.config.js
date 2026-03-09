const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_COVERAGE_GLOBS = ['src/**/*.ts', '!src/**/*.test.ts'];
const DEFAULT_THRESHOLD = {
  branches: 95,
  functions: 95,
  lines: 95,
  statements: 95,
};
const SPECIAL_TEST_COVERAGE_GLOBS = {
  'plugin-wiring.test.ts': ['src/index.ts', 'src/rule-map.ts', 'src/configs/**/*.ts'],
};
const TEST_FILE_SUFFIX = '.test.ts';
const HAS_EXPLICIT_TEST_ARGS = process.argv.some((arg) => arg.endsWith(TEST_FILE_SUFFIX));

/**
 * Returns focused coverage globs when one or more test files are explicitly passed.
 *
 * @returns {string[]} Coverage globs.
 */
function getCoverageGlobs() {
  if (!HAS_EXPLICIT_TEST_ARGS) {
    return DEFAULT_COVERAGE_GLOBS;
  }
  const explicitTestArgs = process.argv.filter((arg) => arg.endsWith(TEST_FILE_SUFFIX));
  const focusedGlobs = [];
  for (const arg of explicitTestArgs) {
    const specialGlobs = getSpecialCoverageGlobs(arg);
    if (specialGlobs.length > 0) {
      focusedGlobs.push(...specialGlobs);
      continue;
    }
    const target = resolveSourceFileFromTestArg(arg);
    if (target !== null) {
      focusedGlobs.push(target);
    }
  }
  return focusedGlobs;
}

/**
 * Returns coverage thresholds for full-suite and explicit single-test runs.
 *
 * @returns {Record<string, {branches:number,functions:number,lines:number,statements:number}>} Coverage thresholds.
 */
function getCoverageThreshold() {
  if (HAS_EXPLICIT_TEST_ARGS) {
    return { global: DEFAULT_THRESHOLD };
  }
  return {
    global: DEFAULT_THRESHOLD,
    'src/rules/*.ts': DEFAULT_THRESHOLD,
  };
}

/**
 * Returns explicit coverage globs for non-1:1 test-to-source mappings.
 *
 * @param {string} arg - Test path argument.
 * @returns {string[]} Coverage globs.
 */
function getSpecialCoverageGlobs(arg) {
  const fileName = path.posix.basename(arg.replaceAll('\\', '/'));
  return SPECIAL_TEST_COVERAGE_GLOBS[fileName] ?? [];
}

/**
 * Resolves the source file path from a test-file argument.
 *
 * @param {string} arg - Test path argument.
 * @returns {string|null} Resolved coverage glob path, or null when unresolved.
 */
function resolveSourceFileFromTestArg(arg) {
  const normalizedArg = arg.replaceAll('\\', '/');
  const withSrcPrefix = normalizedArg.startsWith('src/') ? normalizedArg : `src/${normalizedArg}`;
  const directCandidate = withSrcPrefix.replace('.test.ts', '.ts');
  if (fs.existsSync(path.join(__dirname, directCandidate))) {
    return directCandidate;
  }
  const ruleCandidate = path.posix.join(
    'src/rules',
    path.posix.basename(normalizedArg).replace('.test.ts', '.ts'),
  );
  if (fs.existsSync(path.join(__dirname, ruleCandidate))) {
    return ruleCandidate;
  }
  return null;
}

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: getCoverageGlobs(),
  coverageThreshold: getCoverageThreshold(),
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.test.json',
      },
    ],
  },
};

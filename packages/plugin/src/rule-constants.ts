/**
 * Copyright 2026 Robert Lindley
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Domain-specific string constants used within individual rule implementations.
 * Kept separate from constants.ts (which holds plugin/config-level constants)
 * so each concern is easy to locate.
 */

// ── Operators ──────────────────────────────────────────────────────────────
/** Unary negation operator, used to detect the `-1` pattern in no-magic-numbers. */
export const OPERATOR_UNARY_MINUS = '-';

/** Strict equality operator. */
export const OPERATOR_STRICT_EQ = '===';

/** Strict inequality operator. */
export const OPERATOR_STRICT_NEQ = '!==';

// ── Variable / declaration kinds ───────────────────────────────────────────
/** Variable declaration kind that indicates a named constant. */
export const VARIABLE_KIND_CONST = 'const';

// ── Well-known callee/identifier names ─────────────────────────────────────
/** CommonJS dynamic require function name (no-dynamic-import rule). */
export const CALLEE_REQUIRE = 'require';

/** Jest/Vitest test function name. */
export const TEST_FUNCTION_IT = 'it';

/** Jest/Vitest test function name (alternate form). */
export const TEST_FUNCTION_TEST = 'test';

/** Jest/Vitest skip modifier name. */
export const TEST_METHOD_SKIP = 'skip';

/** Zod library root identifier (require-zod-schema-description rule). */
export const ZOD_IDENTIFIER = 'z';

/** Zod `.describe()` method name (require-zod-schema-description rule). */
export const ZOD_DESCRIBE_METHOD = 'describe';

/** TypeScript built-in `ReturnType` utility type name (no-banned-types rule). */
export const RETURN_TYPE_NAME = 'ReturnType';

// ── Rule-specific string values ────────────────────────────────────────────
/** Required prefix for interface names (require-interface-prefix rule). */
export const INTERFACE_REQUIRED_PREFIX = 'I';

/** The character that begins a JSDoc block comment body (require-jsdoc-functions rule). */
export const JSDOC_BLOCK_MARKER = '*';

/** The type assertion value that is permitted inside test files (no-type-assertion rule). */
export const TYPE_ASSERTION_ALLOWED_IN_TESTS = 'unknown';

/** Prefix string that triggers the no-eslint-disable rule. */
export const ESLINT_DISABLE_PREFIX = 'eslint-disable';

/** Required prefix for test description strings (require-test-description-style rule). */
export const TEST_DESCRIPTION_PREFIX = 'should';

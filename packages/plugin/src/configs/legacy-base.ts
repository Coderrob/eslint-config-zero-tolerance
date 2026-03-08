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

import type { Linter } from 'eslint';
import { PLUGIN_NAMESPACE, TYPESCRIPT_ESLINT_PARSER } from '../constants';

const LEGACY_ECMA_VERSION = 2020;

/**
 * Shared parser options for legacy ESLint config consumers (ESLint <9).
 */
export const legacyParserOptions: Linter.LegacyConfig = {
  parser: TYPESCRIPT_ESLINT_PARSER,
  parserOptions: {
    ecmaVersion: LEGACY_ECMA_VERSION,
    sourceType: 'module',
  },
  plugins: [PLUGIN_NAMESPACE],
};

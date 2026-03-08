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

import zeroTolerancePlugin from '@coderrob/eslint-plugin-zero-tolerance';

/**
 * Strict config preset (error severity).
 * Rules are derived from the canonical rule map in @coderrob/eslint-plugin-zero-tolerance.
 */
const strictConfig = zeroTolerancePlugin.configs.strict;

export default strictConfig;

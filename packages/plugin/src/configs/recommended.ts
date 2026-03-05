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

import type { ESLint, Linter } from 'eslint';
import { buildRules } from '../rule-map';
import { CONFIG_NAME_RECOMMENDED, PLUGIN_NAMESPACE, PRESET_RECOMMENDED } from '../constants';

/**
 * Creates the recommended flat config preset so the plugin can dogfood itself.
 * @param plugin - The ESLint plugin instance to include in the config.
 * @returns A complete ESLint flat config with recommended rule settings.
 */
export const createRecommendedConfig = (plugin: ESLint.Plugin): Linter.Config => ({
  name: CONFIG_NAME_RECOMMENDED,
  plugins: { [PLUGIN_NAMESPACE]: plugin },
  rules: buildRules(PRESET_RECOMMENDED),
});

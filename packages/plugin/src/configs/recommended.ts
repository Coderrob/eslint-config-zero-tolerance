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

import { CONFIG_NAME_RECOMMENDED, PLUGIN_NAMESPACE, Preset } from '../constants';
import { buildRules } from '../rule-map';

/** Flat-config shape produced by plugin preset factories. */
export interface IPluginFlatConfig {
  name: string;
  plugins: Record<string, unknown>;
  rules: Record<string, unknown>;
}

/**
 * Creates the recommended flat config preset so the plugin can dogfood itself.
 *
 * @param plugin - The ESLint plugin instance to include in the config.
 * @returns A complete ESLint flat config with recommended rule settings.
 */
export function createRecommendedConfig(plugin: unknown): IPluginFlatConfig {
  return {
    name: CONFIG_NAME_RECOMMENDED,
    plugins: { [PLUGIN_NAMESPACE]: plugin },
    rules: buildRules(Preset.Recommended),
  };
}

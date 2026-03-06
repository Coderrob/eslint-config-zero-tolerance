#!/usr/bin/env node

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
 * Restore workspace:* after publishing.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = dirname(currentFilePath);
const configPackagePath = join(currentDirPath, '..', 'packages', 'config', 'package.json');

const configPackage = JSON.parse(readFileSync(configPackagePath, 'utf8'));

if (configPackage.peerDependencies?.['@coderrob/eslint-plugin-zero-tolerance']) {
  configPackage.peerDependencies['@coderrob/eslint-plugin-zero-tolerance'] = 'workspace:*';
  writeFileSync(configPackagePath, JSON.stringify(configPackage, null, 2) + '\n', 'utf8');
  console.log('Restored workspace:* for development');
} else {
  console.log('No @coderrob/eslint-plugin-zero-tolerance peer dependency found');
}

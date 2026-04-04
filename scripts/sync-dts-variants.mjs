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

import { copyFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const entryNames = process.argv.slice(2);

if (entryNames.length === 0) {
  console.error('Usage: node scripts/sync-dts-variants.mjs <entry-name> [entry-name...]');
  process.exit(1);
}

for (const entryName of entryNames) {
  const sourcePath = join(process.cwd(), 'dist', `${entryName}.d.ts`);
  const esmTypesPath = join(process.cwd(), 'dist', `${entryName}.d.mts`);
  const cjsTypesPath = join(process.cwd(), 'dist', `${entryName}.d.cts`);

  if (!existsSync(sourcePath)) {
    console.error(`Missing declaration file: ${sourcePath}`);
    process.exit(1);
  }

  copyFileSync(sourcePath, esmTypesPath);
  copyFileSync(sourcePath, cjsTypesPath);
}

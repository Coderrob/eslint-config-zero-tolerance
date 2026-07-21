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

import { spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = resolve(repoRoot, process.argv[2] ?? 'compatibility-packages');
const pnpmExecutable = process.env.npm_execpath;

/**
 * Returns a platform-safe pnpm command and its leading arguments.
 *
 * @returns Command executable and arguments required to invoke pnpm.
 */
function getPnpmInvocation() {
  if (pnpmExecutable !== undefined) {
    return { arguments: [pnpmExecutable], command: process.execPath };
  }
  return {
    arguments: [],
    command: process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
  };
}

/**
 * Packs a workspace package using pnpm so workspace peer ranges are publishable.
 *
 * @param relativePackageDirectory - Workspace directory relative to the repository root.
 * @throws {Error} When pnpm cannot start or the package cannot be packed.
 */
function packWorkspace(relativePackageDirectory) {
  const pnpmInvocation = getPnpmInvocation();
  const result = spawnSync(
    pnpmInvocation.command,
    [
      ...pnpmInvocation.arguments,
      '--config.ignore-scripts=true',
      '--dir',
      resolve(repoRoot, relativePackageDirectory),
      'pack',
      '--pack-destination',
      outputDirectory,
    ],
    { encoding: 'utf8', stdio: 'inherit' },
  );

  if (result.error !== undefined) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`Failed to pack ${relativePackageDirectory}`);
  }
}

/**
 * Validates every packed artifact's ESM, CommonJS, and declaration resolution.
 *
 * @throws {Error} When ATTW cannot start or reports an invalid package artifact.
 */
function validatePackedTypes() {
  const pnpmInvocation = getPnpmInvocation();
  const tarballs = readdirSync(outputDirectory)
    .filter((fileName) => fileName.endsWith('.tgz'))
    .toSorted();

  for (const tarball of tarballs) {
    const result = spawnSync(
      pnpmInvocation.command,
      [
        ...pnpmInvocation.arguments,
        'exec',
        'attw',
        resolve(outputDirectory, tarball),
        '--profile',
        'node16',
        // The package requires Node 18+; Node 10 reads the legacy `types` field instead of
        // the conditional CommonJS declaration that is validated by the Node 16+ profile.
        '--ignore-rules',
        'false-export-default',
      ],
      { encoding: 'utf8', stdio: 'inherit' },
    );
    if (result.error !== undefined) {
      throw result.error;
    }
    if (result.status !== 0) {
      throw new Error(`Type and export validation failed for ${tarball}`);
    }
  }
}

rmSync(outputDirectory, { force: true, recursive: true });
mkdirSync(outputDirectory, { recursive: true });
packWorkspace('packages/plugin');
packWorkspace('packages/config');
validatePackedTypes();

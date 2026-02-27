#!/usr/bin/env node

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

if (
  configPackage.peerDependencies &&
  configPackage.peerDependencies['eslint-plugin-zero-tolerance']
) {
  configPackage.peerDependencies['eslint-plugin-zero-tolerance'] = 'workspace:*';
  writeFileSync(configPackagePath, JSON.stringify(configPackage, null, 2) + '\n', 'utf8');
  console.log('Restored workspace:* for development');
} else {
  console.log('No eslint-plugin-zero-tolerance peer dependency found');
}

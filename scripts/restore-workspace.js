#!/usr/bin/env node

/**
 * Restore workspace:* after publishing
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const configPackagePath = join(__dirname, '../packages/config/package.json');

// Read the config package
const configPackage = JSON.parse(readFileSync(configPackagePath, 'utf8'));

// Replace version with workspace:*
if (
  configPackage.peerDependencies &&
  configPackage.peerDependencies['eslint-plugin-zero-tolerance']
) {
  configPackage.peerDependencies['eslint-plugin-zero-tolerance'] = 'workspace:*';

  // Write back
  writeFileSync(configPackagePath, JSON.stringify(configPackage, null, 2) + '\n', 'utf8');

  console.log('✓ Restored workspace:* for development');
} else {
  console.log('No eslint-plugin-zero-tolerance peer dependency found');
}

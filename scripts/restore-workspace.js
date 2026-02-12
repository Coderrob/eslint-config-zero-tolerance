#!/usr/bin/env node

/**
 * Restore workspace:* after publishing
 */

const fs = require('fs');
const path = require('path');

const configPackagePath = path.join(__dirname, '../packages/config/package.json');

// Read the config package
const configPackage = JSON.parse(fs.readFileSync(configPackagePath, 'utf8'));

// Replace version with workspace:*
if (configPackage.peerDependencies && configPackage.peerDependencies['eslint-plugin-zero-tolerance']) {
  configPackage.peerDependencies['eslint-plugin-zero-tolerance'] = 'workspace:*';
  
  // Write back
  fs.writeFileSync(
    configPackagePath,
    JSON.stringify(configPackage, null, 2) + '\n',
    'utf8'
  );
  
  console.log('✓ Restored workspace:* for development');
} else {
  console.log('No eslint-plugin-zero-tolerance peer dependency found');
}

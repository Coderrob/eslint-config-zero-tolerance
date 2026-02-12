#!/usr/bin/env node

/**
 * Prepare packages for publishing by replacing workspace:* with actual version
 */

const fs = require('fs');
const path = require('path');

const configPackagePath = path.join(__dirname, '../packages/config/package.json');
const pluginPackagePath = path.join(__dirname, '../packages/plugin/package.json');

// Read the plugin version
const pluginPackage = JSON.parse(fs.readFileSync(pluginPackagePath, 'utf8'));
const pluginVersion = pluginPackage.version;

// Read the config package
const configPackage = JSON.parse(fs.readFileSync(configPackagePath, 'utf8'));

// Replace workspace:* with the actual version
if (configPackage.peerDependencies && configPackage.peerDependencies['eslint-plugin-zero-tolerance']) {
  configPackage.peerDependencies['eslint-plugin-zero-tolerance'] = `^${pluginVersion}`;
  
  // Write back
  fs.writeFileSync(
    configPackagePath,
    JSON.stringify(configPackage, null, 2) + '\n',
    'utf8'
  );
  
  console.log(`✓ Updated eslint-plugin-zero-tolerance peer dependency to ^${pluginVersion}`);
} else {
  console.log('No workspace:* dependency found');
}

#!/usr/bin/env node

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

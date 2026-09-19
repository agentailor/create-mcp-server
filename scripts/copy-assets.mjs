#!/usr/bin/env node
/**
 * Copies src/assets into dist/assets after tsc.
 *
 * tsc only emits JavaScript, so the vendored skill files - which are markdown -
 * would not otherwise reach the published package.
 */

import { cp, rm } from 'fs/promises';
import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const source = resolve(__dirname, '../src/assets');
const destination = resolve(__dirname, '../dist/assets');

if (!existsSync(source)) {
  console.error(`No assets directory at ${source}`);
  process.exit(1);
}

await rm(destination, { recursive: true, force: true });
await cp(source, destination, { recursive: true });

console.log('Copied src/assets -> dist/assets');

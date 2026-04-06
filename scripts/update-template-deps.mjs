#!/usr/bin/env node
/**
 * Fetches the latest versions of all template dependencies from npm and
 * updates the hardcoded version strings in src/templates/common/package.json.ts.
 *
 * Usage:
 *   node scripts/update-template-deps.mjs           # update in place
 *   node scripts/update-template-deps.mjs --dry-run # print changes only
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_FILE = resolve(__dirname, '../src/templates/common/package.json.ts');
const DRY_RUN = process.argv.includes('--dry-run');

const TEMPLATE_PACKAGES = [
  '@modelcontextprotocol/sdk',
  '@modelcontextprotocol/inspector',
  'express',
  'fastmcp',
  'zod',
  'dotenv',
  'jose',
  'typescript',
  '@types/node',
  '@types/express',
];

function getLatestVersion(pkg) {
  try {
    return execSync(`npm view ${pkg} version`, { encoding: 'utf8' }).trim();
  } catch (err) {
    console.error(`  Failed to fetch version for ${pkg}: ${err.message}`);
    return null;
  }
}

// Escapes special regex characters in a package name (e.g. @, /)
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\@/]/g, '\\$&');
}

function updateVersionInContent(content, pkg, newVersion) {
  // Pattern 1: quoted key — '@scope/pkg': '^1.0.0' or "@scope/pkg": "^1.0.0"
  const quotedKey = new RegExp(
    `(['"]${escapeRegex(pkg)}['"]\\s*:\\s*['"])\\^[\\d.]+(['"])`,
    'g'
  );
  // Pattern 2: unquoted key — pkg: '^1.0.0'
  const unquotedKey = new RegExp(
    `(\\b${escapeRegex(pkg)}\\s*:\\s*['"])\\^[\\d.]+(['"])`,
    'g'
  );
  // Pattern 3: bracket assignment — dependencies['pkg'] = '^1.0.0'
  const bracketAssign = new RegExp(
    `(\\[['"]${escapeRegex(pkg)}['"]\\]\\s*=\\s*['"])\\^[\\d.]+(['"])`,
    'g'
  );
  return content
    .replace(quotedKey, `$1^${newVersion}$2`)
    .replace(unquotedKey, `$1^${newVersion}$2`)
    .replace(bracketAssign, `$1^${newVersion}$2`);
}

async function main() {
  console.log(`Fetching latest versions for ${TEMPLATE_PACKAGES.length} packages...\n`);

  let content = readFileSync(TEMPLATE_FILE, 'utf8');
  let hasChanges = false;

  for (const pkg of TEMPLATE_PACKAGES) {
    const newVersion = getLatestVersion(pkg);
    if (!newVersion) continue;

    // Extract current file version BEFORE comparison or mutation.
    // Tries quoted key, unquoted key, and bracket assignment forms.
    const oldMatch =
      content.match(new RegExp(`['"]${escapeRegex(pkg)}['"]\\s*:\\s*['"]\\^([\\d.]+)['"]`)) ||
      content.match(new RegExp(`\\b${escapeRegex(pkg)}\\s*:\\s*['"]\\^([\\d.]+)['"]`)) ||
      content.match(new RegExp(`\\[['"]${escapeRegex(pkg)}['"]\\]\\s*=\\s*['"]\\^([\\d.]+)['"]`));
    const oldVersion = oldMatch ? oldMatch[1] : '?';

    const updated = updateVersionInContent(content, pkg, newVersion);

    if (updated === content) {
      console.log(`  ${pkg}: ^${oldVersion} (up to date)`);
    } else {
      console.log(`  ${pkg}: ^${oldVersion} → ^${newVersion}`);
      content = updated;
      hasChanges = true;
    }
  }

  console.log();

  if (!hasChanges) {
    console.log('All packages are already at their latest versions. Nothing to update.');
    return;
  }

  if (DRY_RUN) {
    console.log('Dry run — no files were written.');
  } else {
    writeFileSync(TEMPLATE_FILE, content, 'utf8');
    console.log(`Updated: src/templates/common/package.json.ts`);
  }
}

main();

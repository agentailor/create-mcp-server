import { describe, it, expect } from 'vitest';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import {
  copySkill,
  SKILL_NAME,
  SKILL_REPO,
  SKILLS_DIR,
  SKILLS_UPDATE_COMMAND,
  SKILLS_INSTALL_HINT,
} from './skills.js';

const ASSET_DIR = join(process.cwd(), 'src', 'assets', 'skills', SKILL_NAME);

describe('vendored skill assets', () => {
  it('should ship the skill and its references', async () => {
    const root = await readdir(ASSET_DIR);
    expect(root).toContain('SKILL.md');
    expect(root).toContain('references');

    const references = await readdir(join(ASSET_DIR, 'references'));
    expect(references.sort()).toEqual(['examples.md', 'principles.md', 'testing.md']);
  });

  // The frontmatter is what makes it loadable as a skill rather than a doc.
  it('should keep the skill frontmatter intact', async () => {
    const skill = await readFile(join(ASSET_DIR, 'SKILL.md'), 'utf8');

    // Line endings vary by checkout, so normalise before asserting.
    expect(skill.replace(/\r\n/g, '\n').startsWith('---\n')).toBe(true);
    expect(skill).toContain(`name: ${SKILL_NAME}`);
    expect(skill).toContain('description:');
  });

  it('should be copied verbatim, not rewritten', async () => {
    const skill = await readFile(join(ASSET_DIR, 'SKILL.md'), 'utf8');

    // Spot-check content that would vanish if someone summarised the file.
    expect(skill).toContain('Validation Checklist');
    expect(skill).toContain('references/principles.md');
  });
});

describe('commands', () => {
  it('should point the update command at project scope, without prompting', () => {
    expect(SKILLS_UPDATE_COMMAND).toBe('npx skills update -p -y');
  });

  it('should name the agentailor skill in the manual hint', () => {
    expect(SKILLS_INSTALL_HINT).toContain(SKILL_REPO);
    expect(SKILLS_INSTALL_HINT).toContain(SKILL_NAME);
  });

  // `-a universal` is what puts the skill in .agents/ rather than a
  // tool-specific directory like .claude/.
  it('should target the tool-agnostic directory in the manual hint', () => {
    expect(SKILLS_INSTALL_HINT).toContain('-a universal');
  });

  it('should place skills in a tool-agnostic directory', () => {
    expect(SKILLS_DIR).toBe('.agents');
  });
});

describe('copySkill', () => {
  it('should copy the bundled skill into the project skills directory', async () => {
    let from: string | undefined;
    let to: string | undefined;

    const result = await copySkill('/project', {
      sourceDir: '/bundled',
      exists: () => true,
      copyDir: async (source, destination) => {
        from = source;
        to = destination;
      },
    });

    expect(result).toEqual({ copied: true });
    expect(from).toBe('/bundled');
    expect(to).toContain(join(SKILLS_DIR, 'skills', SKILL_NAME));
  });

  // Would mean a broken install of the CLI itself; say so rather than crashing.
  it('should report failure when the bundled files are missing', async () => {
    const result = await copySkill('/project', {
      sourceDir: '/bundled',
      exists: () => false,
      copyDir: async () => {
        throw new Error('should not be called');
      },
    });

    expect(result.copied).toBe(false);
    expect(result.reason).toContain('missing');
  });

  it('should report a copy failure rather than throwing', async () => {
    const result = await copySkill('/project', {
      sourceDir: '/bundled',
      exists: () => true,
      copyDir: async () => {
        throw new Error('EACCES: permission denied');
      },
    });

    expect(result.copied).toBe(false);
    expect(result.reason).toContain('EACCES');
  });
});

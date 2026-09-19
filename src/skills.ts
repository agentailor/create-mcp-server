import { cp } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const SKILL_REPO = 'agentailor/skills';
export const SKILL_NAME = 'tool-design';

/**
 * Where skills go in a generated project.
 *
 * `.agents/` rather than `.claude/`: the ecosystem is converging on
 * tool-agnostic locations, the same way AGENTS.md replaced CLAUDE.md. Agents
 * that only look in `.claude/` today are expected to follow.
 */
export const SKILLS_DIR = '.agents';

/**
 * Pulls a newer copy of the skill than the one this CLI vendored.
 *
 * Surfaced in the generated README and AGENTS.md. Running it is the user's
 * choice: the vendored copy works offline and is current as of the version of
 * this CLI they used.
 */
export const SKILLS_UPDATE_COMMAND = 'npx skills update -p -y';

/**
 * Shown if the vendored copy could not be written, so it can be added by hand.
 *
 * `-a universal` is what puts the skill in `.agents/` rather than a
 * tool-specific directory.
 */
export const SKILLS_INSTALL_HINT = `npx skills add ${SKILL_REPO} --skill ${SKILL_NAME} -a universal`;

/**
 * The vendored skill, copied verbatim from `agentailor/skills`.
 *
 * Kept as real files rather than string templates: it is ~50KB of markdown
 * full of code fences, which would need escaping in a template literal and
 * would be unreadable and unreviewable. See "The tool-design skill" in
 * AGENTS.md for how to refresh it.
 */
function skillSourceDir(): string {
  // dist/skills.js -> dist/assets/skills/tool-design
  const here = dirname(fileURLToPath(import.meta.url));
  return join(here, 'assets', 'skills', SKILL_NAME);
}

export interface SkillCopyResult {
  copied: boolean;
  /** Present on failure; suitable for a one-line notice. */
  reason?: string;
}

interface SkillCopyDeps {
  copyDir?: (from: string, to: string) => Promise<void>;
  exists?: (path: string) => boolean;
  sourceDir?: string;
}

/**
 * Writes the vendored skill into a generated project.
 *
 * Never throws. The project is complete and usable without the skill, so a
 * failure here is reported and stepped over rather than failing the scaffold.
 */
export async function copySkill(
  projectPath: string,
  deps: SkillCopyDeps = {}
): Promise<SkillCopyResult> {
  const exists = deps.exists ?? existsSync;
  const copyDir = deps.copyDir ?? ((from, to) => cp(from, to, { recursive: true }));
  const source = deps.sourceDir ?? skillSourceDir();

  if (!exists(source)) {
    return { copied: false, reason: 'the bundled skill files are missing' };
  }

  const destination = join(projectPath, SKILLS_DIR, 'skills', SKILL_NAME);

  try {
    await copyDir(source, destination);
  } catch (error) {
    return { copied: false, reason: error instanceof Error ? error.message : String(error) };
  }

  return { copied: true };
}

import { SKILLS_ADD_COMMAND, SKILLS_DIR, SKILLS_UPDATE_COMMAND, SKILL_URL } from '../../skills.js';

/**
 * The README's "Tool design skill" section, shared by every transport.
 *
 * Branches on whether the skill is actually in the project: pointing at
 * `.agents/skills/tool-design/` in a project scaffolded with `--no-skills` sends
 * the reader to a directory that does not exist.
 */
export function getSkillReadmeSection(withSkills: boolean): string {
  if (!withSkills) {
    return `## Tool design skill

Agentailor's [tool-design](${SKILL_URL}) skill gives a coding agent working here
detailed guidance on designing MCP tools. It is not installed in this project.
To add it:

\`\`\`bash
${SKILLS_ADD_COMMAND}
\`\`\`
`;
  }

  return `## Tool design skill

Agentailor's [tool-design](${SKILL_URL}) skill is
included at \`${SKILLS_DIR}/skills/tool-design/\`, so a coding agent working here has
the guidance on hand. Commit it so the whole team gets the same copy.

It is the version that shipped with the scaffolding CLI. To check for a newer
one — your call, not automatic:

\`\`\`bash
${SKILLS_UPDATE_COMMAND}
\`\`\`
`;
}

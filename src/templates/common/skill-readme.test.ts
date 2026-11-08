import { describe, it, expect } from 'vitest';
import { getSkillReadmeSection } from './skill-readme.js';
import { getReadmeTemplate as getHttpReadme } from '../sdk/http/index.js';
import { getReadmeTemplate as getStdioReadme } from '../sdk/stdio/index.js';

describe('getSkillReadmeSection', () => {
  it('should point at the installed skill and how to update it', () => {
    const section = getSkillReadmeSection(true);
    expect(section).toContain('.agents/skills/tool-design/');
    expect(section).toContain('npx skills update -p -y');
  });

  // A --no-skills project has no .agents/; send the reader upstream instead.
  it('should link upstream and give the install command when the skill is absent', () => {
    const section = getSkillReadmeSection(false);
    expect(section).not.toContain('.agents/');
    expect(section).not.toContain('npx skills update');
    expect(section).toContain('https://github.com/agentailor/skills/tree/main/tool-design');
    expect(section).toContain('npx skills add agentailor/skills --skill tool-design');
  });

  it('should follow withSkills in both transport READMEs', () => {
    for (const getReadme of [getHttpReadme, getStdioReadme]) {
      expect(getReadme('p')).toContain('.agents/skills/tool-design/');
      expect(getReadme('p', { withSkills: false })).not.toContain('.agents/');
    }
  });
});

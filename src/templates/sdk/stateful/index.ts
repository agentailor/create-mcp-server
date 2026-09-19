export type { SdkTemplateOptions as TemplateOptions } from '../../common/types.js';

// Intentionally identical to the stateless template - see "Why stateless and
// stateful are identical" in AGENTS.md. Edit behaviour in stateless/, not here.
export { getIndexTemplate } from '../stateless/index.js';

export { getServerTemplate } from './server.js';
export { getReadmeTemplate } from './readme.js';
export { getAuthTemplate } from './auth.js';
export { getStoreTemplate } from '../stateless/store.js';
export { getToolsTemplate } from '../stateless/tools.js';
export { getPromptsTemplate } from '../stateless/prompts.js';
export { getResourcesTemplate } from '../stateless/resources.js';

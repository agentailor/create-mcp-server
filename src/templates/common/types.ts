export type PackageManager = 'npm' | 'pnpm' | 'yarn';
export type Framework = 'sdk' | 'fastmcp';

/**
 * Base template options shared across all templates
 */
export interface BaseTemplateOptions {
  packageManager?: PackageManager;
}

/**
 * Template options for SDK templates (stateless and stateful)
 */
export interface SdkTemplateOptions extends BaseTemplateOptions {
  withOAuth?: boolean;
}

/**
 * Template options for FastMCP templates
 */
export interface FastMCPTemplateOptions extends BaseTemplateOptions {
  stateless?: boolean;
}

/**
 * Template options for common templates (package.json, env.example)
 * Includes all options since these are used across all frameworks
 */
export interface CommonTemplateOptions extends BaseTemplateOptions {
  withOAuth?: boolean;
  framework?: Framework;
  stateless?: boolean;
}

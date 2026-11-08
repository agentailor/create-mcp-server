export type PackageManager = 'npm' | 'pnpm' | 'yarn';
export type TransportType = 'http' | 'stdio';

/**
 * Base template options shared across all templates
 */
export interface BaseTemplateOptions {
  packageManager?: PackageManager;
  /**
   * Whether the tool-design skill is present in the project. Defaults to true.
   * The generator sets it from the copy's actual outcome, not just the flag.
   */
  withSkills?: boolean;
}

/**
 * Template options for SDK templates (http and stdio)
 */
export interface SdkTemplateOptions extends BaseTemplateOptions {
  withOAuth?: boolean;
  transport?: TransportType;
}

/**
 * Template options for common templates (package.json, env.example)
 */
export interface CommonTemplateOptions extends BaseTemplateOptions {
  withOAuth?: boolean;
  transport?: TransportType;
}

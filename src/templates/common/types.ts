export type PackageManager = 'npm' | 'pnpm' | 'yarn';
export type TransportType = 'http' | 'stdio';

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
  transport?: TransportType;
}

/**
 * Template options for common templates (package.json, env.example)
 */
export interface CommonTemplateOptions extends BaseTemplateOptions {
  withOAuth?: boolean;
  transport?: TransportType;
}

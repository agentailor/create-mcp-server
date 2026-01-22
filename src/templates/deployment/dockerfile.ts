import type { BaseTemplateOptions, PackageManager } from '../common/types.js';

interface PackageManagerDockerConfig {
  lockFile: string;
  install: string;
  installProd: string;
  build: string;
  setup?: string;
}

const packageManagerConfigs: Record<PackageManager, PackageManagerDockerConfig> = {
  npm: {
    lockFile: 'package-lock.json',
    install: 'npm ci',
    installProd: 'npm ci --omit=dev',
    build: 'npm run build',
  },
  pnpm: {
    lockFile: 'pnpm-lock.yaml',
    install: 'pnpm install --frozen-lockfile',
    installProd: 'pnpm install --frozen-lockfile --prod',
    build: 'pnpm run build',
    setup: 'RUN corepack enable && corepack prepare pnpm@latest --activate',
  },
  yarn: {
    lockFile: 'yarn.lock',
    install: 'yarn install --frozen-lockfile',
    installProd: 'yarn install --frozen-lockfile --production',
    build: 'yarn build',
    setup: 'RUN corepack enable',
  },
};

export function getDockerfileTemplate(options?: BaseTemplateOptions): string {
  const packageManager = options?.packageManager ?? 'npm';
  const config = packageManagerConfigs[packageManager];

  const setupStep = config.setup ? `\n${config.setup}\n` : '';

  return `# Multi-stage build for production
FROM node:20-alpine AS builder

WORKDIR /app
${setupStep}
# Copy package files
COPY package.json ${config.lockFile} ./

# Install all dependencies (including dev)
RUN ${config.install}

# Copy source code
COPY . .

# Build the application
RUN ${config.build}

# Production stage
FROM node:20-alpine AS production

WORKDIR /app
${setupStep}
# Copy package files
COPY package.json ${config.lockFile} ./

# Install production dependencies only
RUN ${config.installProd}

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["node", "dist/index.js"]
`;
}

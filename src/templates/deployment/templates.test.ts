import { describe, it, expect } from 'vitest';
import { getDockerfileTemplate } from './dockerfile.js';
import { getDockerignoreTemplate } from './dockerignore.js';

describe('deployment templates', () => {
  const projectName = 'test-project';

  describe('getDockerfileTemplate', () => {
    it('should use multi-stage build', () => {
      const template = getDockerfileTemplate();
      expect(template).toContain('AS builder');
      expect(template).toContain('AS production');
    });

    it('should use Node 20 Alpine', () => {
      const template = getDockerfileTemplate();
      expect(template).toContain('FROM node:20-alpine');
    });

    it('should copy dist folder from builder', () => {
      const template = getDockerfileTemplate();
      expect(template).toContain('COPY --from=builder /app/dist ./dist');
    });

    it('should expose port 3000', () => {
      const template = getDockerfileTemplate();
      expect(template).toContain('EXPOSE 3000');
    });

    it('should run node dist/index.js', () => {
      const template = getDockerfileTemplate();
      expect(template).toContain('CMD ["node", "dist/index.js"]');
    });

    describe('npm (default)', () => {
      it('should use npm ci for install', () => {
        const template = getDockerfileTemplate();
        expect(template).toContain('RUN npm ci');
      });

      it('should use npm ci --omit=dev for production', () => {
        const template = getDockerfileTemplate();
        expect(template).toContain('npm ci --omit=dev');
      });

      it('should copy package-lock.json', () => {
        const template = getDockerfileTemplate();
        expect(template).toContain('COPY package.json package-lock.json');
      });

      it('should use npm run build', () => {
        const template = getDockerfileTemplate();
        expect(template).toContain('RUN npm run build');
      });
    });

    describe('pnpm', () => {
      it('should use pnpm install --frozen-lockfile', () => {
        const template = getDockerfileTemplate({ packageManager: 'pnpm' });
        expect(template).toContain('RUN pnpm install --frozen-lockfile');
      });

      it('should use pnpm install --frozen-lockfile --prod for production', () => {
        const template = getDockerfileTemplate({ packageManager: 'pnpm' });
        expect(template).toContain('pnpm install --frozen-lockfile --prod');
      });

      it('should copy pnpm-lock.yaml', () => {
        const template = getDockerfileTemplate({ packageManager: 'pnpm' });
        expect(template).toContain('COPY package.json pnpm-lock.yaml');
      });

      it('should enable corepack for pnpm', () => {
        const template = getDockerfileTemplate({ packageManager: 'pnpm' });
        expect(template).toContain('corepack enable');
        expect(template).toContain('corepack prepare pnpm');
      });

      it('should use pnpm run build', () => {
        const template = getDockerfileTemplate({ packageManager: 'pnpm' });
        expect(template).toContain('RUN pnpm run build');
      });
    });

    describe('yarn', () => {
      it('should use yarn install --frozen-lockfile', () => {
        const template = getDockerfileTemplate({ packageManager: 'yarn' });
        expect(template).toContain('RUN yarn install --frozen-lockfile');
      });

      it('should use yarn install --frozen-lockfile --production for production', () => {
        const template = getDockerfileTemplate({ packageManager: 'yarn' });
        expect(template).toContain('yarn install --frozen-lockfile --production');
      });

      it('should copy yarn.lock', () => {
        const template = getDockerfileTemplate({ packageManager: 'yarn' });
        expect(template).toContain('COPY package.json yarn.lock');
      });

      it('should enable corepack for yarn', () => {
        const template = getDockerfileTemplate({ packageManager: 'yarn' });
        expect(template).toContain('corepack enable');
      });

      it('should use yarn build', () => {
        const template = getDockerfileTemplate({ packageManager: 'yarn' });
        expect(template).toContain('RUN yarn build');
      });
    });
  });

  describe('getDockerignoreTemplate', () => {
    it('should ignore node_modules', () => {
      const template = getDockerignoreTemplate();
      expect(template).toContain('node_modules/');
    });

    it('should ignore dist folder', () => {
      const template = getDockerignoreTemplate();
      expect(template).toContain('dist/');
    });

    it('should ignore .env files', () => {
      const template = getDockerignoreTemplate();
      expect(template).toContain('.env');
    });

    it('should ignore .git folder', () => {
      const template = getDockerignoreTemplate();
      expect(template).toContain('.git/');
    });
  });
});

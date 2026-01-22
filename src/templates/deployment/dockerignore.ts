export function getDockerignoreTemplate(): string {
  return `# Dependencies
node_modules/

# Build output (rebuilt in container)
dist/

# Git
.git/
.gitignore

# Environment files (should be set in container)
.env
.env.*

# Documentation
*.md

# IDE
.vscode/
.idea/

# OS files
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Test files
*.test.ts
*.spec.ts
__tests__/
coverage/
`;
}

export function getGitignoreTemplate(): string {
  return `node_modules/
dist/
*.log
.DS_Store
.env
`;
}

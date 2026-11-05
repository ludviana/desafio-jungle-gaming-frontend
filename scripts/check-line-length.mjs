import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = process.cwd();
const ignoredDirectories = new Set([
  '.git',
  'dist',
  'node_modules',
  'playwright-report',
  'public',
  'test-results',
]);
const codeExtensions = new Set(['.css', '.html', '.js', '.mjs', '.ts', '.tsx']);
const maximumLineLength = 100;
const violations = [];

async function visit(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) await visit(path);
      continue;
    }

    if (!codeExtensions.has(path.slice(path.lastIndexOf('.')))) continue;
    const contents = await readFile(path, 'utf8');
    contents.split(/\r?\n/).forEach((line, index) => {
      if (line.length > maximumLineLength) {
        violations.push(`${relative(root, path)}:${index + 1} (${line.length} characters)`);
      }
    });
  }
}

await visit(root);
if (violations.length) {
  console.error(`Lines must not exceed ${maximumLineLength} characters:\n${violations.join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(`All code lines are within ${maximumLineLength} characters.`);
}

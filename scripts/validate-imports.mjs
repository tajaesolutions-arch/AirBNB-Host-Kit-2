import fs from 'node:fs';
import path from 'node:path';

const rootDir = path.resolve('src');
const sourceExtensions = new Set(['.js', '.jsx']);
const importPattern = /import\s+(?:[^'";]+\s+from\s+)?['"]([^'"]+)['"]/g;

const sourceFiles = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }

    if (sourceExtensions.has(path.extname(entry.name))) {
      sourceFiles.push(fullPath);
    }
  }
}

walk(rootDir);

const missing = [];

for (const filePath of sourceFiles) {
  const content = fs.readFileSync(filePath, 'utf8');

  for (const match of content.matchAll(importPattern)) {
    const specifier = match[1];

    if (!specifier.startsWith('.')) continue;

    const importBase = path.resolve(path.dirname(filePath), specifier);
    const candidates = [
      importBase,
      `${importBase}.js`,
      `${importBase}.jsx`,
      path.join(importBase, 'index.js'),
      path.join(importBase, 'index.jsx'),
    ];

    const isFound = candidates.some((candidate) => fs.existsSync(candidate));

    if (!isFound) {
      missing.push({ filePath, specifier });
    }
  }
}

if (missing.length) {
  console.error('Missing relative imports found:\n');
  for (const issue of missing) {
    console.error(`- ${path.relative(process.cwd(), issue.filePath)} -> ${issue.specifier}`);
  }
  process.exit(1);
}

console.log(`Checked ${sourceFiles.length} source files. No missing relative imports.`);

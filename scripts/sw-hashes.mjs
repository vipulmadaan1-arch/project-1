// Writes a content hash for every file the service worker precaches into sw.js, between
// "// hashes:start" and "// hashes:end". A new worker copies files whose hash hasn't changed from the
// previous version's cache and downloads only the rest (see the install handler in sw.js).
// Run by scripts/seo.mjs after it rewrites the pages; run it on its own after editing any other site file:
//   node scripts/sw-hashes.mjs
// tests/site.test.mjs fails when a hash is stale.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const swFiles = (sw) => {
  const m = sw.match(/const FILES = \[([\s\S]*?)\];/);
  if (!m) throw new Error('sw.js: no "const FILES = [...]" list');
  return [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]);
};
// './' is the site root, served as index.html.
export const fileHash = (f) => createHash('sha256').update(readFileSync(f === './' ? 'index.html' : f)).digest('hex').slice(0, 16);

export function hashBlock(sw) {
  const lines = swFiles(sw).map((f) => `  '${f}': '${fileHash(f)}',`);
  return `// hashes:start (written by scripts/sw-hashes.mjs: don't edit by hand)\nconst HASHES = {\n${lines.join('\n')}\n};\n// hashes:end`;
}

// Returns true when sw.js changed.
export function updateSwHashes(file = 'sw.js') {
  const sw = readFileSync(file, 'utf8');
  const re = /\/\/ hashes:start[\s\S]*?\/\/ hashes:end/;
  if (!re.test(sw)) throw new Error(`${file}: no "// hashes:start" … "// hashes:end" markers`);
  const next = sw.replace(re, () => hashBlock(sw));
  if (next === sw) return false;
  writeFileSync(file, next);
  return true;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.chdir(new URL('..', import.meta.url).pathname);
  console.log(updateSwHashes() ? 'Updated file hashes in sw.js.' : 'sw.js file hashes are up to date.');
}

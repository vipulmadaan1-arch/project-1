import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, normalize } from 'node:path';
import { TOOLS } from '../js/tools.js';

const sw = readFileSync('sw.js', 'utf8');
const listed = [...sw.match(/FILES = \[([\s\S]*?)\];/)[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);

test('every tool in the registry has a page and a script', () => {
  for (const t of TOOLS) {
    assert.ok(existsSync(`tools/${t.slug}.html`), `missing tools/${t.slug}.html`);
    assert.ok(existsSync(`js/pages/${t.slug}.js`), `missing js/pages/${t.slug}.js`);
  }
});

test('every tool page is in the registry', () => {
  for (const f of readdirSync('tools')) {
    assert.ok(TOOLS.some((t) => `${t.slug}.html` === f), `${f} not in js/tools.js`);
  }
});

test('service worker caches every site file', () => {
  const files = [
    ...readdirSync('tools').map((f) => `tools/${f}`),
    ...readdirSync('js').filter((f) => f.endsWith('.js')).map((f) => `js/${f}`),
    ...readdirSync('js/pages').map((f) => `js/pages/${f}`),
    ...readdirSync('fonts').filter((f) => f.endsWith('.woff2')).map((f) => `fonts/${f}`),
    'index.html', 'privacy.html', 'css/style.css',
  ];
  for (const f of files) assert.ok(listed.includes(f), `${f} missing from sw.js FILES`);
  for (const f of listed) if (f !== './') assert.ok(existsSync(f), `sw.js lists missing file ${f}`);
});

test('tool pages have title, description and FAQ', () => {
  for (const t of TOOLS) {
    const html = readFileSync(`tools/${t.slug}.html`, 'utf8');
    assert.match(html, /<title>.+<\/title>/);
    assert.match(html, /<meta name="description" content=".{50,}">/);
    assert.match(html, /"FAQPage"/);
  }
});

test('every tool belongs to a home page category', async () => {
  const { CATEGORIES } = await import('../js/tools.js');
  const keys = CATEGORIES.map((c) => c.key);
  for (const t of TOOLS) assert.ok(keys.includes(t.cat), `${t.slug} has unknown cat ${t.cat}`);
});

test('ads stay off until AdSense IDs are set', async () => {
  const { ADS_ENABLED } = await import('../js/ads.js');
  const { ADSENSE_CLIENT } = await import('../js/config.js');
  if (!ADSENSE_CLIENT) assert.equal(ADS_ENABLED, false);
});

const PAGES = ['index.html', 'privacy.html', ...readdirSync('tools').map((f) => `tools/${f}`)];

// Each page lists every module its scripts import as <link rel="modulepreload">, so the browser fetches
// the whole module graph at once instead of discovering imports one level at a time.
test('modulepreload links match each page\'s import graph', () => {
  for (const p of PAGES) {
    const html = readFileSync(p, 'utf8');
    const entries = [...html.matchAll(/<script type="module" src="([^"]+)">/g)].map((m) => normalize(join(dirname(p), m[1])));
    const seen = new Set();
    const walk = (f) => {
      if (seen.has(f)) return;
      seen.add(f);
      for (const m of readFileSync(f, 'utf8').matchAll(/^import\s[^'"]*['"](\.{1,2}\/[^'"]+)['"]/gm)) walk(normalize(join(dirname(f), m[1])));
    };
    entries.forEach(walk);
    const want = [...seen].filter((f) => !entries.includes(f)).sort();
    const have = [...html.matchAll(/<link rel="modulepreload" href="([^"]+)">/g)].map((m) => normalize(join(dirname(p), m[1]))).sort();
    assert.deepEqual(have, want, `${p}: modulepreload links should be exactly the imported modules`);
  }
});

test('preloaded fonts, icons and manifest icons exist', () => {
  for (const p of PAGES) {
    const html = readFileSync(p, 'utf8');
    for (const m of html.matchAll(/<link rel="(?:preload|apple-touch-icon|icon)" href="([^"]+)"/g)) {
      assert.ok(existsSync(normalize(join(dirname(p), m[1]))), `${p} links to missing ${m[1]}`);
    }
  }
  const manifest = JSON.parse(readFileSync('manifest.webmanifest', 'utf8'));
  for (const i of manifest.icons) assert.ok(existsSync(i.src), `manifest icon ${i.src} missing`);
  for (const size of ['192x192', '512x512']) assert.ok(manifest.icons.some((i) => i.sizes === size && i.type === 'image/png'), `manifest needs a ${size} PNG icon`);
  assert.ok(manifest.icons.some((i) => i.purpose === 'maskable'), 'manifest needs a maskable icon');
});

test('every page has a privacy link via the shared footer and the privacy page exists', () => {
  assert.ok(existsSync('privacy.html'));
  assert.match(readFileSync('js/layout.js', 'utf8'), /privacy\.html/);
});

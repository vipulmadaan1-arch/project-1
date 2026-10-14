import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
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

test('every page has a privacy link via the shared footer and the privacy page exists', () => {
  assert.ok(existsSync('privacy.html'));
  assert.match(readFileSync('js/layout.js', 'utf8'), /privacy\.html/);
});

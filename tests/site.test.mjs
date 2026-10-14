import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
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

test('every page has a Content-Security-Policy that allows its inline scripts', () => {
  const pages = ['index.html', 'privacy.html', ...readdirSync('tools').map((f) => `tools/${f}`)];
  for (const p of pages) {
    const html = readFileSync(p, 'utf8');
    const csp = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/)?.[1];
    assert.ok(csp, `${p} has no CSP meta tag`);
    assert.ok(html.indexOf('http-equiv="Content-Security-Policy"') < html.indexOf('<script'), `${p}: CSP must come before the first script`);
    assert.match(csp, /object-src 'none'/);
    assert.match(csp, /base-uri 'none'/);
    assert.match(html, /<meta name="referrer" content="strict-origin-when-cross-origin">/, `${p} has no referrer policy`);
    // Inline scripts run only if their hash is in the policy (JSON-LD data blocks don't run, so they're exempt).
    for (const [, attrs, body] of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
      if (/type="application\/ld\+json"/.test(attrs)) continue;
      assert.ok(!/\ssrc=/.test(attrs), `${p}: load scripts through the boot script, not <script src> (blocked by 'strict-dynamic')`);
      const hash = createHash('sha256').update(body).digest('base64');
      assert.ok(csp.includes(`'sha256-${hash}'`), `${p}: inline script hash sha256-${hash} is not in the CSP`);
    }
    assert.doesNotMatch(html, /\son[a-z]+="/, `${p} has an inline event handler`);
  }
});

test('every page has a privacy link via the shared footer and the privacy page exists', () => {
  assert.ok(existsSync('privacy.html'));
  assert.match(readFileSync('js/layout.js', 'utf8'), /privacy\.html/);
});

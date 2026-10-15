import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
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
    'index.html', 'privacy.html', 'about.html', '404.html', 'css/style.css',
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
  const pages = ['index.html', 'privacy.html', 'about.html', '404.html', ...readdirSync('tools').map((f) => `tools/${f}`)];
  for (const p of pages) {
    const html = readFileSync(p, 'utf8');
    const csp = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/)?.[1];
    assert.ok(csp, `${p} has no CSP meta tag`);
    assert.ok(html.indexOf('http-equiv="Content-Security-Policy"') < html.indexOf('<script'), `${p}: CSP must come before the first script`);
    assert.match(csp, /object-src 'none'/);
    // The 404 page needs <base> so its links work at any missing address; every other page forbids it.
    assert.match(csp, p === '404.html' ? /base-uri 'self'/ : /base-uri 'none'/);
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

const HTML_PAGES = ['index.html', 'privacy.html', 'about.html', '404.html', ...readdirSync('tools').map((f) => `tools/${f}`)];

// Each page lists every module its scripts import as <link rel="modulepreload">, so the browser fetches
// the whole module graph at once instead of discovering imports one level at a time.
test('modulepreload links match each page\'s import graph', () => {
  for (const p of HTML_PAGES) {
    const html = readFileSync(p, 'utf8');
    // Pages load their module through the boot script's data-module attribute.
    const entries = [...html.matchAll(/<script data-module="([^"]+)">/g)].map((m) => normalize(join(dirname(p), m[1])));
    const seen = new Set();
    const walk = (f) => {
      if (seen.has(f)) return;
      seen.add(f);
      for (const m of readFileSync(f, 'utf8').matchAll(/^import\s[^'"]*['"](\.{1,2}\/[^'"]+)['"]/gm)) walk(normalize(join(dirname(f), m[1])));
    };
    entries.forEach(walk);
    const want = [...seen].sort();
    const have = [...html.matchAll(/<link rel="modulepreload" href="([^"]+)">/g)].map((m) => normalize(join(dirname(p), m[1]))).sort();
    assert.deepEqual(have, want, `${p}: modulepreload links should be exactly the page module and everything it imports`);
  }
});

test('preloaded fonts, icons and manifest icons exist', () => {
  for (const p of HTML_PAGES) {
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

test('every page has privacy and about links via the shared footer, and both pages exist', () => {
  assert.ok(existsSync('privacy.html'));
  assert.ok(existsSync('about.html'));
  assert.match(readFileSync('js/layout.js', 'utf8'), /privacy\.html/);
  assert.match(readFileSync('js/layout.js', 'utf8'), /about\.html/);
});

// ---------- SEO ----------
const PAGES = ['index.html', 'privacy.html', 'about.html', ...TOOLS.map((t) => `tools/${t.slug}.html`)];
const read = (f) => readFileSync(f, 'utf8');

test('every page has valid JSON-LD', () => {
  for (const f of [...PAGES, '404.html']) {
    for (const [, json] of read(f).matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
      assert.doesNotThrow(() => JSON.parse(json), `bad JSON-LD in ${f}`);
    }
  }
});

test('titles and descriptions are unique, with one h1 and share tags per page', () => {
  const titles = new Set(); const descs = new Set();
  for (const f of PAGES) {
    const html = read(f);
    const title = html.match(/<title>(.+?)<\/title>/)[1];
    const desc = html.match(/<meta name="description" content="([^"]+)">/)[1];
    assert.ok(!titles.has(title), `duplicate title in ${f}`); titles.add(title);
    assert.ok(!descs.has(desc), `duplicate description in ${f}`); descs.add(desc);
    assert.equal(html.match(/<h1[\s>]/g)?.length, 1, `${f} should have exactly one h1`);
    assert.match(html, /<meta property="og:title" content=".+">/, `${f} missing og:title (run npm run seo)`);
  }
});

test('home page links to every tool in its static HTML (no JavaScript needed)', () => {
  const html = read('index.html');
  for (const t of TOOLS) assert.ok(html.includes(`<a class="tile-link" href="tools/${t.slug}.html">`), `index.html has no static link to ${t.slug} (run npm run seo)`);
});

test('once SITE_URL is set, pages carry canonical links and the sitemap lists them', async () => {
  const { SITE_URL } = await import('../js/config.js');
  if (!SITE_URL) return;
  const sitemap = read('sitemap.xml');
  for (const f of PAGES) {
    const url = `${SITE_URL}/${f === 'index.html' ? '' : f}`;
    assert.ok(read(f).includes(`<link rel="canonical" href="${url}">`), `${f} canonical is not ${url} (run npm run seo)`);
    assert.ok(sitemap.includes(`<loc>${url}</loc>`), `sitemap.xml is missing ${url} (run npm run seo)`);
  }
});

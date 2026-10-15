// Writes everything search engines and social sites read that depends on the site's address,
// so the domain lives in one place: SITE_URL in js/config.js.
//   - <head> tags between <!-- seo:start --> and <!-- seo:end -->: canonical link, Open Graph,
//     Twitter card, BreadcrumbList JSON-LD (built from each page's visible breadcrumb) and,
//     on the home page, WebSite and Organization JSON-LD. Tool pages' WebApplication JSON-LD
//     (written by scripts/content.py) points at the same Organization as its publisher.
//   - The visible breadcrumb's first link is always "Home".
//   - The static tool list between <!-- tiles:start --> and <!-- tiles:end --> on the home and
//     404 pages, so every tool has a plain link even before JavaScript runs.
//   - sitemap.xml (lastmod = date of each page's last commit) and robots.txt.
//   - The Content-Security-Policy meta tag on every page (built here, with the hash of the page's inline
//     boot script), the <link rel="modulepreload"> list (each page's whole static import graph) and the
//     <noscript> notice, so the copies on 45 pages can't drift.
//   - The site footer (tool links by section, About, Privacy and the general-information notice) between
//     <!-- footer:start --> and <!-- footer:end --> after </main>, from js/site-footer.js, so crawlers and no-JS
//     visitors see it; js/layout.js reuses it instead of adding another.
//   - Content hashes in sw.js (scripts/sw-hashes.mjs), last, once every page is final.
// Every marker or tag this script edits must be present: a missing one stops the run with the file's name,
// and nothing is written until every page has been built.
// Usage: npm run seo                         (uses SITE_URL from js/config.js)
//        npm run seo -- https://example.com.au (overrides it for this run)
// Safe to rerun. Without a SITE_URL it writes only the tags that don't need an address.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, normalize, relative } from 'node:path';
import { execFileSync } from 'node:child_process';
import { TOOLS, CATEGORIES } from '../js/tools.js';
import { SITE_NAME, SITE_URL } from '../js/config.js';
import { icon } from '../js/icons.js';
import { ADS_ENABLED } from '../js/ads.js';
import { updateSwHashes } from './sw-hashes.mjs';
import { footerHtml } from '../js/site-footer.js';

const base = (process.argv[2] || SITE_URL || '').replace(/\/+$/, '');
if (base && !/^https:\/\/[^/]+/.test(base)) {
  console.error(`SITE_URL "${base}" should look like https://sortedmate.com.au`);
  process.exit(1);
}

const OG_IMAGE = { path: 'img/og.png', width: 1200, height: 630, alt: `${SITE_NAME}: free Australian calculators for stamp duty, take-home pay, mortgages and GST` };
const esc = (s) => String(s).replace(/&(?!amp;|lt;|gt;|quot;|#)/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const unesc = (s) => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

// Replace a pattern that must be in the file; throws with the file name when it isn't.
function must(html, re, repl, file, what) {
  if (!re.test(html)) throw new Error(`${file}: can't find ${what}. Copy the markup from an existing page.`);
  re.lastIndex = 0;
  return html.replace(re, repl);
}
function matchOrThrow(html, re, file, what) {
  const m = html.match(re);
  if (!m) throw new Error(`${file}: can't find ${what}.`);
  return m;
}

// Indexable pages, with their address relative to the site root.
const PAGES = [
  { file: 'index.html', path: '' },
  ...TOOLS.map((t) => ({ file: `tools/${t.slug}.html`, path: `tools/${t.slug}.html` })),
  { file: 'about.html', path: 'about.html' },
  { file: 'privacy.html', path: 'privacy.html' },
];

// Sitemap lastmod = date of each page's last commit, or today if it has uncommitted changes (or no
// history). Worked out before any page is rewritten below, so rerunning this script doesn't make
// every page look modified today.
const today = new Date().toISOString().slice(0, 10);
const git = (args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
function lastmod(file) {
  try {
    if (git(['status', '--porcelain', '--', file])) return today;
    return git(['log', '-1', '--format=%cs', '--', file]) || today;
  } catch { return today; }
}
const LASTMOD = new Map(PAGES.map((p) => [p.file, lastmod(p.file)]));

function headBlock(html, page) {
  const url = base ? `${base}/${page.path}` : '';
  const title = unesc(matchOrThrow(html, /<title>(.*?)<\/title>/, page.file, '<title>')[1]).replace(` | ${SITE_NAME}`, '');
  const desc = unesc(matchOrThrow(html, /<meta name="description" content="([^"]*)">/, page.file, 'the meta description')[1]);
  const tags = [];
  if (url) tags.push(`<link rel="canonical" href="${url}">`);
  tags.push(
    `<meta property="og:site_name" content="${esc(SITE_NAME)}">`,
    '<meta property="og:locale" content="en_AU">',
    '<meta property="og:type" content="website">',
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(desc)}">`,
  );
  if (url) {
    tags.push(
      `<meta property="og:url" content="${url}">`,
      `<meta property="og:image" content="${base}/${OG_IMAGE.path}">`,
      `<meta property="og:image:width" content="${OG_IMAGE.width}">`,
      `<meta property="og:image:height" content="${OG_IMAGE.height}">`,
      `<meta property="og:image:alt" content="${esc(OG_IMAGE.alt)}">`,
    );
  }
  tags.push('<meta name="twitter:card" content="summary_large_image">');

  // Structured data that needs absolute URLs.
  const ld = [];
  if (page.path === '') {
    // Same @id as the publisher in each tool page's WebApplication JSON-LD (scripts/content.py).
    ld.push({ '@context': 'https://schema.org', '@type': 'Organization', name: SITE_NAME, ...(url ? { '@id': `${url}#organization`, url } : {}) });
    if (url) ld.push({ '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME, alternateName: SITE_NAME.replace(',', ''), url, publisher: { '@id': `${url}#organization` } });
  }
  const crumbs = html.match(/<nav class="crumbs"[^>]*>([\s\S]*?)<\/nav>/);
  if (url && crumbs) {
    const items = [...crumbs[1].matchAll(/<a href="([^"]*)">([^<]+)<\/a>|<span aria-current="page">([^<]+)<\/span>/g)];
    ld.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((m, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: unesc(m[2] || m[3]),
        // Section crumbs link to a #fragment of the home page, which isn't a page of its own,
        // so they're listed by name only.
        ...(m[1] !== undefined && !m[1].includes('#') ? { item: new URL(m[1], url).href } : {}),
      })),
    });
  }
  if (ld.length) tags.push(`<script type="application/ld+json" id="ld-seo">${JSON.stringify(ld.length === 1 ? ld[0] : ld)}</script>`);
  return tags;
}

function stamp(html, tags, file) {
  html = html.replace(/\n {2}<!-- seo:start -->[\s\S]*?<!-- seo:end -->/, '');
  html = html.replace(/\n {2}<meta property="og:[^>]*>/g, ''); // tags from older versions of the pages
  const block = `\n  <!-- seo:start -->\n${tags.map((t) => `  ${t}`).join('\n')}\n  <!-- seo:end -->`;
  html = must(html, /\n {2}<link rel="stylesheet"/, `${block}\n  <link rel="stylesheet"`, file, 'the stylesheet link');
  // The web font is preloaded straight after the stylesheet, so it's usually there for the first paint
  // (style.css uses font-display: optional: text never swaps fonts after it's shown, so nothing shifts).
  html = html.replace(/\n {2}<link rel="preload" href="[^"]*instrument-sans\.woff2"[^>]*>/g, '');
  return must(html, /(\n {2}<link rel="stylesheet" href="((?:\.\.\/)?)css\/style\.css">)/, '$1\n  <link rel="preload" href="$2fonts/instrument-sans.woff2" as="font" type="font/woff2" crossorigin>', file, 'the css/style.css link');
}

// Content-Security-Policy, the same on every page apart from the boot script's hash and base-uri.
// - script-src: only the inline boot script (by hash) runs; 'strict-dynamic' lets the modules it loads run and
//   import others. 'unsafe-inline' and https: http: are ignored by browsers that support 'strict-dynamic' and
//   only matter to very old ones.
// - style-src needs 'unsafe-inline': some pages use style="" attributes.
// - form-action 'none': forms never submit (each calculator works out results in the page).
// - base-uri: 'none', except the 404 page, whose <base> makes its links work at any missing address.
// AdSense (js/ads.js, off until ADSENSE_CLIENT and ADSENSE_SLOT are set) needs more: Google's scripts use eval
// and load images, frames and connections from many Google domains. Once ads are enabled and this script is
// rerun, the policy adds 'unsafe-eval' and https: for img-src, connect-src and frame-src.
function csp(html, file) {
  const boot = matchOrThrow(html, /<script data-module="[^"]+">([\s\S]*?)<\/script>/, file, 'the inline boot script')[1];
  const hash = createHash('sha256').update(boot).digest('base64');
  const ads = ADS_ENABLED;
  return [
    "default-src 'self'",
    `script-src 'sha256-${hash}' 'strict-dynamic' 'unsafe-inline'${ads ? " 'unsafe-eval'" : ''} https: http:`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data:${ads ? ' https:' : ''}`,
    "font-src 'self'",
    `connect-src 'self'${ads ? ' https:' : ''}`,
    `frame-src ${ads ? 'https:' : "'none'"}`,
    "object-src 'none'",
    `base-uri ${file === '404.html' ? "'self'" : "'none'"}`,
    "form-action 'none'",
  ].join('; ');
}
const withCsp = (html, file) => must(html, /<meta http-equiv="Content-Security-Policy" content="[^"]*">/, `<meta http-equiv="Content-Security-Policy" content="${csp(html, file)}">`, file, 'the Content-Security-Policy meta tag');

// <link rel="modulepreload"> for the page module and everything it imports, dependencies first, so the browser
// fetches the whole module graph at once instead of discovering imports one level at a time.
function preloads(html, file) {
  const entry = matchOrThrow(html, /<script data-module="([^"]+)">/, file, 'the boot script\'s data-module')[1];
  const order = [];
  const seen = new Set();
  const walk = (f) => {
    if (seen.has(f)) return;
    seen.add(f);
    for (const m of readFileSync(f, 'utf8').matchAll(/^import\s[^'"]*['"](\.{1,2}\/[^'"]+)['"]/gm)) walk(normalize(join(dirname(f), m[1])));
    order.push(f);
  };
  walk(normalize(join(dirname(file), entry)));
  return order.map((f) => `  <link rel="modulepreload" href="${relative(dirname(file), f)}">`).join('\n');
}
function withPreloads(html, file) {
  const re = /(?:\n {2}<link rel="modulepreload" href="[^"]*">)+/;
  return must(html, re, `\n${preloads(html, file)}`, file, 'the <link rel="modulepreload"> list');
}

// Shown when JavaScript is off (or blocked): the explanations still read fine, but nothing calculates.
const NOSCRIPT = '<noscript><p class="noscript">The calculators on this site need JavaScript. Turn it on in your browser to use them.</p></noscript>';
function withNoscript(html, file) {
  html = html.replace(/\n {4}<noscript>[\s\S]*?<\/noscript>/g, '');
  return must(html, /(\n {2}<main class="wrap">)/, `$1\n    ${NOSCRIPT}`, file, '<main class="wrap">');
}

// The footer, with links relative to the page (tool pages are one folder down; the 404 page's <base> points at the root).
function withFooter(html, file) {
  html = html.replace(/\n {2}<!-- footer:start -->[\s\S]*?<!-- footer:end -->/, '');
  const base = matchOrThrow(html, /<html lang="en-AU" data-base="([^"]*)">/, file, 'the data-base attribute on <html>')[1];
  const block = `\n  <!-- footer:start -->\n  ${footerHtml(base).replace(/\n/g, '\n  ')}\n  <!-- footer:end -->`;
  return must(html, /(\n {2}<\/main>)/, `$1${block}`, file, 'the "  </main>" line');
}

// Everything every page gets.
const common = (html, file) => withFooter(withNoscript(withPreloads(withCsp(html, file), file), file), file);

// Static tool tiles. js/pages/home.js re-renders them (adding pins and search), but the plain
// links are in the HTML so crawlers and no-JS visitors can reach every tool.
function tiles() {
  // Same markup as js/pages/home.js (minus the pin button, which needs JS).
  const tile = (t) => `<div class="tile"><div class="ico">${icon(t.slug)}</div><h3><a class="tile-link" href="tools/${t.slug}.html">${t.name}</a></h3><p>${t.desc}</p><div class="tile-foot"><span class="tag">${t.meta}</span>${icon('arrow', { className: 'icon tile-go' })}</div></div>`;
  return CATEGORIES.map((c) => {
    const list = TOOLS.filter((t) => t.cat === c.key);
    return `      <section class="cat-section" id="${c.key}"><div class="cat-head"><h2 class="cat-title">${c.title}</h2><span class="cat-count">${list.length}<span class="visually-hidden"> tools</span></span><p class="cat-blurb">${c.blurb}</p></div>
        <div class="grid">${list.map(tile).join('')}</div></section>`;
  }).join('\n');
}
const withTiles = (html, file) => must(html, /(<!-- tiles:start -->)[\s\S]*?(\s*<!-- tiles:end -->)/, `$1\n${tiles()}$2`, file, 'the <!-- tiles:start --> … <!-- tiles:end --> markers');

// The home page's "Popular" row under the search box: the four most used tools, as plain links, so on a
// phone they're in view before any scrolling.
const POPULAR = [['take-home-pay', 'Take-home pay'], ['stamp-duty', 'Stamp duty'], ['mortgage', 'Mortgage'], ['tax-refund', 'Tax refund']];
const popular = () => `<nav class="popular" aria-label="Popular tools"><p class="popular-label">Popular</p><ul>${POPULAR.map(([slug, label]) => {
  if (!TOOLS.some((t) => t.slug === slug)) throw new Error(`POPULAR lists unknown tool ${slug}`);
  return `<li><a href="tools/${slug}.html">${icon(slug)}<span>${label}</span></a></li>`;
}).join('')}</ul></nav>`;
const withPopular = (html, file) => must(html, /(<!-- popular:start -->)[\s\S]*?(<!-- popular:end -->)/, `$1\n        ${popular()}\n        $2`, file, 'the <!-- popular:start --> … <!-- popular:end --> markers');

// Each tool page's breadcrumb names its home page section, so moving a tool between sections
// in js/tools.js is a one-line change.
const crumbFor = (t) => { const c = CATEGORIES.find((x) => x.key === t.cat); return `<a href="../#${c.key}">${c.title}</a>`; };
// Build every page first; write them all only once nothing has failed, so a missing marker never leaves
// half the site regenerated.
const out = new Map();
for (const page of PAGES) {
  let html = readFileSync(page.file, 'utf8');
  const tool = TOOLS.find((t) => page.file === `tools/${t.slug}.html`);
  if (page.file !== 'index.html') html = must(html, /(<nav class="crumbs"[^>]*><a href="(?:\.\.\/|\.\/)">)(?:Tools|Home)(<\/a>)/, '$1Home$2', page.file, 'the breadcrumb\'s first link');
  if (tool) html = must(html, /(<nav class="crumbs"[^>]*><a href="\.\.\/">Home<\/a><span aria-hidden="true">\/<\/span>)<a href="\.\.\/#[a-z]+">[^<]*<\/a>/, `$1${crumbFor(tool)}`, page.file, 'the breadcrumb\'s section link');
  html = stamp(html, headBlock(html, page), page.file);
  if (page.file === 'index.html') html = withPopular(withTiles(html, page.file), page.file);
  out.set(page.file, common(html, page.file));
}

// 404 page: GitHub Pages serves it for any missing address, so its links need a fixed base.
let notFound = must(readFileSync('404.html', 'utf8'), /(<nav class="crumbs"[^>]*><a href="\.\/">)(?:Tools|Home)(<\/a>)/, '$1Home$2', '404.html', 'the breadcrumb\'s first link');
const basePath = base ? new URL(`${base}/`).pathname : '/';
notFound = stamp(notFound, [`<base href="${basePath}">`, '<meta name="robots" content="noindex">'], '404.html');
out.set('404.html', common(withTiles(notFound, '404.html'), '404.html'));

for (const [file, html] of out) writeFileSync(file, html);
// Last, once every page is final: content hashes for the service worker.
updateSwHashes();

if (!base) {
  console.log('Updated page tags and tool links. Set SITE_URL in js/config.js, then rerun for canonical links, share images and sitemap.xml.');
  process.exit(0);
}

writeFileSync('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PAGES.map((p) => `  <url><loc>${base}/${p.path}</loc><lastmod>${LASTMOD.get(p.file)}</lastmod></url>`).join('\n')}
</urlset>
`);
writeFileSync('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`);
if (!existsSync(OG_IMAGE.path)) console.warn(`Warning: ${OG_IMAGE.path} is missing.`);
console.log(`Stamped ${PAGES.length + 1} pages for ${base} and wrote sitemap.xml (${PAGES.length} URLs) and robots.txt.`);

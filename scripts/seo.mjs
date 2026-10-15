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
// Usage: npm run seo                         (uses SITE_URL from js/config.js)
//        npm run seo -- https://example.com.au (overrides it for this run)
// Safe to rerun. Without a SITE_URL it writes only the tags that don't need an address.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { TOOLS, CATEGORIES } from '../js/tools.js';
import { SITE_NAME, SITE_URL } from '../js/config.js';
import { icon } from '../js/icons.js';

const base = (process.argv[2] || SITE_URL || '').replace(/\/+$/, '');
if (base && !/^https:\/\/[^/]+/.test(base)) {
  console.error(`SITE_URL "${base}" should look like https://sortedmate.com.au`);
  process.exit(1);
}

const OG_IMAGE = { path: 'img/og.png', width: 1200, height: 630, alt: `${SITE_NAME}: free Australian calculators for stamp duty, take-home pay, mortgages and GST` };
const esc = (s) => String(s).replace(/&(?!amp;|lt;|gt;|quot;|#)/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const unesc = (s) => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

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
  const title = unesc(html.match(/<title>(.*?)<\/title>/)[1]).replace(` | ${SITE_NAME}`, '');
  const desc = unesc(html.match(/<meta name="description" content="([^"]*)">/)[1]);
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

function stamp(html, tags) {
  html = html.replace(/\n {2}<!-- seo:start -->[\s\S]*?<!-- seo:end -->/, '');
  html = html.replace(/\n {2}<meta property="og:[^>]*>/g, ''); // tags from older versions of the pages
  const block = `\n  <!-- seo:start -->\n${tags.map((t) => `  ${t}`).join('\n')}\n  <!-- seo:end -->`;
  return html.replace(/\n {2}<link rel="stylesheet"/, `${block}\n  <link rel="stylesheet"`);
}

// Static tool tiles. js/pages/home.js re-renders them (adding pins and search), but the plain
// links are in the HTML so crawlers and no-JS visitors can reach every tool.
function tiles() {
  // Same markup as js/pages/home.js (minus the pin button, which needs JS).
  const tile = (t) => `<div class="tile"><div class="ico">${icon(t.slug)}</div><h3><a class="tile-link" href="tools/${t.slug}.html">${t.name}</a></h3><p>${t.desc}</p><div class="tile-foot"><span class="tag">${t.meta}</span>${icon('arrow', { className: 'icon tile-go' })}</div></div>`;
  return CATEGORIES.map((c) => {
    const list = TOOLS.filter((t) => t.cat === c.key);
    return `      <section class="cat-section" id="${c.key}"><div class="cat-head"><h2 class="cat-title">${c.title}</h2><span class="cat-count">${list.length}</span><p class="cat-blurb">${c.blurb}</p></div>
        <div class="grid">${list.map(tile).join('')}</div></section>`;
  }).join('\n');
}
const withTiles = (html) => html.replace(/(<!-- tiles:start -->)[\s\S]*?(\s*<!-- tiles:end -->)/, `$1\n${tiles()}$2`);

// Each tool page's breadcrumb names its home page section, so moving a tool between sections
// in js/tools.js is a one-line change.
const crumbFor = (t) => { const c = CATEGORIES.find((x) => x.key === t.cat); return `<a href="../#${c.key}">${c.title}</a>`; };
for (const page of PAGES) {
  let html = readFileSync(page.file, 'utf8');
  const tool = TOOLS.find((t) => page.file === `tools/${t.slug}.html`);
  html = html.replace(/(<nav class="crumbs"[^>]*><a href="(?:\.\.\/|\.\/)">)(?:Tools|Home)(<\/a>)/, '$1Home$2');
  if (tool) html = html.replace(/(<nav class="crumbs"[^>]*><a href="\.\.\/">Home<\/a><span aria-hidden="true">\/<\/span>)<a href="\.\.\/#[a-z]+">[^<]*<\/a>/, `$1${crumbFor(tool)}`);
  html = stamp(html, headBlock(html, page));
  if (page.file === 'index.html') html = withTiles(html);
  writeFileSync(page.file, html);
}

// 404 page: GitHub Pages serves it for any missing address, so its links need a fixed base.
let notFound = readFileSync('404.html', 'utf8').replace(/(<nav class="crumbs"[^>]*><a href="\.\/">)Tools(<\/a>)/, '$1Home$2');
const basePath = base ? new URL(`${base}/`).pathname : '/';
notFound = stamp(notFound, [`<base href="${basePath}">`, '<meta name="robots" content="noindex">']);
writeFileSync('404.html', withTiles(notFound));

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

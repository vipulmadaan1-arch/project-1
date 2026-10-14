// Generates sitemap.xml and points robots.txt at it.
// Usage: node scripts/sitemap.mjs https://your-domain.com.au
import { writeFileSync } from 'node:fs';
import { TOOLS } from '../js/tools.js';

const base = (process.argv[2] || '').replace(/\/$/, '');
if (!/^https?:\/\//.test(base)) {
  console.error('Usage: node scripts/sitemap.mjs https://your-domain.com.au');
  process.exit(1);
}
const today = new Date().toISOString().slice(0, 10);
const urls = [`${base}/`, ...TOOLS.map((t) => `${base}/tools/${t.slug}.html`), `${base}/privacy.html`];
writeFileSync('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`);
writeFileSync('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`);
console.log(`Wrote sitemap.xml with ${urls.length} URLs`);

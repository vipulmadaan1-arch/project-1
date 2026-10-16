// Tells Bing (and the other IndexNow search engines) which pages changed in a deploy, so they recrawl them soon
// instead of waiting for their next visit. Run by the deploy workflow after GitHub Pages is live:
//   node scripts/indexnow.mjs <previous commit> <this commit>
// It submits only pages that changed and are in sitemap.xml. The key file (KEY.txt at the site root) proves we
// own the site; https://www.indexnow.org/documentation describes the protocol.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { SITE_URL } from '../js/config.js';

export const KEY = 'cbc8338f6c0727d789325048cd4e2fd4';

// Site files a commit range touched, as public URLs listed in the sitemap.
export function changedUrls(files, sitemap, siteUrl = SITE_URL) {
  const listed = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
  const urls = files.filter((f) => f.endsWith('.html'))
    .map((f) => `${siteUrl}/${f === 'index.html' ? '' : f}`)
    .filter((u) => listed.has(u));
  return [...new Set(urls)];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [before, after] = process.argv.slice(2);
  if (!SITE_URL || !before || /^0+$/.test(before) || !after) {
    console.log('IndexNow: no previous commit to compare with, nothing submitted.');
    process.exit(0);
  }
  const files = execFileSync('git', ['diff', '--name-only', `${before}..${after}`], { encoding: 'utf8' }).split('\n').filter(Boolean);
  const urlList = changedUrls(files, readFileSync('sitemap.xml', 'utf8'));
  if (!urlList.length) { console.log('IndexNow: no changed pages.'); process.exit(0); }
  const host = new URL(SITE_URL).host;
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host, key: KEY, keyLocation: `${SITE_URL}/${KEY}.txt`, urlList }),
  });
  console.log(`IndexNow: submitted ${urlList.length} page(s), HTTP ${res.status}.`);
  // 200 and 202 mean accepted. Anything else is logged but doesn't fail the deploy.
  if (res.status !== 200 && res.status !== 202) console.log(await res.text());
}

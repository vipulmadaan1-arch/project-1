// Lists anything still to set before launch. Usage: npm run launch-check
import { existsSync, readFileSync } from 'node:fs';
import { BMC_URL, SITE_NAME, SITE_URL, ADSENSE_CLIENT, ADSENSE_SLOT, CONTACT_EMAIL, CONSENT_CONFIRMED } from '../js/config.js';

const todo = [];
if (BMC_URL.includes('YOUR_HANDLE')) todo.push('Set BMC_URL in js/config.js (coffee button is hidden until you do).');
if (!SITE_URL) todo.push('Set SITE_URL in js/config.js once you have a domain, then run: npm run seo');
else if (!existsSync('sitemap.xml') || !readFileSync('index.html', 'utf8').includes(`<link rel="canonical" href="${SITE_URL}/">`)) todo.push('Run: npm run seo (canonical links and sitemap.xml are out of date for SITE_URL).');
if (!readFileSync('robots.txt', 'utf8').includes('Sitemap:')) todo.push('robots.txt has no Sitemap line (npm run seo adds it).');
if (!CONTACT_EMAIL) todo.push('Set CONTACT_EMAIL in js/config.js so the privacy page lists a contact.');
if (!ADSENSE_CLIENT) {
  console.log('Ads: off (set ADSENSE_CLIENT and ADSENSE_SLOT in js/config.js once AdSense approves the site).');
} else {
  if (!/^ca-pub-\d{10,20}$/.test(ADSENSE_CLIENT)) todo.push(`ADSENSE_CLIENT "${ADSENSE_CLIENT}" should look like ca-pub-1234567890123456.`);
  if (!/^\d{6,12}$/.test(ADSENSE_SLOT)) todo.push('Set ADSENSE_SLOT in js/config.js to your display ad unit ID (digits only).');
  const pub = ADSENSE_CLIENT.replace(/^ca-/, '');
  if (!existsSync('ads.txt') || !readFileSync('ads.txt', 'utf8').includes(pub)) todo.push('Run: npm run ads-txt (ads.txt is missing or does not match ADSENSE_CLIENT).');
  // Ads stay off (js/ads.js) until both are set; this says why.
  const blockers = [];
  if (!CONTACT_EMAIL) blockers.push('set CONTACT_EMAIL in js/config.js (the privacy page must list a contact before ads run)');
  if (CONSENT_CONFIRMED !== true) blockers.push('publish the European regulations message in AdSense → Privacy & messaging (Google requires a certified consent banner for EEA, UK and Swiss visitors), then set CONSENT_CONFIRMED = true in js/config.js');
  if (blockers.length) {
    console.error(`Ads are blocked until you:\n- ${blockers.join('\n- ')}`);
    process.exitCode = 1;
  } else if (!readFileSync('index.html', 'utf8').includes("'unsafe-eval'")) {
    todo.push('Run: npm run seo (the Content-Security-Policy still blocks Google\'s ad scripts).');
  }
}
console.log(`Site name: ${SITE_NAME}`);
console.log(todo.length ? `Before launch:\n- ${todo.join('\n- ')}` : 'Ready to launch.');
console.log('\nAfter merging to main: Settings → Pages → Source: GitHub Actions, then add the site to Google Search Console.');

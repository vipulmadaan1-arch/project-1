// Lists everything the site owner still has to set before launch, with the file and line to edit.
// Usage: npm run launch-check   (exits with an error when something would break a rule, such as ads without
// consent or an affiliate link to a financial product)
import { existsSync, readFileSync } from 'node:fs';
import {
  BMC_URL, SITE_NAME, SITE_URL, ADSENSE_CLIENT, ADSENSE_SLOT, CONTACT_EMAIL, CONSENT_CONFIRMED,
  AFFILIATES_ENABLED, AFFILIATES, ADS_EXCLUDE,
} from '../js/config.js';
import { HAS_BMC } from '../js/site-footer.js';
import { HAS_CONTACT } from '../js/contact.js';
import { TOOLS } from '../js/tools.js';
import { affiliateProblems, AFFILIATE_CATEGORIES } from '../js/affiliates.js';

// "js/config.js:7": the first line of a file matching a pattern, so each item says exactly where to edit.
function at(file, re) {
  const lines = readFileSync(file, 'utf8').split('\n');
  const i = lines.findIndex((l) => re.test(l));
  return i < 0 ? file : `${file}:${i + 1}`;
}
const cfg = (name) => at('js/config.js', new RegExp(`^export const ${name}\\b`));

const todo = [];
const blockers = [];

// Site address
if (!SITE_URL) todo.push(`SITE_URL: set your domain (e.g. 'https://sortedmate.com.au') at ${cfg('SITE_URL')}, then run: npm run seo`);
else if (!existsSync('sitemap.xml') || !readFileSync('index.html', 'utf8').includes(`<link rel="canonical" href="${SITE_URL}/">`)) todo.push('Run: npm run seo (canonical links and sitemap.xml are out of date for SITE_URL).');
if (SITE_URL && !readFileSync('robots.txt', 'utf8').includes('Sitemap:')) todo.push('robots.txt has no Sitemap line: run npm run seo.');

// Contact, support, owner details and terms
if (!CONTACT_EMAIL) todo.push(`CONTACT_EMAIL: set a contact address at ${cfg('CONTACT_EMAIL')} (shown on the privacy, about and terms pages; it also switches on the Get in touch page's email buttons, the footer's Get in touch link and the "Spot a wrong figure? Tell us" link under each calculator's results; ads stay off without it). Then run: npm run seo (writes the footer link into every page).`);
else if (!HAS_CONTACT) todo.push(`CONTACT_EMAIL "${CONTACT_EMAIL}" at ${cfg('CONTACT_EMAIL')} isn't a plain email address (like hello@example.com), so the contact page, footer link and "Spot a wrong figure" links stay off.`);
else if (!readFileSync('index.html', 'utf8').includes('contact.html">Get in touch</a>')) todo.push('Run: npm run seo (the footer\'s Get in touch link is missing for CONTACT_EMAIL).');
if (!HAS_BMC) todo.push(`BMC_URL: set your Buy Me a Coffee page (https://buymeacoffee.com/<you>) at ${cfg('BMC_URL')}. Every coffee link stays hidden until you do.`);
if (/TODO \(site owner\): if you want to, add your name/.test(readFileSync('about.html', 'utf8'))) {
  todo.push(`Owner name and ABN: add who runs the site (your name or business name, and ABN if you have one) at ${at('about.html', /TODO \(site owner\): if you want to, add your name/)}, then delete the TODO comment.`);
}
if (/TODO \(site owner\): governing law/.test(readFileSync('terms.html', 'utf8'))) {
  todo.push(`Terms governing law: name your state or territory at ${at('terms.html', /TODO \(site owner\): governing law/)} (the paragraph under it), then delete the TODO comment.`);
}

// Advertising
if (!ADSENSE_CLIENT) {
  todo.push(`AdSense (optional): once Google approves the site, set ADSENSE_CLIENT at ${cfg('ADSENSE_CLIENT')} and ADSENSE_SLOT at ${cfg('ADSENSE_SLOT')}, publish the European regulations message in AdSense → Privacy & messaging and set CONSENT_CONFIRMED at ${cfg('CONSENT_CONFIRMED')}, then run npm run ads-txt and npm run seo.`);
} else {
  if (!/^ca-pub-\d{10,20}$/.test(ADSENSE_CLIENT)) todo.push(`ADSENSE_CLIENT "${ADSENSE_CLIENT}" at ${cfg('ADSENSE_CLIENT')} should look like ca-pub-1234567890123456.`);
  if (!/^\d{6,12}$/.test(ADSENSE_SLOT)) todo.push(`ADSENSE_SLOT at ${cfg('ADSENSE_SLOT')}: your display ad unit ID (digits only).`);
  const pub = ADSENSE_CLIENT.replace(/^ca-/, '');
  if (!existsSync('ads.txt') || !readFileSync('ads.txt', 'utf8').includes(pub)) todo.push('ads.txt is missing or doesn\'t match ADSENSE_CLIENT: run npm run ads-txt (the deploy publishes it).');
  // Ads stay off (js/ads.js) until both are set; this says why.
  if (!CONTACT_EMAIL) blockers.push(`set CONTACT_EMAIL at ${cfg('CONTACT_EMAIL')} (the privacy page must list a contact before ads run)`);
  if (CONSENT_CONFIRMED !== true) blockers.push(`publish the European regulations message in AdSense → Privacy & messaging (Google requires a certified consent banner for EEA, UK and Swiss visitors), then set CONSENT_CONFIRMED = true at ${cfg('CONSENT_CONFIRMED')}`);
  if (!blockers.length && !readFileSync('index.html', 'utf8').includes("'unsafe-eval'")) todo.push('Run: npm run seo (the Content-Security-Policy still blocks Google\'s ad scripts).');
  console.log(`Ads: in the AdSense dashboard keep Auto ads off (or limited to explainer text), and add page exclusions for: ${ADS_EXCLUDE.map((s) => `tools/${s}.html`).join(', ')}.`);
}
for (const s of ADS_EXCLUDE) if (!TOOLS.some((t) => t.slug === s)) todo.push(`ADS_EXCLUDE at ${cfg('ADS_EXCLUDE')} lists unknown tool "${s}".`);

// Affiliate links
if (AFFILIATES_ENABLED || AFFILIATES.length) {
  const slugs = TOOLS.map((t) => t.slug);
  const problems = AFFILIATES.flatMap((i) => affiliateProblems(i, slugs));
  if (problems.length) {
    blockers.push(`fix the affiliate list at ${cfg('AFFILIATES')} (these entries are refused and never shown):\n    ${problems.join('\n    ')}`);
  }
  if (AFFILIATES_ENABLED && !AFFILIATES.length) todo.push(`AFFILIATES_ENABLED is true at ${cfg('AFFILIATES_ENABLED')} but the AFFILIATES list is empty, so no card shows.`);
  console.log(`Affiliate links: allowed categories are ${AFFILIATE_CATEGORIES.join(', ')} (js/affiliates.js). Never link a financial or credit product (bank, card, loan, broker, insurance, super, investing, crypto): ASIC's calculator relief (Generic Calculators Instrument 2026/41 s 8(1)(a)) needs the calculators not to promote one, and doing so could need an AFS or credit licence. Under the Australian Consumer Law and the ACCC's guidance on online reviews and endorsements, only recommend what you genuinely use, keep the disclosure next to the links, and don't overstate a product.`);
}

console.log(`Site name: ${SITE_NAME}`);
if (blockers.length) {
  console.error(`Blocked until you:\n- ${blockers.join('\n- ')}`);
  process.exitCode = 1;
}
console.log(todo.length ? `Before launch:\n- ${todo.join('\n- ')}` : 'Ready to launch.');
console.log('\nAfter merging to main: Settings → Pages → Source: GitHub Actions, then add the site to Google Search Console.');

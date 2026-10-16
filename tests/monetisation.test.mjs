// Monetisation and compliance guard rails: ASIC calculator relief (today's dollars, non-reliance statement,
// visible assumptions, printing), where ads may go, the coffee note, affiliate links and the terms page.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { presentValue, PV_INFLATION_PCT, PV_MIN_YEARS } from '../js/present-value.js';
import { BMC_URL, ADS_EXCLUDE, AFFILIATES_ENABLED, AFFILIATES } from '../js/config.js';
import { HAS_BMC } from '../js/site-footer.js';
import { TOOLS } from '../js/tools.js';
import { affiliateProblems, affiliatesFor, affiliateCardHtml, AFFILIATE_DISCLOSURE, AFFILIATE_DEFAULT_PAGES } from '../js/affiliates.js';

const read = (f) => readFileSync(f, 'utf8');
// The page as written, without the generated explainer and FAQ (so "visible on the page" means outside the FAQ).
const body = (slug) => read(`tools/${slug}.html`).replace(/<!-- content:start -->[\s\S]*?<!-- content:end -->/, '');

test('present value follows ASIC Instrument 2026/41 s 6: C / (1 + r)^n, r = 2.5% unless the user changes it', () => {
  assert.equal(PV_INFLATION_PCT, 2.5);
  assert.equal(PV_MIN_YEARS, 2);
  assert.ok(Math.abs(presentValue(1025, 1) - 1000) < 1e-9);
  assert.ok(Math.abs(presentValue(10000, 10) - 10000 / 1.025 ** 10) < 1e-9);
  assert.ok(Math.abs(presentValue(10000, 2.5, 4) - 10000 / 1.04 ** 2.5) < 1e-9);
  assert.equal(presentValue(500, 0), 500);
  assert.equal(presentValue(NaN, 3), null);
});

const FINANCIAL_PRODUCT_TOOLS = ['compound-interest', 'savings-goal', 'term-deposit', 'rent-vs-buy'];
const NON_RELIANCE = 'This calculator is not intended to be relied on for the purposes of making a decision about a financial product. You should consider obtaining advice from a financial services licensee';

test('financial-product calculators: editable inflation, a today\'s dollars line, visible assumptions and the non-reliance statement', () => {
  for (const slug of FINANCIAL_PRODUCT_TOOLS) {
    const html = body(slug);
    assert.match(html, /<input type="text" id="cpi" class="num"[^>]* value="2\.5"/, `${slug}: editable inflation field defaulting to 2.5%`);
    assert.match(html, /id="pv-row"[\s\S]*?id="pv-label"[\s\S]*?id="pv"/, `${slug}: today's dollars row`);
    assert.match(html, /<section class="card readout"[\s\S]*?id="pv"[\s\S]*?<\/section>/, `${slug}: today's dollars inside the results`);
    const assume = html.match(/<section class="card assumptions"[\s\S]*?<\/section>/)?.[0];
    assert.ok(assume, `${slug}: assumptions card on the page, not only in the FAQ`);
    assert.doesNotMatch(assume, /<details/, `${slug}: assumptions aren't collapsed`);
    for (const h of ["What it's for:", 'Default assumptions and why they', 'Limitations and their effect:', "Today's dollars:"]) assert.ok(assume.includes(h), `${slug}: assumptions say "${h}"`);
    assert.ok(assume.includes(NON_RELIANCE), `${slug}: non-reliance statement beside the assumptions`);
    assert.ok(html.match(/<p class="disclaimer">[^\n]*/)[0].includes(NON_RELIANCE), `${slug}: non-reliance statement in the results panel`);
    assert.match(read(`js/pages/${slug}.js`), /todaysDollars\(/, `${slug}: script fills the today's dollars line`);
  }
});

test('retirement keeps its RG 276 today\'s dollars, assumptions and advice warning', () => {
  const html = body('retirement');
  assert.match(html, /Super at retirement, in today's dollars/);
  assert.match(html, /<section class="card assumptions"/);
  assert.match(html, /consider advice from a licensed financial adviser \(an AFS licensee\)/);
  assert.match(html, /id="inflation"[^>]*value="2\.5"/);
});

test('ads: never on the excluded pages, never between inputs and result, and no Auto ads from code', () => {
  for (const s of ['retirement', 'super', 'term-deposit', 'savings-goal', 'compound-interest']) assert.ok(ADS_EXCLUDE.includes(s), `${s} is ad-free`);
  for (const s of ADS_EXCLUDE) assert.ok(TOOLS.some((t) => t.slug === s), `ADS_EXCLUDE lists unknown tool ${s}`);
  const layout = read('js/layout.js');
  assert.match(layout, /!ADS_EXCLUDE\.includes\(tool\.slug\)\) content\.insertAdjacentHTML\('beforebegin', '<div class="ad-slot" hidden><\/div>'\)/);
  const ads = read('js/ads.js');
  assert.match(ads, /ADS_EXCLUDE\.includes\(page\)/);
  assert.match(ads, /closest\('form, \.readout, \.cols, \.result-actions'\)/);
  assert.doesNotMatch(ads.replace(/^\/\/.*$/gm, ''), /enable_page_level_ads|autorelaxed|vignette|anchor/);
  for (const t of TOOLS) assert.doesNotMatch(read(`tools/${t.slug}.html`), /class="ad-slot"/, `${t.slug}: ad slots are added by layout.js only`);
  assert.match(read('css/style.css'), /\.ad-slot::before \{[^}]*border-top/, 'a rule separates the ad slot from the result actions above it');
});

test('coffee note: only when BMC_URL is set, shown only after an input changes, no mention of ads', () => {
  // The note and every coffee link follow the setting: off while BMC_URL is blank, on once it's a valid page.
  assert.equal(HAS_BMC, /^https:\/\/(www\.)?buymeacoffee\.com\/[\w-]+$/.test(BMC_URL));
  const layout = read('js/layout.js');
  const fn = layout.slice(layout.indexOf('export function addResultActions'), layout.indexOf('// Smooth page changes.'));
  assert.match(fn, /if \(HAS_BMC && form\)/);
  assert.match(fn, /if \(!e\.isTrusted\) return;/);
  assert.match(fn, /form\.addEventListener\('input', show\)/);
  assert.ok(fn.includes('Saved you a spreadsheet? <a href="${BMC_URL}" target="_blank" rel="noopener noreferrer">Buy me a coffee</a>. It keeps the rates checked.'));
  assert.doesNotMatch(fn, /\bads?\b|advert/i);
  assert.match(fn, /Print or save as PDF/);
});

test('affiliates: off by default, non-financial categories only, disclosed and marked sponsored', () => {
  assert.equal(AFFILIATES_ENABLED, false);
  assert.deepEqual(AFFILIATES, []);
  const book = { name: 'A money book', url: 'https://example.com/ref', category: 'books', blurb: 'Budgeting basics.' };
  const card = { name: 'Rewards card', url: 'https://example.com/ref', category: 'credit-cards' };
  const sneaky = { name: 'Share trading app', url: 'https://example.com/ref', category: 'budgeting-app' };
  assert.deepEqual(affiliateProblems(book), []);
  assert.ok(affiliateProblems(card).some((p) => /isn't one of the non-financial categories/.test(p)));
  assert.ok(affiliateProblems(sneaky).some((p) => /financial or credit product/.test(p)));
  assert.ok(affiliateProblems({ ...book, url: 'javascript:alert(1)' }).length);
  assert.deepEqual(affiliatesFor('budget', [book]), [], 'nothing while AFFILIATES_ENABLED is false');
  assert.deepEqual(affiliatesFor('budget', [book, card], true), [book]);
  assert.deepEqual(affiliatesFor('mortgage', [book], true), [], 'default pages only');
  assert.deepEqual(AFFILIATE_DEFAULT_PAGES, ['budget', 'savings-goal', 'gst', 'work-deductions']);
  assert.deepEqual(affiliatesFor('mortgage', [{ ...book, pages: ['mortgage'] }], true).length, 1);
  const html = affiliateCardHtml([book]);
  assert.ok(html.indexOf(AFFILIATE_DISCLOSURE.replace(/'/g, "'")) < html.indexOf('<ul>'), 'disclosure directly above the links');
  assert.match(html, /rel="sponsored nofollow noopener"/);
  assert.equal(affiliateCardHtml([]), '');
  assert.match(read('css/style.css'), /\.affiliates-disclosure \{ font-size: var\(--t-base\)/);
});

test('privacy page mentions affiliate links only while they are on', () => {
  assert.match(read('privacy.html'), /<li id="affiliate-line" hidden>/);
  assert.match(read('js/pages/privacy.js'), /if \(aff && AFFILIATES_ENABLED && AFFILIATES\.some/);
});

test('terms of use: not advice, no reliance, rates-checked date, embedding, Australian Consumer Law, governing law', () => {
  const html = read('terms.html');
  for (const s of ["isn't financial product advice, tax advice, credit assistance or legal advice", "aren't intended to be relied on",
    'date its rates were last checked', 'Calculator by Dinkum Calc', 'specific financial or credit product', 'Australian Consumer Law',
    'governed by the laws of New South Wales', 'id="contact-line" hidden']) assert.ok(html.includes(s), `terms.html should say ${s}`);
  assert.match(html, /data-module="js\/pages\/privacy\.js"/);
});

test('about page: support section with the coffee link only once BMC_URL is set', () => {
  const html = read('about.html');
  assert.match(html, /<h2 id="support">Support the site<\/h2>/);
  assert.match(html, /<li id="bmc-line" hidden>/);
  assert.match(html, /TODO \(site owner\): if you want to, add your name/);
});

test('launch-check lists what the owner must set, with the file and line', async () => {
  const cfg = await import('../js/config.js');
  // With a publisher ID set but ads not yet cleared to run, the check lists blockers and exits 1; read its output either way.
  let out;
  try { out = execFileSync('node', ['scripts/launch-check.mjs'], { encoding: 'utf8' }); }
  catch (e) { assert.ok(cfg.ADSENSE_CLIENT, 'launch-check only fails on ad blockers'); out = e.stdout + e.stderr; }
  // A setting drops off the to-do list once the owner fills it in, so only expect the ones still blank.
  const expected = [/Owner name and ABN: .* about\.html:\d+/,
    /CONSENT_CONFIRMED.* at js\/config\.js:\d+/];
  if (!cfg.ADSENSE_CLIENT) expected.push(/ADSENSE_CLIENT at js\/config\.js:\d+/, /ads-txt/);
  else expected.push(/ADSENSE_SLOT at js\/config\.js:\d+/);
  if (!cfg.SITE_URL) expected.push(/SITE_URL: .* js\/config\.js:\d+/);
  if (!cfg.CONTACT_EMAIL) expected.push(/CONTACT_EMAIL: .* js\/config\.js:\d+/);
  if (!cfg.BMC_URL) expected.push(/BMC_URL: .* js\/config\.js:\d+/);
  for (const re of expected) assert.match(out, re);
});

test('print: every result panel gets a Print or save as PDF button, and the print stylesheet hides the extras', () => {
  const css = read('css/style.css');
  const print = css.slice(css.indexOf('@media print'));
  for (const sel of ['.site-header', '.site-footer', '.ad-slot', '.bmc', '.mini-result', '#theme-toggle', '.result-actions', 'main form.card']) assert.ok(print.includes(sel), `print hides ${sel}`);
  assert.match(print, /\.print-only \{ display: block; \}/);
  const layout = read('js/layout.js');
  assert.match(layout, /addEventListener\('beforeprint', fillPrintSummary\)/);
  assert.match(layout, /Made with \$\{SITE_NAME\} \(free\)/);
  assert.match(layout, /Rates checked \$\{RATES_CHECKED\}/);
  assert.match(layout, /Open these results again: \$\{shareUrl\(\)\}/);
});

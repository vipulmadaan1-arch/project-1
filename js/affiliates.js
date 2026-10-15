// The "Tools I use" affiliate card (off by default: AFFILIATES_ENABLED in js/config.js). Builds HTML strings and
// touches no DOM, so npm run launch-check and the tests can run it in Node; js/layout.js puts the card on the page.
import { AFFILIATES_ENABLED, AFFILIATES } from './config.js';

// The only kinds of product an affiliate link may be for. None is a financial product (Corporations Act s 763A)
// or a credit product, so a link never promotes one beside a calculator (ASIC Corporations (Generic Calculators)
// Instrument 2026/41 s 8(1)(a)). Add a category here only if it is clearly neither.
export const AFFILIATE_CATEGORIES = ['books', 'budgeting-app', 'accounting-software', 'spreadsheet-templates', 'stationery', 'courses'];
// Pages that show the card when an item doesn't list its own: everyday money and tax tools, never a projection
// that compares financial products.
export const AFFILIATE_DEFAULT_PAGES = ['budget', 'savings-goal', 'gst', 'work-deductions'];
export const AFFILIATE_DISCLOSURE = "Affiliate links: if you sign up or buy through these, the site may earn a commission at no extra cost to you. They don't change any calculator result, and none of them is a financial product.";

// Words that mark a financial or credit product, refused even under an allowed category.
const FINANCIAL = /\b(bank(ing)?|credit|loans?|lend(er|ing)?|mortgages?|brokers?|brokerage|insur\w*|super(annuation)?\b|invest\w*|shares?\b|etfs?\b|trading|crypto\w*|bitcoin|forex|cfds?\b|afterpay|bnpl|pay later|term deposits?|savings accounts?)/i;

// Problems with one item, as sentences (empty when it's fine).
export function affiliateProblems(item, slugs = null) {
  const out = [];
  const name = item?.name || '(no name)';
  if (!item || typeof item.name !== 'string' || !item.name.trim()) out.push('needs a name');
  if (typeof item?.url !== 'string' || !/^https:\/\/[^\s"'<>`]+$/.test(item.url)) out.push('needs a plain https:// link');
  if (!AFFILIATE_CATEGORIES.includes(item?.category)) out.push(`category "${item?.category}" isn't one of the non-financial categories (${AFFILIATE_CATEGORIES.join(', ')})`);
  if (FINANCIAL.test(`${item?.name} ${item?.blurb || ''}`)) out.push('looks like a financial or credit product (bank, card, loan, insurance, super, investing or crypto)');
  if (item?.pages !== undefined && (!Array.isArray(item.pages) || (slugs && item.pages.some((p) => !slugs.includes(p))))) out.push('pages must be a list of tool slugs');
  return out.map((p) => `${name}: ${p}`);
}

// Items that pass every check and are set to show on this page.
export function affiliatesFor(slug, list = AFFILIATES, enabled = AFFILIATES_ENABLED) {
  if (!enabled || !Array.isArray(list)) return [];
  return list.filter((i) => !affiliateProblems(i).length && (i.pages || AFFILIATE_DEFAULT_PAGES).includes(slug));
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export function affiliateCardHtml(items) {
  if (!items.length) return '';
  return `<aside class="affiliates" aria-labelledby="affiliates-title">
  <h2 id="affiliates-title">Tools I use</h2>
  <p class="affiliates-disclosure">${esc(AFFILIATE_DISCLOSURE)}</p>
  <ul>${items.map((i) => `<li><a href="${esc(i.url)}" target="_blank" rel="sponsored nofollow noopener">${esc(i.name)}</a>${i.blurb ? ` <span>${esc(i.blurb)}</span>` : ''}</li>`).join('')}</ul>
</aside>`;
}

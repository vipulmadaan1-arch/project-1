// The brand mark and the site footer, as HTML strings. scripts/seo.mjs writes the footer into every page's HTML
// (between <!-- footer:start --> and <!-- footer:end -->) so crawlers and visitors without JavaScript get the tool
// links, About, Privacy and the general-information notice; js/layout.js reuses that footer and only builds one
// from this module when a page doesn't have it. Imports nothing that touches the DOM, so Node can run it too.
import { SITE_NAME, BMC_URL } from './config.js';
import { TOOLS, CATEGORIES, RATES_CHECKED } from './tools.js';

// Hide all coffee links until a real Buy Me a Coffee handle is set in config.js.
// It must be a plain https:// link, so a typo can't put a javascript: link in the page.
export const HAS_BMC = !BMC_URL.includes('YOUR_HANDLE') && /^https:\/\/[^\s"'<>`]+$/.test(BMC_URL);

// Brand mark: a tick in a rounded square, i.e. "sorted".
const MARK = `<svg class="brand-mark" viewBox="0 0 26 26" aria-hidden="true" focusable="false">
  <rect x="1" y="1" width="24" height="24" rx="7" fill="var(--readout)"/>
  <path d="M7.5 13.5l3.6 3.6 7.4-8.2" fill="none" stroke="var(--readout-accent)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
const wordmark = SITE_NAME.replace(',', '<span class="brand-comma">,</span>');
export const brandHtml = (base) => `<a class="brand" href="${base}" aria-label="${SITE_NAME} home">${MARK}<span>${wordmark}</span></a>`;

// base: the path from the page to the site root ("../" on tool pages, "./" elsewhere).
export const footerHtml = (base) => `<footer class="site-footer">
  <div class="wrap">
    <div class="footer-about">
      ${brandHtml(base)}
      <p>Free calculators for Australian money questions, plus everyday tools. Calculations run in your browser: the calculators never send your figures anywhere.</p>
      <span class="stamp">Rates checked ${RATES_CHECKED}</span>
    </div>${CATEGORIES.map((c) => `
    <div>
      <p class="foot-head">${c.short}</p>
      <ul>${TOOLS.filter((t) => t.cat === c.key).map((t) => `<li><a href="${base}tools/${t.slug}.html">${t.name}</a></li>`).join('')}</ul>
    </div>`).join('')}
    <div class="footer-legal">
      <span>Financial results are general estimates, not financial, tax or legal advice. Confirm figures with the ATO, your state revenue office or a licensed adviser.</span>
      <span class="footer-links"><a href="${base}about.html">About</a><a href="${base}privacy.html">Privacy</a>${HAS_BMC ? `<a href="${BMC_URL}" target="_blank" rel="noopener noreferrer">Support the site</a>` : ''}</span>
    </div>
  </div>
</footer>`;

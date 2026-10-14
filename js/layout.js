// Injects the shared header and footer, and handles the theme toggle.
import { SITE_NAME, BMC_URL } from './config.js';
import { TOOLS, CATEGORIES, RATES_CHECKED } from './tools.js';
import { icon } from './icons.js';
import { mountAds } from './ads.js';

// Hide all coffee links until a real Buy Me a Coffee handle is set in config.js.
const HAS_BMC = !BMC_URL.includes('YOUR_HANDLE');

const root = document.documentElement;
const base = root.dataset.base || './';

function safeGet(k) { try { return localStorage.getItem(k); } catch { return null; } }
function safeSet(k, v) { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } }

const savedTheme = safeGet('theme');
if (savedTheme) root.dataset.theme = savedTheme;

// Browser UI colour. The page's <meta name="theme-color"> tags follow the system light/dark setting;
// when the visitor picks a theme with the toggle, point both tags at that theme's colour instead.
const THEME_COLOR = { light: '#0f2d29', dark: '#0c1312' };
function syncThemeColor() {
  const t = root.dataset.theme;
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
    m.content = THEME_COLOR[t] || THEME_COLOR[m.media.includes('dark') ? 'dark' : 'light'];
  });
}
syncThemeColor();

// Brand mark: a tick in a rounded square, i.e. "sorted".
const MARK = `<svg class="brand-mark" viewBox="0 0 26 26" aria-hidden="true" focusable="false">
  <rect x="1" y="1" width="24" height="24" rx="7" fill="var(--readout)"/>
  <path d="M7.5 13.5l3.6 3.6 7.4-8.2" fill="none" stroke="var(--readout-accent)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
const wordmark = SITE_NAME.replace(',', '<span class="brand-comma">,</span>');
const brand = `<a class="brand" href="${base}" aria-label="${SITE_NAME} home">${MARK}<span>${wordmark}</span></a>`;

const header = document.createElement('header');
header.className = 'site-header';
header.innerHTML = `
  <div class="wrap">
    ${brand}
    <nav class="nav" aria-label="Sections">
      ${CATEGORIES.map((c) => `<a href="${base}#${c.key}">${c.key === 'au' ? 'Australian' : 'General'}</a>`).join('')}
    </nav>
    <button class="icon-btn" id="theme-toggle" type="button" aria-label="Switch light or dark theme" title="Switch theme">
      <span class="theme-light-only">${icon('moon')}</span><span class="theme-dark-only">${icon('sun')}</span>
    </button>
    ${HAS_BMC ? `<a class="bmc" href="${BMC_URL}" target="_blank" rel="noopener">${icon('coffee')}<span>Buy me a coffee</span></a>` : ''}
  </div>`;
document.body.prepend(header);

const footer = document.createElement('footer');
footer.className = 'site-footer';
footer.innerHTML = `
  <div class="wrap">
    <div class="footer-about">
      ${brand}
      <p>Free calculators for Australian money questions, plus everyday tools. Calculations run in your browser, so the figures you enter are never sent to a server.</p>
      <span class="stamp">Rates checked ${RATES_CHECKED}</span>
    </div>
    ${CATEGORIES.map((c) => `
    <div>
      <h2>${c.key === 'au' ? 'Australian' : 'General'}</h2>
      <ul>${TOOLS.filter((t) => t.cat === c.key).map((t) => `<li><a href="${base}tools/${t.slug}.html">${t.name}</a></li>`).join('')}</ul>
    </div>`).join('')}
    <div class="footer-legal">
      <span>Financial results are general estimates, not financial, tax or legal advice. Confirm figures with the ATO, Revenue NSW or a licensed adviser.</span>
      <span class="footer-links"><a href="${base}privacy.html">Privacy</a>${HAS_BMC ? `<a href="${BMC_URL}" target="_blank" rel="noopener">Support the site</a>` : ''}</span>
    </div>
  </div>`;
document.body.append(footer);

// Tool pages: add the tool's icon and source label to the page heading.
const slug = location.pathname.match(/tools\/([^/]+)\.html$/)?.[1];
const tool = TOOLS.find((t) => t.slug === slug);
const head = document.querySelector('.tool-head');
if (tool && head) {
  head.insertAdjacentHTML('afterbegin', `<div class="ico">${icon(tool.slug)}</div><span class="tag">${tool.meta}</span>`);
}

document.getElementById('theme-toggle').addEventListener('click', () => {
  const isDark = root.dataset.theme
    ? root.dataset.theme === 'dark'
    : matchMedia('(prefers-color-scheme: dark)').matches;
  root.dataset.theme = isDark ? 'light' : 'dark';
  safeSet('theme', root.dataset.theme);
  syncThemeColor();
});

export { safeGet, safeSet };

export const fmtMoney = (n, dp = 0) =>
  n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: dp, maximumFractionDigits: dp });
export const num = (el) => parseFloat(String(el.value).replace(/[,$\s]/g, '')) || 0;

// Shared results links carry a calculator's inputs in the page address (?field=value).
// The figures are read once on load, then removed from the address, so they don't stay
// visible to anything else on the page (such as ad scripts) while you use the tool.
// They are only put back into a link when you choose "Copy link".
let sharedForm = null;

function formParams(form) {
  const p = new URLSearchParams();
  for (const el of form.querySelectorAll('input[id], select[id]')) {
    p.set(el.id, el.type === 'checkbox' ? (el.checked ? '1' : '0') : el.value);
  }
  return p;
}

export function syncFormWithUrl(form, onChange) {
  sharedForm = form;
  const params = new URLSearchParams(location.search);
  let restored = false;
  for (const el of form.querySelectorAll('input[id], select[id]')) {
    if (!params.has(el.id)) continue;
    if (el.type === 'checkbox') el.checked = params.get(el.id) === '1';
    else el.value = params.get(el.id);
    restored = true;
  }
  if (restored) onChange();
  if (location.search) history.replaceState(null, '', location.pathname + location.hash);
}

// Adds "Copy link" and a gentle coffee prompt under a result card.
export function addResultActions(card) {
  const wrap = document.createElement('div');
  wrap.className = 'result-actions';
  wrap.innerHTML = `
    <button class="btn" type="button">${icon('link')}<span>Copy link to these results</span></button>
    ${HAS_BMC ? `<p class="nudge">${icon('coffee')}<span>Saved you some time? <a href="${BMC_URL}" target="_blank" rel="noopener">Buy me a coffee</a></span></p>` : ''}`;
  const btn = wrap.querySelector('button');
  const idle = btn.innerHTML;
  btn.addEventListener('click', async () => {
    const url = `${location.origin}${location.pathname}${sharedForm ? `?${formParams(sharedForm)}` : ''}`;
    try { await navigator.clipboard.writeText(url); btn.innerHTML = `${icon('check')}<span>Link copied</span>`; }
    catch { prompt('Copy this link:', url); }
    setTimeout(() => { btn.innerHTML = idle; }, 2000);
  });
  card.append(wrap);
}

// Register after the page has loaded, so caching the site for offline use doesn't compete with this
// page's own requests on a first visit.
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  const register = () => navigator.serviceWorker.register(`${base}sw.js`).catch(() => { /* offline support unavailable */ });
  if (document.readyState === 'complete') register();
  else addEventListener('load', register, { once: true });
}

// Ad placeholder after each tool, before the explainer. Stays hidden unless ads are enabled.
const content = document.querySelector('main .content');
if (tool && content) content.insertAdjacentHTML('beforebegin', '<div class="ad-slot" hidden></div>');
mountAds();

// Related-tool links get their tool's icon.
document.querySelectorAll('.related a').forEach((a) => {
  const s = a.getAttribute('href')?.replace(/\.html$/, '');
  if (s) a.insertAdjacentHTML('afterbegin', icon(s));
});

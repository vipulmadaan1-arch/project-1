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
    <button class="icon-btn" id="theme-toggle" type="button" aria-label="Dark theme" aria-pressed="false" title="Switch theme">
      <span class="theme-light-only">${icon('moon')}</span><span class="theme-dark-only">${icon('sun')}</span>
    </button>
    ${HAS_BMC ? `<a class="bmc" href="${BMC_URL}" target="_blank" rel="noopener">${icon('coffee')}<span>Buy me a coffee</span></a>` : ''}
  </div>`;
document.body.prepend(header);

// Skip link: the first thing a keyboard user reaches, jumping past the header to the tool.
const main = document.querySelector('main');
if (main) {
  main.id ||= 'main';
  main.tabIndex = -1;
  header.insertAdjacentHTML('beforebegin', `<a class="skip-link" href="#${main.id}">Skip to content</a>`);
}

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

// The toggle is a "Dark theme" on/off button, so screen readers hear its current state.
const darkQuery = matchMedia('(prefers-color-scheme: dark)');
const themeBtn = document.getElementById('theme-toggle');
const isDark = () => (root.dataset.theme ? root.dataset.theme === 'dark' : darkQuery.matches);
const syncThemeBtn = () => themeBtn.setAttribute('aria-pressed', String(isDark()));
syncThemeBtn();
darkQuery.addEventListener('change', syncThemeBtn);
themeBtn.addEventListener('click', () => {
  root.dataset.theme = isDark() ? 'light' : 'dark';
  safeSet('theme', root.dataset.theme);
  syncThemeBtn();
});

// One polite status region for the whole page. Results are read out once typing pauses,
// with their label ("Total duty payable: $29,452"), instead of on every keystroke.
const status = document.createElement('div');
status.className = 'sr-only';
status.setAttribute('role', 'status');
document.body.append(status);
let announceTimer = 0;
export function announce(msg, delay = 0) {
  clearTimeout(announceTimer);
  announceTimer = setTimeout(() => {
    status.textContent = '';
    setTimeout(() => { status.textContent = msg; }, 50);
  }, delay);
}

let userActed = false;
for (const type of ['input', 'change', 'click']) document.addEventListener(type, () => { userActed = true; }, true);
const resultLabel = (el) => {
  const prev = el.previousElementSibling;
  if (prev && !prev.classList.contains('cols')) return prev.textContent.trim();
  return el.closest('.card')?.querySelector('h2')?.textContent.trim() || '';
};
const results = [...document.querySelectorAll('.result-big')];
const lastText = new Map();
const changed = new Set();
const watch = new MutationObserver((records) => {
  for (const r of records) {
    const el = results.find((x) => x.contains(r.target));
    const text = el?.textContent.trim();
    if (!el || text === lastText.get(el)) continue;
    lastText.set(el, text);
    if (userActed && text !== '–') changed.add(el); // values filled in on page load aren't news
  }
  if (!changed.size) return;
  announce([...changed].map((el) => `${resultLabel(el)}: ${el.textContent.trim()}`).join('. '), 900);
  clearTimeout(watch.timer);
  watch.timer = setTimeout(() => changed.clear(), 900);
});
results.forEach((el) => { lastText.set(el, el.textContent.trim()); watch.observe(el, { childList: true, characterData: true, subtree: true }); });

// Single-key shortcuts only fire when nothing else has focus, or focus is inside the tool
// they belong to (WCAG 2.1.4), and never with Ctrl, Alt or Cmd so browser zoom keeps working.
export function shortcutAllowed(e, scope) {
  if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return false;
  const a = document.activeElement;
  return !a || a === document.body || a === main || !!scope?.contains(a);
}

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
    try { await navigator.clipboard.writeText(url); btn.innerHTML = `${icon('check')}<span>Link copied</span>`; announce('Link copied'); }
    catch { prompt('Copy this link:', url); }
    setTimeout(() => { btn.innerHTML = idle; }, 2000);
  });
  card.append(wrap);
}

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register(`${base}sw.js`).catch(() => { /* offline support unavailable */ });
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

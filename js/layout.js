// Injects the shared header and footer, and handles the theme toggle.
import { SITE_NAME, BMC_URL } from './config.js';
import { TOOLS, CATEGORIES, RATES_CHECKED } from './tools.js';
import { icon } from './icons.js';
import { mountAds } from './ads.js';

// Hide all coffee links until a real Buy Me a Coffee handle is set in config.js.
// It must be a plain https:// link, so a typo can't put a javascript: link in the page.
const HAS_BMC = !BMC_URL.includes('YOUR_HANDLE') && /^https:\/\/[^\s"'<>`]+$/.test(BMC_URL);

const root = document.documentElement;
const base = root.dataset.base || './';

function safeGet(k) { try { return localStorage.getItem(k); } catch { return null; } }
function safeSet(k, v) { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } }

const savedTheme = safeGet('theme');
if (savedTheme === 'light' || savedTheme === 'dark') root.dataset.theme = savedTheme;

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
      ${CATEGORIES.map((c) => `<a href="${base}#${c.key}">${c.short}</a>`).join('')}
    </nav>
    <button class="icon-btn" id="theme-toggle" type="button" aria-label="Dark theme" aria-pressed="false" title="Switch theme">
      <span class="theme-light-only">${icon('moon')}</span><span class="theme-dark-only">${icon('sun')}</span>
    </button>
    ${HAS_BMC ? `<a class="bmc" href="${BMC_URL}" target="_blank" rel="noopener noreferrer">${icon('coffee')}<span>Buy me a coffee</span></a>` : ''}
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
      <h2>${c.short}</h2>
      <ul>${TOOLS.filter((t) => t.cat === c.key).map((t) => `<li><a href="${base}tools/${t.slug}.html">${t.name}</a></li>`).join('')}</ul>
    </div>`).join('')}
    <div class="footer-legal">
      <span>Financial results are general estimates, not financial, tax or legal advice. Confirm figures with the ATO, your state revenue office or a licensed adviser.</span>
      <span class="footer-links"><a href="${base}privacy.html">Privacy</a>${HAS_BMC ? `<a href="${BMC_URL}" target="_blank" rel="noopener noreferrer">Support the site</a>` : ''}</span>
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
  syncThemeColor();
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

// Money for display. Shows "–" rather than NaN, avoids "-$0", and switches very large
// figures to scientific notation so they don't run off a phone screen.
export const fmtMoney = (n, dp = 0) => {
  if (!Number.isFinite(n)) return '–';
  if (Math.abs(n) >= 1e15) return n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', notation: 'scientific', maximumFractionDigits: 2 });
  const v = Math.abs(n) < 0.5 / 10 ** dp ? 0 : n;
  return v.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: dp, maximumFractionDigits: dp });
};

// ---------- Number fields ----------
// Number fields are text inputs with inputmode="decimal" rather than type="number"
// (the GOV.UK Design System advises against type="number"), so people can type or paste
// "$750,000", "6.5%" or "1 000". Returns null when empty and NaN when it isn't a number.
export function parseNumber(value) {
  const s = String(value ?? '').trim().replace(/^A(UD)?(?=\$)/i, '').replace(/[\s,$%]/g, '').replace(/^\u2212/, '-');
  if (s === '') return null;
  return /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s) ? parseFloat(s) : NaN;
}
export const num = (el) => { const n = parseNumber(el.value); return Number.isFinite(n) ? n : 0; };

const UNIT_FMT = {
  money: (n) => fmtMoney(n),
  percent: (n) => `${n.toLocaleString('en-AU')}%`,
  years: (n) => `${n.toLocaleString('en-AU')} year${n === 1 ? '' : 's'}`,
  weeks: (n) => `${n.toLocaleString('en-AU')} week${n === 1 ? '' : 's'}`,
  days: (n) => n.toLocaleString('en-AU'),
  plain: (n) => n.toLocaleString('en-AU'),
};

// Shows or clears the error message for a field, linked with aria-describedby.
export function setError(el, msg) {
  const id = `${el.id}-error`;
  let p = document.getElementById(id);
  const ids = (el.getAttribute('aria-describedby') || '').split(' ').filter((x) => x && x !== id);
  if (!msg) {
    if (p) p.hidden = true;
    el.removeAttribute('aria-invalid');
    if (ids.length) el.setAttribute('aria-describedby', ids.join(' ')); else el.removeAttribute('aria-describedby');
    return;
  }
  if (!p) {
    p = document.createElement('p');
    p.className = 'field-error';
    p.id = id;
    (el.closest('.field') ? el : el.closest('label') || el).before(p);
  }
  p.innerHTML = '<span class="visually-hidden">Error: </span>';
  p.append(msg);
  p.hidden = false;
  el.setAttribute('aria-invalid', 'true');
  el.setAttribute('aria-describedby', [id, ...ids].join(' '));
}

// Reads and checks a number field. Returns the number, or null when it can't be used
// (and shows an error that says what's wrong and how to fix it).
// opts: name ("Loan amount"), unit (money, percent, years, weeks, days, plain), min, max,
// above (must be more than), optional (empty counts as 0), whole (whole numbers only), example,
// enter (message for an empty field).
export function readNumber(el, { name, unit = 'plain', min, max, above, optional = false, whole = false, example, enter } = {}) {
  const n = parseNumber(el.value);
  const f = UNIT_FMT[unit];
  const lower = name[0].toLowerCase() + name.slice(1);
  let msg = '';
  let quiet = false; // empty fields are only flagged once you've left them, not while you retype
  if (n === null) {
    if (optional) { setError(el, ''); return 0; }
    msg = enter || `Enter the ${lower}`;
    quiet = !el.dataset.touched || document.activeElement === el;
  } else if (Number.isNaN(n)) {
    msg = `${name} must be a number, like ${example ?? (unit === 'money' ? '750,000' : '5')}`;
  } else if (whole && !Number.isInteger(n)) {
    msg = `${name} must be a whole number`;
  } else if ((min !== undefined && n < min) || (max !== undefined && n > max) || (above !== undefined && n <= above)) {
    const lo = above !== undefined ? above : min;
    // A short range reads best as "between"; for money, "$0 or more" is clearer than "between $0 and $1 trillion".
    if (lo !== undefined && max !== undefined && above === undefined && unit !== 'money') msg = `${name} must be between ${unit === 'years' || unit === 'weeks' ? lo.toLocaleString('en-AU') : f(lo)} and ${f(max)}`;
    else if (above !== undefined && n <= above) msg = `${name} must be more than ${f(above)}`;
    else if (min !== undefined && n < min) msg = `${name} must be ${f(min)} or more`;
    else msg = `${name} must be ${f(max)} or less`;
  }
  setError(el, quiet ? '' : msg);
  return msg ? null : n;
}

// Puts thousands separators back into money fields (when you leave the field, and on load).
export function formatMoneyFields(form) {
  for (const el of form.querySelectorAll('input[data-money]')) {
    const n = parseNumber(el.value);
    if (Number.isFinite(n) && n >= 0 && n < 1e15) el.value = n.toLocaleString('en-AU', { maximumFractionDigits: 2 });
  }
}

// Recalculates on every change, re-checks a field when you leave it, and stops Enter
// from reloading the page.
export function wireForm(form, update) {
  formatMoneyFields(form);
  form.addEventListener('input', update);
  form.addEventListener('submit', (e) => e.preventDefault());
  form.addEventListener('focusout', (e) => {
    const el = e.target;
    if (!el.matches?.('input.num')) return;
    el.dataset.touched = '1';
    if (el.matches('[data-money]') && el.getAttribute('aria-invalid') !== 'true') formatMoneyFields({ querySelectorAll: () => [el] });
    update();
  });
  update();
}

// Sets several outputs to the same placeholder.
export const blank = (...els) => els.forEach((el) => { el.textContent = '–'; });

// Shared results links carry a calculator's inputs after the # in the page address
// (#field=value). Browsers never send that part of an address to a server, so the figures
// don't reach the web host or its logs. They are read once on load, then removed from the
// address, so they don't stay visible to anything else on the page (such as ad scripts)
// while you use the tool. They are only put back into a link when you choose "Copy link".
// Older links that used ?field=value still open.
let sharedForm = null;
let sharedOnChange = null;

function formParams(form) {
  const p = new URLSearchParams();
  for (const el of form.querySelectorAll('input[id], select[id]')) {
    p.set(el.id, el.type === 'checkbox' ? (el.checked ? '1' : '0') : el.value);
  }
  return p;
}

// Puts one value from a link into a form field, only if it suits that field.
// Returns true if the field was changed.
function applyParam(el, v) {
  if (v.length > 40) return false;
  if (el.type === 'checkbox') {
    if (v !== '0' && v !== '1') return false;
    el.checked = v === '1';
    return true;
  }
  if (el.tagName === 'SELECT') {
    if (![...el.options].some((o) => o.value === v)) return false;
    el.value = v;
    return true;
  }
  if (el.classList.contains('num')) {
    // Number fields accept "$750,000" etc.; the page's own validation reports out-of-range values.
    if (!v.trim() || !Number.isFinite(parseNumber(v))) return false;
    el.value = v;
    return true;
  }
  if (el.type === 'number') {
    let n = Number(v);
    if (!v.trim() || !Number.isFinite(n)) return false;
    if (el.min !== '' && n < +el.min) n = +el.min;
    if (el.max !== '' && n > +el.max) n = +el.max;
    el.value = String(n);
    return true;
  }
  el.value = v; // date fields: the browser clears anything that isn't a valid date
  return el.value === v;
}

function restoreFromUrl() {
  const fromHash = location.hash.includes('=');
  const params = new URLSearchParams(fromHash ? location.hash.slice(1) : location.search);
  let restored = false;
  for (const el of sharedForm.querySelectorAll('input[id], select[id]')) {
    if (params.has(el.id) && applyParam(el, params.get(el.id))) restored = true;
  }
  if (restored) sharedOnChange();
  if (location.search || fromHash) history.replaceState(null, '', location.pathname + (fromHash ? '' : location.hash));
}

export function syncFormWithUrl(form, onChange) {
  sharedForm = form;
  sharedOnChange = () => { formatMoneyFields(form); onChange(); };
  restoreFromUrl();
  // Opening a results link for the page you're already on only changes the part after #.
  addEventListener('hashchange', () => { if (location.hash.includes('=')) restoreFromUrl(); });
}

// Adds "Copy link" and a gentle coffee prompt under a result card.
export function addResultActions(card) {
  const wrap = document.createElement('div');
  wrap.className = 'result-actions';
  wrap.innerHTML = `
    <button class="btn" type="button">${icon('link')}<span>Copy link to these results</span></button>
    ${HAS_BMC ? `<p class="nudge">${icon('coffee')}<span>Saved you some time? <a href="${BMC_URL}" target="_blank" rel="noopener noreferrer">Buy me a coffee</a></span></p>` : ''}`;
  const btn = wrap.querySelector('button');
  const idle = btn.innerHTML;
  btn.addEventListener('click', async () => {
    const url = `${location.origin}${location.pathname}${sharedForm ? `#${formParams(sharedForm)}` : ''}`;
    try { await navigator.clipboard.writeText(url); btn.innerHTML = `${icon('check')}<span>Link copied</span>`; announce('Link copied'); }
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

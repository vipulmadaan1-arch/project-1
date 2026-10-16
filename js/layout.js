// Injects the shared header, reuses (or adds) the shared footer, and handles the theme toggle.
import { BMC_URL, SITE_NAME, ADS_EXCLUDE } from './config.js';
import { TOOLS, CATEGORIES, RATES_CHECKED } from './tools.js';
import { HAS_BMC, brandHtml, footerHtml } from './site-footer.js';
import { icon } from './icons.js';
import { mountAds } from './ads.js';
import { mountAnalytics } from './analytics.js';
import { affiliatesFor, affiliateCardHtml } from './affiliates.js';
import { fmtMoney, parseNumber, checkNumber, moneyFieldText } from './format.js';
import { presentValue, PV_MIN_YEARS } from './present-value.js';
import { contactEmail, wrongFigureMail } from './contact.js';

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

const brand = brandHtml(base);
// A plain Home button on every page but the home page itself (the logo links home too, but not everyone knows).
const onHome = new URL(base, location.href).pathname === location.pathname.replace(/index\.html$/, '');

const header = document.createElement('header');
header.className = 'site-header';
header.innerHTML = `
  <div class="wrap">
    ${brand}
    ${onHome ? '' : `<a class="home-btn" href="${base}">${icon('home')}<span>Home</span></a>`}
    <nav class="nav" aria-label="Sections">
      ${CATEGORIES.map((c) => `<a href="${base}#${c.key}">${c.short}</a>`).join('')}
    </nav>
    <button class="icon-btn" id="theme-toggle" type="button" aria-label="Dark theme" aria-pressed="false" title="Switch theme">
      <span class="theme-light-only">${icon('moon')}</span><span class="theme-dark-only">${icon('sun')}</span>
    </button>
    ${HAS_BMC ? `<a class="bmc" href="${BMC_URL}" rel="noopener">${icon('coffee')}<span>Buy me a coffee</span></a>` : ''}
  </div>`;
document.body.prepend(header);

// Skip link: the first thing a keyboard user reaches, jumping past the header to the tool.
const main = document.querySelector('main');
if (main) {
  main.id ||= 'main';
  main.tabIndex = -1;
  header.insertAdjacentHTML('beforebegin', `<a class="skip-link" href="#${main.id}">Skip to content</a>`);
}

// The footer is in each page's HTML (written by scripts/seo.mjs, so crawlers and no-JS visitors see it); a page
// without one gets it here, with the same markup.
if (!document.querySelector('body > footer.site-footer')) document.body.insertAdjacentHTML('beforeend', footerHtml(base));


// Tool pages: add the tool's icon and source label to the page heading.
const slug = location.pathname.match(/tools\/([^/]+)\.html$/)?.[1];
const tool = TOOLS.find((t) => t.slug === slug);
// The first field with an error, and what to call it in a sentence: "Interest rate (% a year)" becomes
// "the interest rate", "Your age" stays "your age", and abbreviations such as "CO2 emissions" keep their capitals.
const lowerFirst = (t) => (/^[A-Z][a-z]/.test(t) ? t[0].toLowerCase() + t.slice(1) : t);
const invalidField = () => document.querySelector('form [aria-invalid="true"]');
function fieldName(el) {
  const name = lowerFirst((el.labels?.[0]?.textContent || el.getAttribute('aria-label') || 'highlighted field').replace(/\s*\([^)]*\)\s*$/, '').trim());
  return /^(your|my|the)\b/i.test(name) ? name : `the ${name}`;
}
const errorText = (el) => document.getElementById(`${el.id}-error`)?.textContent.replace(/^Error: /, '').trim() || '';

// Results panel: stop it sticking when it's taller than the window, and say which field needs fixing
// (otherwise the result is just a dash).
const readout = document.querySelector('.readout');
if (readout) {
  const fit = () => readout.classList.toggle('is-tall', readout.offsetHeight > innerHeight - 110);
  new ResizeObserver(fit).observe(readout);
  addEventListener('resize', fit);
  const big = readout.querySelector('.result-big');
  if (big) {
    const hint = document.createElement('p');
    hint.className = 'readout-hint';
    hint.hidden = true;
    big.after(hint);
    const check = () => {
      const bad = big.textContent.trim() === '–' && invalidField();
      hint.hidden = !bad;
      if (bad) hint.textContent = `Fix ${fieldName(bad)} to see your result.`;
    };
    new MutationObserver(check).observe(big, { childList: true, characterData: true, subtree: true });
    document.querySelector('form')?.addEventListener('focusout', () => setTimeout(check));
    miniResult(readout, big);
  }
}

// Phones: the results panel sits below the form, so while you fill the form in, a slim bar fixed to the
// bottom of the screen repeats the headline result ("Total cash needed $113,765"). Tapping it goes to
// the full results. It shows only while the panel is further down the page and there's a result, and
// it's a plain button: screen readers already hear results from the page's status region, so the bar
// adds nothing to announce.
function miniResult(panel, big) {
  const phone = matchMedia('(max-width: 820px)');
  const label = panel.querySelector('.readout-label') || panel.querySelector('h2');
  const bar = document.createElement('button');
  bar.type = 'button';
  bar.className = 'mini-result';
  bar.hidden = true;
  bar.innerHTML = `<span class="mini-result-label"></span> <span class="mini-result-value"></span><span class="visually-hidden">, go to results</span>${icon('arrow', { className: 'icon mini-result-go' })}`;
  document.body.append(bar);
  let below = false; // the panel is below the visible part of the page
  const sync = () => {
    const value = big.textContent.trim();
    bar.querySelector('.mini-result-label').textContent = label?.textContent.trim() || 'Result';
    bar.querySelector('.mini-result-value').textContent = value;
    const show = phone.matches && below && value !== '' && value !== '–';
    bar.hidden = !show;
    root.classList.toggle('has-mini-result', show);
  };
  new IntersectionObserver(([e]) => { below = !e.isIntersecting && e.boundingClientRect.top > 0; sync(); }).observe(panel);
  const watch = new MutationObserver(sync);
  watch.observe(big, { childList: true, characterData: true, subtree: true });
  if (label) watch.observe(label, { childList: true, characterData: true, subtree: true });
  phone.addEventListener('change', sync);
  bar.addEventListener('click', () => {
    const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    panel.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
    // Move focus too, so keyboard and screen reader users carry on from the results.
    panel.tabIndex = -1;
    panel.focus({ preventScroll: true });
  });
}

// "Next step" link at the foot of a results panel (<p class="next-step"> in the page, so its space is held
// from the first paint), to the tool you'd usually use next, opened with this result filled in through
// the #field=value link format that syncFormWithUrl reads. Without JavaScript it's a plain link.
// Returns set(params): call it after each update with the target page's field ids and values, or with
// null to hide the link while there's no result to carry over.
export function nextStep() {
  const a = document.querySelector('.readout .next-step a');
  if (!a) return () => {};
  const page = a.getAttribute('href').split('#')[0];
  return (params) => {
    a.parentElement.hidden = !params;
    if (params) a.href = `${page}#${new URLSearchParams(Object.entries(params).map(([k, v]) => [k, typeof v === 'boolean' ? (v ? '1' : '0') : String(v)]))}`;
  };
}
// Money tools get an "In Aussie terms" card comparing the result with familiar Australian yardsticks, in the
// space scripts/content.py leaves for it. Loaded on demand, so pages without a dollar result don't download it.
if (document.querySelector('.aus-slot')) import('./aussie.js').then((m) => m.mountAussieTerms()).catch(() => {});
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
// with their label ("Total duty payable: $29,452"), instead of on every keystroke. When a result
// can't be worked out because a field has an error, that's read out instead of a dash:
// "Can't work out total duty payable yet: Property value must be a number, like 750,000".
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
  if (prev && !prev.matches('.cols, fieldset')) return prev.textContent.trim();
  return el.closest('.card')?.querySelector('h2')?.textContent.trim() || '';
};
const results = [...document.querySelectorAll('.result-big')];
const lastText = new Map();
const changed = new Set();
// The message is put together when typing pauses, from what's on screen then, so a result that has
// since changed or gone back to a dash is never read out.
function resultsMessage() {
  const els = [...changed];
  changed.clear();
  const shown = els.filter((el) => el.textContent.trim() !== '–');
  if (shown.length) return shown.map((el) => `${resultLabel(el)}: ${el.textContent.trim()}`).join('. ');
  const bad = invalidField();
  const why = bad && errorText(bad);
  return why ? `Can't work out ${lowerFirst(resultLabel(els[0]))} yet: ${why}` : '';
}
const watch = new MutationObserver((records) => {
  for (const r of records) {
    const el = results.find((x) => x.contains(r.target));
    const text = el?.textContent.trim();
    if (!el || text === lastText.get(el)) continue;
    lastText.set(el, text);
    if (userActed) changed.add(el); // values filled in on page load aren't news
  }
  if (!changed.size) return;
  clearTimeout(watch.timer);
  watch.timer = setTimeout(() => { const msg = resultsMessage(); if (msg) announce(msg); }, 900);
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

export { fmtMoney, parseNumber } from './format.js';

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
// (and shows an error that says what's wrong and how to fix it). Options as for checkNumber in format.js.
export function readNumber(el, opts) {
  const { n, msg = '', empty } = checkNumber(el.value, opts);
  // Empty fields are only flagged once you've left them, not while you retype.
  const quiet = empty && (!el.dataset.touched || document.activeElement === el);
  setError(el, quiet ? '' : msg);
  return n;
}

// Puts thousands separators back into money fields (when you leave the field, and on load).
export function formatMoneyFields(form) {
  for (const el of form.querySelectorAll('input[data-money]')) {
    const text = moneyFieldText(el.value);
    if (text !== null) el.value = text;
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

// Readouts that list the parts of a total (chains of [parts, total], with amounts taken off as negatives):
// whole dollars from $1,000 up, cents below that (a registration fee, say), as long as the rounded figures
// still add up to the total shown. If they wouldn't, every figure keeps its cents, so the sum on screen
// is never out by a dollar. Returns the formatter to use for all of them.
export function partsFormat(...chains) {
  const cents = (n) => !Number.isInteger(Math.round(n * 100) / 100);
  const dp = (n) => (Math.abs(n) >= 1000 || !cents(n) ? 0 : 2);
  const shown = (n) => Math.sign(n) * Math.round(Math.abs(n) * 10 ** dp(n)) / 10 ** dp(n);
  const adds = chains.every(([parts, total]) => Math.abs(parts.reduce((s, n) => s + shown(n), 0) - shown(total)) < 0.005);
  return (n) => fmtMoney(n, adds ? dp(n) : cents(n) ? 2 : 0);
}

// Switches a control on or off, and when it's off says why in a hint tied to it with aria-describedby
// (a greyed-out box with no reason given is a dead end). why: the reason, shown only while it's off.
export function setEnabled(el, on, why) {
  el.disabled = !on;
  const id = `${el.id}-off`;
  let hint = document.getElementById(id);
  if (!hint) {
    hint = document.createElement('small');
    hint.id = id;
    const check = el.closest('label.check');
    if (check) { hint.className = 'hint'; check.after(hint); } else el.closest('.field').append(hint);
  }
  hint.textContent = on ? '' : why;
  hint.hidden = on;
  const ids = (el.getAttribute('aria-describedby') || '').split(' ').filter((x) => x && x !== id);
  if (!on) ids.unshift(id);
  if (ids.length) el.setAttribute('aria-describedby', ids.join(' ')); else el.removeAttribute('aria-describedby');
}

// "In today's dollars" row for calculators about a financial product (ASIC Corporations (Generic Calculators)
// Instrument 2026/41 s 8(1)(e)(iv): the present value of an estimate payable 2 or more years ahead; the formula and
// the 2.5% default are in s 6, see presentValue in calc.js). Reads the page's #cpi field (editable inflation rate)
// and fills #pv, with its label in #pv-label. Shown only for amounts 2 or more years away (the row is hidden
// otherwise), unless always is set. amount: the future-dollar figure, or null to blank it.
export function todaysDollars(amount, years, { label = "In today's dollars", always = false, format = (n) => fmtMoney(n) } = {}) {
  const row = document.getElementById('pv-row');
  const cpi = readInflation();
  const show = amount !== null && Number.isFinite(years) && (always || years >= PV_MIN_YEARS);
  if (row) row.hidden = !show && !always;
  const pv = show && cpi !== null ? presentValue(amount, years, cpi) : null;
  document.getElementById('pv-label').textContent = cpi === null ? label : `${label} (${cpi.toLocaleString('en-AU', { maximumFractionDigits: 2 })}% inflation)`;
  document.getElementById('pv').textContent = pv === null ? '–' : format(pv);
  return pv;
}

// The inflation rate typed into the page's #cpi field (null, with an error shown, when it can't be used).
export const readInflation = () => readNumber(document.getElementById('cpi'), { name: 'Inflation', unit: 'percent', min: -5, max: 20, example: '2.5' });

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
    // An empty value is kept: a cleared optional field (say, no fees) must not come back as its default.
    if (!v.trim()) { el.value = ''; return true; }
    if (!Number.isFinite(parseNumber(v))) return false;
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
  // Leaving the page (Buy Me a Coffee, an ad, any link): save the inputs in this history entry's address, so the
  // Back button reopens the calculator with the same figures even when the browser reloads the page.
  const remember = () => history.replaceState(null, '', `${location.pathname}#${formParams(form)}`);
  document.addEventListener('click', (e) => { if (e.target.closest?.('a[href]:not([href^="#"])')) remember(); }, true);
  addEventListener('pagehide', remember);
}

// The address that reopens this result: the page plus the form's inputs after the # (see syncFormWithUrl).
const shareUrl = () => `${location.origin}${location.pathname}${sharedForm ? `#${formParams(sharedForm)}` : ''}`;

// Print or save as PDF. The printout (css/style.css, @media print) leaves out the header, ads, coffee links and
// form controls, and shows instead: the tool name, the inputs as "label: value" lines, the results, the assumptions,
// the rates-checked date, the general-information statement, and the results link, so the printout can reproduce
// the result. That keeps the estimate easy to print or store, as ASIC's calculator relief requires
// (ASIC Corporations (Generic Calculators) Instrument 2026/41 s 8(1)(f)).
const textOf = (el) => (el?.textContent || '').replace(/\s+/g, ' ').trim();
function inputRows(form) {
  const rows = [];
  for (const el of form.querySelectorAll('input, select, textarea')) {
    if (el.type === 'hidden' || el.type === 'button' || el.type === 'submit' || el.closest('[hidden]')) continue;
    if (el.type === 'radio' && !el.checked) continue;
    const check = el.closest('label.check');
    let label = el.type === 'radio' ? textOf(el.closest('fieldset')?.querySelector('legend')) || textOf(el.labels?.[0])
      : check ? textOf(check) : textOf(el.labels?.[0]) || el.getAttribute('aria-label') || '';
    let value;
    if (el.type === 'checkbox') value = el.checked ? 'Yes' : 'No';
    else if (el.type === 'radio') value = textOf(el.labels?.[0]) || el.value;
    else if (el.tagName === 'SELECT') value = textOf(el.selectedOptions[0]);
    else if (el.type === 'date' && el.value) value = new Date(`${el.value}T00:00:00`).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
    else value = el.value.trim() || 'Not entered';
    if (el.disabled && el.type === 'checkbox' && !el.checked) continue;
    label = label.replace(/\s*\(optional\)$/i, '');
    if (label) rows.push([label, value]);
  }
  return rows;
}
function fillPrintSummary() {
  const m = document.querySelector('main');
  const form = sharedForm || m?.querySelector('form');
  if (!m || !form) return;
  let box = document.getElementById('print-inputs');
  if (!box) {
    box = document.createElement('section');
    box.id = 'print-inputs';
    box.className = 'print-only print-inputs';
    (m.querySelector('.tool-head') || m.firstElementChild).after(box);
    m.insertAdjacentHTML('beforeend', '<footer class="print-only print-foot" id="print-foot"></footer>');
  }
  const h = document.createElement('h2');
  h.textContent = 'Your inputs';
  const dl = document.createElement('dl');
  for (const [k, v] of inputRows(form)) {
    const div = document.createElement('div');
    const dt = document.createElement('dt'); dt.textContent = k;
    const dd = document.createElement('dd'); dd.textContent = v;
    div.append(dt, dd);
    dl.append(div);
  }
  box.replaceChildren(h, dl);
  const foot = document.getElementById('print-foot');
  const lines = [];
  const money = tool && tool.cat !== 'general';
  if (money) lines.push(`Rates checked ${RATES_CHECKED}. Printed ${new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}.`);
  if (money) lines.push('General information only, not financial, tax or credit advice. It doesn\'t take your personal circumstances into account. Check your situation with the ATO, your state revenue office or a licensed adviser.');
  lines.push(`Open these results again: ${shareUrl()}`);
  lines.push(`Made with ${SITE_NAME} (free)`);
  foot.replaceChildren(...lines.map((t) => { const p = document.createElement('p'); p.textContent = t; return p; }));
}
addEventListener('beforeprint', fillPrintSummary);
matchMedia('print').addEventListener?.('change', (e) => { if (e.matches) fillPrintSummary(); });

// Adds "Copy link", "Print or save as PDF", a "Spot a wrong figure? Tell us" email link (only once CONTACT_EMAIL is
// a valid address) and (once you've changed an input) a gentle coffee prompt under a result card. The prompt is
// never there on page load and never pops up over anything.
export function addResultActions(card) {
  const wrap = document.createElement('div');
  wrap.className = 'result-actions';
  const email = tool ? contactEmail() : '';
  wrap.innerHTML = `
    <div class="btn-row">
      <button class="btn" type="button" data-act="copy">${icon('link')}<span>Copy link to these results</span></button>
      <button class="btn" type="button" data-act="print">${icon('print')}<span>Print or save as PDF</span></button>
    </div>${email ? `
    <p class="report-figure"><a href="" data-act="report">Spot a wrong figure? Tell us<span class="visually-hidden"> (opens your email app)</span></a></p>` : ''}`;
  // The email carries the results link (the page plus the inputs after the #), kept current as the inputs change,
  // so the owner can reopen exactly what you saw. Nothing is sent unless you send the email yourself.
  const report = wrap.querySelector('[data-act="report"]');
  const syncReport = () => { if (report) report.href = wrongFigureMail(email, tool.name, shareUrl()); };
  syncReport();
  report?.addEventListener('pointerdown', syncReport);
  report?.addEventListener('focus', syncReport);
  addEventListener('hashchange', () => setTimeout(syncReport));
  const btn = wrap.querySelector('[data-act="copy"]');
  const idle = btn.innerHTML;
  btn.addEventListener('click', async () => {
    const url = shareUrl();
    try { await navigator.clipboard.writeText(url); btn.innerHTML = `${icon('check')}<span>Link copied</span>`; announce('Link copied'); }
    catch { prompt('Copy this link:', url); }
    setTimeout(() => { btn.innerHTML = idle; }, 2000);
  });
  wrap.querySelector('[data-act="print"]').addEventListener('click', () => { fillPrintSummary(); print(); });
  card.append(wrap);
  // Keep the print summary current, so printing from the browser menu (or a PDF made without beforeprint) has it.
  const form = card.closest('main')?.querySelector('form');
  let t = 0;
  const refresh = () => { syncReport(); clearTimeout(t); t = setTimeout(() => { syncReport(); fillPrintSummary(); }, 250); };
  form?.addEventListener('input', refresh);
  form?.addEventListener('change', refresh);
  refresh();
  if (HAS_BMC && form) {
    const show = (e) => {
      if (!e.isTrusted) return;
      form.removeEventListener('input', show);
      form.removeEventListener('change', show);
      wrap.insertAdjacentHTML('beforeend', `<p class="nudge">${icon('coffee')}<span>Saved you a spreadsheet? <a href="${BMC_URL}" rel="noopener">Buy me a coffee</a>. It keeps the rates checked.</span></p>`);
    };
    form.addEventListener('input', show);
    form.addEventListener('change', show);
  }
}

// Smooth page changes. Start fetching a page as soon as a finger or pointer reaches its link, so it is
// usually loaded by the time the tap or click lands, and show a loading bar the moment a link is
// followed, so a slow connection never looks like a missed tap (and invites a second tap elsewhere).
const prefetched = new Set();
const sitePage = (a) => a && a.origin === location.origin && a.pathname !== location.pathname
  && !a.hasAttribute('download') && (!a.target || a.target === '_self') && /(\.html|\/)$/.test(a.pathname);
const prefetch = (e) => {
  const a = e.target.closest?.('a[href]');
  if (!sitePage(a) || prefetched.has(a.pathname)) return;
  prefetched.add(a.pathname);
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = a.pathname;
  document.head.append(link);
};
addEventListener('pointerover', prefetch, { passive: true });
addEventListener('touchstart', prefetch, { passive: true });
addEventListener('focusin', prefetch);
addEventListener('click', (e) => {
  const a = e.target.closest?.('a[href]');
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || !sitePage(a)) return;
  document.documentElement.classList.add('is-leaving');
  a.closest('.tile')?.classList.add('is-pressed');
});
// Coming back with the Back button restores the page as it was left, so clear the loading state.
addEventListener('pageshow', () => {
  document.documentElement.classList.remove('is-leaving');
  document.querySelectorAll('.is-pressed').forEach((el) => el.classList.remove('is-pressed'));
});

// Register after the page has loaded, so caching the site for offline use doesn't compete with this
// page's own requests on a first visit.
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  const register = () => navigator.serviceWorker.register(`${base}sw.js`).catch(() => { /* offline support unavailable */ });
  if (document.readyState === 'complete') register();
  else addEventListener('load', register, { once: true });
}

// Ad placeholder after each tool, before the explainer: below the results, the chart and the assumptions, never
// between the form and its result or inside the results panel (js/ads.js also refuses a slot placed there).
// Pages in ADS_EXCLUDE (js/config.js) get none. Stays hidden unless ads are enabled.
const content = document.querySelector('main .content');
if (tool && content && !ADS_EXCLUDE.includes(tool.slug)) content.insertAdjacentHTML('beforebegin', '<div class="ad-slot" hidden></div>');
mountAds();

// Cloudflare Web Analytics: off until CF_ANALYTICS_TOKEN is set (js/config.js); loads after 'load', never locally
// or with Do Not Track / Global Privacy Control (js/analytics.js).
mountAnalytics();

// "Tools I use" affiliate card, below the FAQs, on the pages each link is set for (off by default: see js/config.js).
const affiliateCard = tool && content ? affiliateCardHtml(affiliatesFor(tool.slug)) : '';
if (affiliateCard) (content.querySelector('nav.related')?.previousElementSibling || content.lastElementChild).insertAdjacentHTML('beforebegin', affiliateCard);

// Related-tool links get their tool's icon.
document.querySelectorAll('.related a').forEach((a) => {
  const s = a.getAttribute('href')?.replace(/\.html$/, '');
  if (s) a.insertAdjacentHTML('afterbegin', icon(s));
});

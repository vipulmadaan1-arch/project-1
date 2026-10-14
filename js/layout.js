// Injects the shared header and footer, and handles the theme toggle.
import { SITE_NAME, BMC_URL } from './config.js';

// Hide all coffee links until a real Buy Me a Coffee handle is set in config.js.
const HAS_BMC = !BMC_URL.includes('YOUR_HANDLE');

const root = document.documentElement;
const base = root.dataset.base || './';

function safeGet(k) { try { return localStorage.getItem(k); } catch { return null; } }
function safeSet(k, v) { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } }

const savedTheme = safeGet('theme');
if (savedTheme) root.dataset.theme = savedTheme;

const [first, ...rest] = SITE_NAME.split(/(?=[A-Z])/);
const header = document.createElement('header');
header.className = 'site-header';
header.innerHTML = `
  <div class="wrap">
    <a class="brand" href="${base}">${first}<span>${rest.join('')}</span></a>
    <button class="icon-btn" id="theme-toggle" type="button" aria-label="Toggle dark mode" title="Light / dark">🌓</button>
    ${HAS_BMC ? `<a class="bmc" href="${BMC_URL}" target="_blank" rel="noopener">☕ Buy me a coffee</a>` : ''}
  </div>`;
document.body.prepend(header);

const footer = document.createElement('footer');
footer.className = 'site-footer';
footer.innerHTML = `
  <div class="wrap">
    <p>Free tools, no sign-up. Everything runs in your browser — nothing you enter is sent anywhere.</p>
    <p>Financial calculators give general estimates only and are not financial, tax or legal advice. Check figures with the ATO, Revenue NSW or a licensed professional.</p>
    ${HAS_BMC ? `<p>Found this useful? <a href="${BMC_URL}" target="_blank" rel="noopener">Buy me a coffee</a> to keep it free.</p>` : ''}
  </div>`;
document.body.append(footer);

document.getElementById('theme-toggle').addEventListener('click', () => {
  const isDark = root.dataset.theme
    ? root.dataset.theme === 'dark'
    : matchMedia('(prefers-color-scheme: dark)').matches;
  root.dataset.theme = isDark ? 'light' : 'dark';
  safeSet('theme', root.dataset.theme);
});

export { safeGet, safeSet };

export const fmtMoney = (n, dp = 0) =>
  n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: dp, maximumFractionDigits: dp });
export const num = (el) => parseFloat(String(el.value).replace(/[,$\s]/g, '')) || 0;

// Keeps a calculator form in sync with the URL so results can be shared or bookmarked.
// Fields are matched by id. Call after the page's own listeners are attached.
export function syncFormWithUrl(form, onChange) {
  const params = new URLSearchParams(location.search);
  let restored = false;
  for (const el of form.querySelectorAll('input[id], select[id]')) {
    if (!params.has(el.id)) continue;
    if (el.type === 'checkbox') el.checked = params.get(el.id) === '1';
    else el.value = params.get(el.id);
    restored = true;
  }
  if (restored) onChange();

  let t;
  form.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(() => {
      const p = new URLSearchParams();
      for (const el of form.querySelectorAll('input[id], select[id]')) {
        p.set(el.id, el.type === 'checkbox' ? (el.checked ? '1' : '0') : el.value);
      }
      history.replaceState(null, '', `${location.pathname}?${p}`);
    }, 300);
  });
}

// Adds "Copy link" and a gentle coffee prompt under a result card.
export function addResultActions(card) {
  const wrap = document.createElement('div');
  wrap.className = 'result-actions';
  wrap.innerHTML = `
    <button class="btn" type="button">🔗 Copy link to these results</button>
    ${HAS_BMC ? `<p class="nudge">Saved you some time? <a href="${BMC_URL}" target="_blank" rel="noopener">Buy me a coffee ☕</a></p>` : ''}`;
  const btn = wrap.querySelector('button');
  btn.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(location.href); btn.textContent = '✓ Link copied'; }
    catch { prompt('Copy this link:', location.href); }
    setTimeout(() => { btn.textContent = '🔗 Copy link to these results'; }, 2000);
  });
  card.append(wrap);
}

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register(`${base}sw.js`).catch(() => { /* offline support unavailable */ });
}

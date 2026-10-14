// Injects the shared header and footer, and handles the theme toggle.
import { SITE_NAME, BMC_URL } from './config.js';

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
    <a class="bmc" href="${BMC_URL}" target="_blank" rel="noopener">☕ Buy me a coffee</a>
  </div>`;
document.body.prepend(header);

const footer = document.createElement('footer');
footer.className = 'site-footer';
footer.innerHTML = `
  <div class="wrap">
    <p>Free tools, no sign-up. Everything runs in your browser — nothing you enter is sent anywhere.</p>
    <p>Financial calculators give general estimates only and are not financial, tax or legal advice. Check figures with the ATO, Revenue NSW or a licensed professional.</p>
    <p>Found this useful? <a href="${BMC_URL}" target="_blank" rel="noopener">Buy me a coffee</a> to keep it free.</p>
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

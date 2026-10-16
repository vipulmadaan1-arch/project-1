// Cloudflare Web Analytics, off until CF_ANALYTICS_TOKEN is set in config.js.
// The beacon is cookieless: it counts page views and timings and posts them to
// https://cloudflareinsights.com/cdn-cgi/rum. It never sees calculator inputs (they stay out of the page address).
// - Loaded only after the page's 'load' event, so it never competes with the page's own requests.
// - Never on localhost or file: pages (tests and local previews send nothing).
// - Never for visitors whose browser sends Do Not Track or Global Privacy Control.
// The Content-Security-Policy allows the script itself through 'strict-dynamic' (it's added by a trusted module);
// scripts/seo.mjs adds https://cloudflareinsights.com to connect-src only while the token is valid, and writes the
// matching paragraph into privacy.html.
import { CF_ANALYTICS_TOKEN } from './config.js';

export const BEACON_SRC = 'https://static.cloudflareinsights.com/beacon.min.js';
export const BEACON_ORIGIN = 'https://cloudflareinsights.com';

// Cloudflare Web Analytics site tokens are 32 hex characters. Anything else (empty, a pasted <script> tag, a typo)
// leaves analytics off.
export const validAnalyticsToken = (t) => typeof t === 'string' && /^[0-9a-f]{32}$/i.test(t);
export const ANALYTICS_ENABLED = validAnalyticsToken(CF_ANALYTICS_TOKEN);

const LOCAL_HOST = /^(localhost|127(?:\.\d{1,3}){3}|0\.0\.0\.0|\[::1\]|::1)$|\.localhost$/i;

// Whether this page view should load the beacon. Pure, so it's unit-tested (tests/analytics.test.mjs).
export function shouldLoadAnalytics({ token, protocol, hostname, doNotTrack, globalPrivacyControl }) {
  if (!validAnalyticsToken(token)) return false;
  if (protocol !== 'https:' && protocol !== 'http:') return false;
  if (!hostname || LOCAL_HOST.test(hostname)) return false;
  if (doNotTrack === '1' || doNotTrack === 'yes' || globalPrivacyControl === true) return false;
  return true;
}

// The privacy page's "What we don't collect" paragraph, written by scripts/seo.mjs so it's right without JavaScript.
export function privacyAnalyticsHtml(enabled = ANALYTICS_ENABLED) {
  if (!enabled) return '<p>There are no analytics or tracking scripts of our own, and no forms that send your details anywhere. Fonts and icons are served from this site, not from a third party.</p>';
  return '<p>We use <a href="https://www.cloudflare.com/web-analytics/" target="_blank" rel="noopener noreferrer">Cloudflare Web Analytics</a> to count visits and see which calculators are used. It sets no cookies, doesn\'t track you across sites and doesn\'t collect your figures. Your browser\'s Do Not Track or Global Privacy Control setting turns it off. Cloudflare handles this data under its <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer">privacy policy</a>. There are no other analytics or tracking scripts, and no forms that send your details anywhere. Fonts and icons are served from this site, not from a third party.</p>';
}

export function mountAnalytics(token = CF_ANALYTICS_TOKEN) {
  const ok = shouldLoadAnalytics({
    token,
    protocol: location.protocol,
    hostname: location.hostname,
    doNotTrack: navigator.doNotTrack ?? window.doNotTrack,
    globalPrivacyControl: navigator.globalPrivacyControl,
  });
  if (!ok) return false;
  const add = () => {
    const s = document.createElement('script');
    s.defer = true;
    s.src = BEACON_SRC;
    s.setAttribute('data-cf-beacon', JSON.stringify({ token }));
    document.head.append(s);
  };
  if (document.readyState === 'complete') add();
  else addEventListener('load', add, { once: true });
  return true;
}

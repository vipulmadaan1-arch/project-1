// The Content-Security-Policy that scripts/seo.mjs writes into every page, as a pure function so
// tests/analytics.test.mjs can check it with ads and analytics on or off.
// - script-src: only the inline boot script (by hash) runs; 'strict-dynamic' lets the modules it loads run and
//   import others, and lets them add <script> elements (AdSense, the Cloudflare beacon). 'unsafe-inline' and
//   https: http: are ignored by browsers that support 'strict-dynamic' and only matter to very old ones.
// - style-src needs 'unsafe-inline': some pages use style="" attributes.
// - form-action 'none': forms never submit (each calculator works out results in the page).
// - base-uri: 'none', except the 404 page, whose <base> makes its links work at any missing address.
// AdSense (js/ads.js, off until ADSENSE_CLIENT and ADSENSE_SLOT are set) needs more: Google's scripts use eval
// and load images, frames and connections from many Google domains, so with ads on the policy adds
// 'unsafe-eval' and https: for img-src, connect-src and frame-src.
// Cloudflare Web Analytics (js/analytics.js, off until CF_ANALYTICS_TOKEN is valid) posts its beacon to
// https://cloudflareinsights.com/cdn-cgi/rum, so with it on connect-src adds that origin.
import { BEACON_ORIGIN } from '../js/analytics.js';

export function cspPolicy({ hash, file, ads = false, analytics = false }) {
  const connect = ads ? " 'self' https:" : ` 'self'${analytics ? ` ${BEACON_ORIGIN}` : ''}`;
  return [
    "default-src 'self'",
    `script-src 'sha256-${hash}' 'strict-dynamic' 'unsafe-inline'${ads ? " 'unsafe-eval'" : ''} https: http:`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data:${ads ? ' https:' : ''}`,
    "font-src 'self'",
    `connect-src${connect}`,
    `frame-src ${ads ? 'https:' : "'none'"}`,
    "object-src 'none'",
    `base-uri ${file === '404.html' ? "'self'" : "'none'"}`,
    "form-action 'none'",
  ].join('; ');
}

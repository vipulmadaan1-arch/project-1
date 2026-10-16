import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { CF_ANALYTICS_TOKEN } from '../js/config.js';
import {
  validAnalyticsToken, shouldLoadAnalytics, ANALYTICS_ENABLED, BEACON_SRC, privacyAnalyticsHtml,
} from '../js/analytics.js';
import { cspPolicy } from '../scripts/csp.mjs';

const TOKEN = '0123456789abcdef0123456789ABCDEF';
const PAGES = ['index.html', 'privacy.html', 'about.html', 'terms.html', 'contact.html', '404.html', ...readdirSync('tools').map((f) => `tools/${f}`)];
const cspOf = (html) => html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/)[1];
const directive = (csp, name) => csp.split('; ').find((d) => d.startsWith(`${name} `));

test('validAnalyticsToken accepts only a 32-character hex token', () => {
  assert.equal(validAnalyticsToken(TOKEN), true);
  assert.equal(validAnalyticsToken('a'.repeat(32)), true);
  for (const bad of ['', ' ', 'a'.repeat(31), 'a'.repeat(33), 'g'.repeat(32), `${'a'.repeat(31)} `, `"${'a'.repeat(30)}"`,
    `{"token": "${TOKEN}"}`, `<script defer src="${BEACON_SRC}" data-cf-beacon='{"token": "${TOKEN}"}'></script>`,
    `${TOKEN.slice(0, 16)}"><script>${TOKEN.slice(0, 8)}`, null, undefined, 123, [TOKEN]]) {
    assert.equal(validAnalyticsToken(bad), false, `${JSON.stringify(bad)} should be refused`);
  }
});

test('shouldLoadAnalytics: only a valid token, a real host, and no Do Not Track or Global Privacy Control', () => {
  const ok = { token: TOKEN, protocol: 'https:', hostname: 'vipulmadaan1-arch.github.io', doNotTrack: null, globalPrivacyControl: undefined };
  assert.equal(shouldLoadAnalytics(ok), true);
  assert.equal(shouldLoadAnalytics({ ...ok, hostname: 'dinkumcalc.com.au', doNotTrack: '0', globalPrivacyControl: false }), true);
  assert.equal(shouldLoadAnalytics({ ...ok, token: '' }), false);
  assert.equal(shouldLoadAnalytics({ ...ok, token: 'not-a-token' }), false);
  for (const hostname of ['localhost', 'LOCALHOST', '127.0.0.1', '127.1.2.3', '0.0.0.0', '[::1]', '::1', 'app.localhost', '']) {
    assert.equal(shouldLoadAnalytics({ ...ok, hostname }), false, `${hostname} is local`);
  }
  assert.equal(shouldLoadAnalytics({ ...ok, protocol: 'file:', hostname: '' }), false);
  assert.equal(shouldLoadAnalytics({ ...ok, protocol: 'file:' }), false);
  assert.equal(shouldLoadAnalytics({ ...ok, doNotTrack: '1' }), false);
  assert.equal(shouldLoadAnalytics({ ...ok, doNotTrack: 'yes' }), false);
  assert.equal(shouldLoadAnalytics({ ...ok, globalPrivacyControl: true }), false);
});

test('analytics stay off while CF_ANALYTICS_TOKEN is blank', () => {
  assert.equal(ANALYTICS_ENABLED, validAnalyticsToken(CF_ANALYTICS_TOKEN));
  if (!CF_ANALYTICS_TOKEN) assert.equal(ANALYTICS_ENABLED, false);
});

test('cspPolicy adds cloudflareinsights.com to connect-src only when analytics are on', () => {
  const off = cspPolicy({ hash: 'x', file: 'index.html' });
  const on = cspPolicy({ hash: 'x', file: 'index.html', analytics: true });
  assert.equal(directive(off, 'connect-src'), "connect-src 'self'");
  assert.equal(directive(on, 'connect-src'), "connect-src 'self' https://cloudflareinsights.com");
  // Nothing else changes: the beacon script itself is allowed by 'strict-dynamic' (added by a trusted module).
  assert.equal(on.replace(' https://cloudflareinsights.com', ''), off);
  assert.match(directive(on, 'script-src'), /'strict-dynamic'/);
  assert.doesNotMatch(on, /unsafe-eval|frame-src https:|img-src 'self' data: https:/);
  // With ads on, connect-src is already https: (covers the beacon too).
  assert.equal(directive(cspPolicy({ hash: 'x', file: 'index.html', ads: true, analytics: true }), 'connect-src'), "connect-src 'self' https:");
});

test('every page\'s CSP matches CF_ANALYTICS_TOKEN (run npm run seo after changing it)', () => {
  for (const p of PAGES) {
    const html = readFileSync(p, 'utf8');
    const connect = directive(cspOf(html), 'connect-src');
    if (ANALYTICS_ENABLED) assert.match(connect, /https:\/\/cloudflareinsights\.com|https:$/, `${p}: ${connect}`);
    else assert.equal(connect, "connect-src 'self'", `${p}: ${connect}`);
    // The beacon is never in the static HTML: js/analytics.js adds it after 'load'.
    assert.doesNotMatch(html, /static\.cloudflareinsights\.com|data-cf-beacon/, `${p} has the beacon in its HTML`);
  }
});

test('privacy page says what analytics run, without JavaScript', () => {
  const html = readFileSync('privacy.html', 'utf8');
  const block = html.match(/<!-- analytics:start -->([\s\S]*?)<!-- analytics:end -->/)[1].trim();
  assert.equal(block, privacyAnalyticsHtml(ANALYTICS_ENABLED));
  if (!ANALYTICS_ENABLED) {
    assert.match(block, /There are no analytics or tracking scripts of our own/);
    assert.doesNotMatch(html, /Cloudflare/);
  }
  const on = privacyAnalyticsHtml(true);
  assert.match(on, /We use <a href="https:\/\/www\.cloudflare\.com\/web-analytics\/"[^>]*>Cloudflare Web Analytics<\/a> to count visits/);
  assert.match(on, /It sets no cookies, doesn't track you across sites and doesn't collect your figures\. Your browser's Do Not Track or Global Privacy Control setting turns it off\./);
  assert.match(on, /href="https:\/\/www\.cloudflare\.com\/privacypolicy\/"/);
  assert.doesNotMatch(on, /no analytics or tracking scripts of our own/);
  // The home page's promise stays true either way.
  assert.match(html, /The calculators never send your figures anywhere/);
});

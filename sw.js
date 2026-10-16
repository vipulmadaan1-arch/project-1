// Service worker: caches every file so the site works offline.
//
// Updating: bump VERSION whenever you change any file, and keep HASHES current (scripts/sw-hashes.mjs, which
// scripts/seo.mjs runs; tests fail when a hash is stale). The browser checks sw.js on each visit, sees it
// changed, and installs the new version into a new cache. Files whose hash matches the previous version's are
// copied from its cache; only changed files are downloaded. The new worker then takes over straight away
// (skipWaiting + clients.claim) and deletes the old cache. Taking over early is safe here because every page
// loads its scripts up front. The one lazy import, aussie.js, imports nothing and only reads the page, so an
// open page that gets the newer copy still works.
//
// Serving: cache first, from this version's cache, so pages open instantly with no network round trip.
// Every file comes from the same version, so a page never mixes old and new scripts. A deploy shows up
// once the browser has installed the new worker (it checks sw.js on each visit and takes over straight
// away), which is usually the next page opened. Anything not cached goes to the network, falling back
// to the cache's copy if the network fails or answers slower than NETWORK_TIMEOUT_MS.
const VERSION = 'v70';
const CACHE_PREFIX = 'dinkumcalc-';
const CACHE = `${CACHE_PREFIX}${VERSION}`;
// Caches this site has used: the current prefix, plus the one from before the rename to Dinkum Calc (v57 and
// earlier), so an update still reuses unchanged files from an old cache and activate still deletes it.
const OWN_PREFIXES = [CACHE_PREFIX, 'sortedmate-'];
const isOwnCache = (key) => OWN_PREFIXES.some((p) => key.startsWith(p));
const NETWORK_TIMEOUT_MS = 4000;
// Each version's cache also holds the HASHES it was built from, under this key.
const HASH_KEY = 'sw-hashes.json';
const FILES = [
  './',
  'js/analytics.js',
  '404.html',
  'css/style.css',
  'tools/upfront-costs.html',
  'tools/lmi.html',
  'js/pages/upfront-costs.js',
  'js/pages/lmi.js',
  'js/upfront.js',
  'js/lmi.js',
  'js/pages/budget.js',
  'js/pages/retirement.js',
  'js/budget.js',
  'js/retirement.js',
  'tools/budget.html',
  'tools/retirement.html',
  'js/pages/rent-vs-buy.js',
  'js/pages/tax-refund.js',
  'js/rentbuy.js',
  'js/refund.js',
  'tools/rent-vs-buy.html',
  'tools/tax-refund.html',
  'tools/balance-transfer.html',
  'tools/term-deposit.html',
  'tools/refinance.html',
  'js/pages/balance-transfer.js',
  'js/pages/term-deposit.js',
  'js/pages/refinance.js',
  'js/balance-transfer.js',
  'js/term-deposit.js',
  'js/refinance.js',
  'tools/rental-cashflow.html',
  'js/pages/rental-cashflow.js',
  'js/rental.js',
  'tools/borrowing-power.html',
  'tools/inflation.html',
  'js/pages/borrowing-power.js',
  'js/pages/inflation.js',
  'js/borrowing.js',
  'js/inflation.js',
  'js/cpi-data.js',
  'js/chart.js',
  'js/aussie.js',
  'js/format.js',
  'tools/car-stamp-duty.html',
  'js/pages/car-stamp-duty.js',
  'js/motor-duty.js',
  'tools/medicare-levy-surcharge.html',
  'tools/super.html',
  'js/pages/medicare-levy-surcharge.js',
  'js/pages/super.js',
  'js/mls.js',
  'js/super.js',
  'tools/savings-goal.html',
  'tools/credit-card.html',
  'tools/personal-loan.html',
  'js/pages/savings-goal.js',
  'js/pages/credit-card.js',
  'js/pages/personal-loan.js',
  'js/loans.js',
  'js/pages/work-deductions.js',
  'js/deductions.js',
  'tools/work-deductions.html',
  'js/pages/hecs-help.js',
  'js/pages/gross-up.js',
  'js/hecs.js',
  'js/grossup.js',
  'tools/hecs-help.html',
  'tools/gross-up.html',
  'tools/capital-gains-tax.html',
  'js/pages/capital-gains-tax.js',
  'js/cgt.js',
  'fonts/instrument-sans.woff2',
  'img/icon.svg',
  'index.html',
  'js/ads.js',
  'js/calc.js',
  'js/rates.js',
  'js/config.js',
  'js/duty.js',
  'js/icons.js',
  'js/layout.js',
  'js/site-footer.js',
  'js/pages/calculator.js',
  'js/pages/compound-interest.js',
  'js/pages/date-calculator.js',
  'js/pages/gst.js',
  'js/pages/home.js',
  'js/pages/mortgage.js',
  'js/pages/offset.js',
  'js/pages/percentage.js',
  'js/pages/privacy.js',
  'js/pages/rental-yield.js',
  'js/pages/stamp-duty-nsw.js',
  'js/pages/stamp-duty.js',
  'js/pages/stopwatch.js',
  'js/pages/take-home-pay.js',
  'js/pages/timer.js',
  'js/pages/unit-converter.js',
  'js/pages/world-clock.js',
  'js/tools.js',
  'manifest.webmanifest',
  'privacy.html',
  'about.html',
  'terms.html',
  'contact.html',
  'js/contact.js',
  'js/pages/contact.js',
  'js/affiliates.js',
  'js/present-value.js',
  'tools/calculator.html',
  'tools/compound-interest.html',
  'tools/date-calculator.html',
  'tools/gst.html',
  'tools/mortgage.html',
  'tools/offset.html',
  'tools/percentage.html',
  'tools/rental-yield.html',
  'tools/stamp-duty-nsw.html',
  'tools/stamp-duty-vic.html',
  'tools/stamp-duty-qld.html',
  'tools/stamp-duty-wa.html',
  'tools/stamp-duty-sa.html',
  'tools/stamp-duty-tas.html',
  'tools/stamp-duty-act.html',
  'tools/stamp-duty-nt.html',
  'tools/stamp-duty.html',
  'tools/stopwatch.html',
  'tools/take-home-pay.html',
  'tools/timer.html',
  'tools/unit-converter.html',
  'tools/world-clock.html',
];

// hashes:start (written by scripts/sw-hashes.mjs: don't edit by hand)
const HASHES = {
  './': 'c9025e3be0832479',
  'js/analytics.js': '4bef7ed4b3c9194c',
  '404.html': '2a6d6ee6fcec5357',
  'css/style.css': '5a5c0ca50c110281',
  'tools/upfront-costs.html': '35d2d5811fcd7f4b',
  'tools/lmi.html': '05ca1b589bceda7f',
  'js/pages/upfront-costs.js': '605f91de49f15a12',
  'js/pages/lmi.js': '610211673a05c0d5',
  'js/upfront.js': '73abd461f450a1d0',
  'js/lmi.js': 'ca8a492ea8898ef9',
  'js/pages/budget.js': '831670c69006e443',
  'js/pages/retirement.js': '4760678d0f2a8d2e',
  'js/budget.js': '8dcef1ae001d588d',
  'js/retirement.js': '846cf7da0a46b005',
  'tools/budget.html': '0c78fe0c0a756ccb',
  'tools/retirement.html': 'b2c2a0d58c80afa1',
  'js/pages/rent-vs-buy.js': '5be1991fb20ae7b4',
  'js/pages/tax-refund.js': '8236aecff05422de',
  'js/rentbuy.js': 'c389bfa04e175e66',
  'js/refund.js': '707b0af2be637097',
  'tools/rent-vs-buy.html': '1d19aed3f434f3cc',
  'tools/tax-refund.html': 'ac32ec21eba359b2',
  'tools/balance-transfer.html': 'e0404253f8dbbe88',
  'tools/term-deposit.html': '8953b3d6e486b91f',
  'tools/refinance.html': '1e3793be024b4c3e',
  'js/pages/balance-transfer.js': 'a83806c5c3c480de',
  'js/pages/term-deposit.js': 'e4a493c6bcbbe93c',
  'js/pages/refinance.js': '5751a61c9628725e',
  'js/balance-transfer.js': 'e7b9836f0590b16c',
  'js/term-deposit.js': '3ef0d3cf5795b531',
  'js/refinance.js': '4e0d44b282ef46ed',
  'tools/rental-cashflow.html': '7d9a58fbc70a0391',
  'js/pages/rental-cashflow.js': '37c0a36b98c83fc0',
  'js/rental.js': '0e4ccec12c46ee15',
  'tools/borrowing-power.html': 'a96451893a3ece31',
  'tools/inflation.html': '6aa473154285b709',
  'js/pages/borrowing-power.js': '064b68613b8d2f27',
  'js/pages/inflation.js': '56f9647b0c8fa5cc',
  'js/borrowing.js': 'f21f0e8cfd098da9',
  'js/inflation.js': '7ff1caedb42a41e6',
  'js/cpi-data.js': '32fdcfe77cb6e113',
  'js/chart.js': 'a3dab35ca256e7f8',
  'js/aussie.js': '0fc6e377f2217e89',
  'js/format.js': '60fd3bc6cbd9acc9',
  'tools/car-stamp-duty.html': 'e6455e173dadf21f',
  'js/pages/car-stamp-duty.js': '20a270a88a631e97',
  'js/motor-duty.js': '9a30f7ba5cf3a291',
  'tools/medicare-levy-surcharge.html': '5dcc1d4b733be93a',
  'tools/super.html': '6995c7d52ede739f',
  'js/pages/medicare-levy-surcharge.js': '8142605060100729',
  'js/pages/super.js': '99afc0e9752b9bbb',
  'js/mls.js': '07db9fa825ba6310',
  'js/super.js': '7905eecbe1b9a884',
  'tools/savings-goal.html': 'ba26468124ba9d3e',
  'tools/credit-card.html': 'edc6244e5ee4f399',
  'tools/personal-loan.html': '181f946ec948be30',
  'js/pages/savings-goal.js': 'd10e1fb820987f35',
  'js/pages/credit-card.js': '70238b2cb54face1',
  'js/pages/personal-loan.js': 'f5e08baf28802d6f',
  'js/loans.js': '3718099c698b7ab5',
  'js/pages/work-deductions.js': 'f99689df032a4023',
  'js/deductions.js': 'e29892f8403fa769',
  'tools/work-deductions.html': '5a49cdb92eca7c2b',
  'js/pages/hecs-help.js': '6360a3117bdec84d',
  'js/pages/gross-up.js': 'e6840ca47bcee366',
  'js/hecs.js': 'e203acd7f256ce7c',
  'js/grossup.js': '57af1d271d096f44',
  'tools/hecs-help.html': '823846caca29cb3c',
  'tools/gross-up.html': '1dcbd46f3860e346',
  'tools/capital-gains-tax.html': '236e5d472ce1b89c',
  'js/pages/capital-gains-tax.js': '569856b2d357227c',
  'js/cgt.js': 'd3677db85c32d4f0',
  'fonts/instrument-sans.woff2': '2ee17598a98d8a59',
  'img/icon.svg': '2411553927ad6b14',
  'index.html': 'c9025e3be0832479',
  'js/ads.js': '3693ab2a0433a185',
  'js/calc.js': '128db9b2f8bc4130',
  'js/rates.js': '51eca1accbc9a681',
  'js/config.js': 'f45f3a2222e9e850',
  'js/duty.js': '511bfb98a0177d63',
  'js/icons.js': '97b1ee33cf5a25be',
  'js/layout.js': 'b3e58984cf84bbcb',
  'js/site-footer.js': '121af36d53209461',
  'js/pages/calculator.js': '4b0a93b681632315',
  'js/pages/compound-interest.js': '04639941f39dbd43',
  'js/pages/date-calculator.js': '6728f8569d2b697f',
  'js/pages/gst.js': '3f117f9b75185e6b',
  'js/pages/home.js': 'b16721a1ae59d254',
  'js/pages/mortgage.js': '006682ff0ff2cfbe',
  'js/pages/offset.js': '358de09ba88ea789',
  'js/pages/percentage.js': '9ae086464f83548e',
  'js/pages/privacy.js': '8c240a8142d73bac',
  'js/pages/rental-yield.js': '26c0ecc570950bc2',
  'js/pages/stamp-duty-nsw.js': 'af11c8f1ab717431',
  'js/pages/stamp-duty.js': '9351cc6d23446360',
  'js/pages/stopwatch.js': '94b9810dc7ee2782',
  'js/pages/take-home-pay.js': '1c76b0217d51eec7',
  'js/pages/timer.js': '1c7d873440292157',
  'js/pages/unit-converter.js': 'f3baedb421204958',
  'js/pages/world-clock.js': 'b82c395f8cf09da9',
  'js/tools.js': '107344f4898228ea',
  'manifest.webmanifest': 'ade7e065154b24eb',
  'privacy.html': '5410fe26f2567736',
  'about.html': '9cf7bbf08270779d',
  'terms.html': 'd9821e14f54eb2eb',
  'contact.html': 'f30d380a4a073469',
  'js/contact.js': '05a261814f05c635',
  'js/pages/contact.js': '9ce2d5a03c2974be',
  'js/affiliates.js': '01e2afd65b358c21',
  'js/present-value.js': '01d21de1aa3daf9d',
  'tools/calculator.html': '4da1984d6df03cbd',
  'tools/compound-interest.html': '09468caaab6eb139',
  'tools/date-calculator.html': '534e1a7714446c85',
  'tools/gst.html': 'cf4c9c64a714148e',
  'tools/mortgage.html': 'e1c7ee2f7e1789c0',
  'tools/offset.html': '52c0a5d05975c78e',
  'tools/percentage.html': 'd8073c9a24fadf0f',
  'tools/rental-yield.html': '5ef6a562060732b9',
  'tools/stamp-duty-nsw.html': '4c9dd0c7e8bbc5da',
  'tools/stamp-duty-vic.html': 'b9f30134a118d1ba',
  'tools/stamp-duty-qld.html': 'b78d26a9162d8565',
  'tools/stamp-duty-wa.html': '3b22cbad5932597d',
  'tools/stamp-duty-sa.html': 'e6e83bd5f64e14b3',
  'tools/stamp-duty-tas.html': 'a184009aaa5c9cfc',
  'tools/stamp-duty-act.html': 'fd74ee9b3ba2467d',
  'tools/stamp-duty-nt.html': 'e2cf8df62fed8929',
  'tools/stamp-duty.html': 'd1e70200140e0d2b',
  'tools/stopwatch.html': '92721145cb037e25',
  'tools/take-home-pay.html': '54afc4a20166b6ad',
  'tools/timer.html': 'beee99495f023267',
  'tools/unit-converter.html': '23f318c8c466d6c7',
  'tools/world-clock.html': '295330764adcc83d',
};
// hashes:end

self.addEventListener('install', (e) => {
  e.waitUntil(install().then(() => self.skipWaiting()));
});

async function install() {
  const cache = await caches.open(CACHE);
  try {
    // The newest earlier cache that recorded its hashes (caches from before hashes were added have none,
    // so the first update after them downloads everything once).
    let prev = null, prevHashes = {};
    for (const key of (await caches.keys()).reverse()) {
      if (!isOwnCache(key) || key === CACHE) continue;
      const c = await caches.open(key);
      const m = await c.match(HASH_KEY);
      if (m) { prev = c; prevHashes = await m.json(); break; }
    }
    await Promise.all(FILES.map(async (f) => {
      const url = new URL(f, self.registration.scope).href;
      if (prev && HASHES[f] && prevHashes[f] === HASHES[f]) {
        const hit = await prev.match(url);
        if (hit) return cache.put(url, hit);
      }
      // cache: 'reload' skips the browser's HTTP cache (GitHub Pages lets files be cached for 10 minutes),
      // so a new VERSION stores the files just deployed, not older copies.
      const res = await fetch(new Request(url, { cache: 'reload' }));
      if (!res.ok) throw new Error(`${f}: HTTP ${res.status}`);
      return cache.put(url, res);
    }));
    // Written last, so a cache only claims hashes once every file is in it.
    await cache.put(HASH_KEY, new Response(JSON.stringify(HASHES), { headers: { 'Content-Type': 'application/json' } }));
  } catch (err) {
    // A half-filled cache must not be mistaken for a complete one: drop it, and the browser retries later.
    await caches.delete(CACHE);
    throw err;
  }
}

self.addEventListener('activate', (e) => {
  e.waitUntil(Promise.all([
    caches.keys().then((keys) => Promise.all(keys.filter((k) => isOwnCache(k) && k !== CACHE).map((k) => caches.delete(k)))),
    // Navigation preload stays off: pages are served from the cache first, so a preloaded response would
    // be a wasted request on every page open. (Turned off explicitly, since older versions turned it on.)
    self.registration.navigationPreload?.disable(),
  ]).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  e.respondWith(respond(e, url));
});

// Cache entries are keyed on the path alone: shared result links carry their inputs in ?query, and
// each one shouldn't become a separate cached copy of the page.
async function respond(e, url) {
  // Cache by path only: an address with ?... or #... (a results link) never stores its figures.
  const key = url.origin + url.pathname;
  const cached = await caches.open(CACHE).then((c) => c.match(key));
  if (cached) return cached;
  const network = fromNetwork(e, key);
  e.waitUntil(network.then(() => {}, () => {}));
  const slow = new Promise((resolve) => { setTimeout(resolve, NETWORK_TIMEOUT_MS); });
  try {
    const first = await Promise.race([network, slow]);
    if (first) return first;
    return (await caches.match(key)) || (await network);
  } catch {
    const hit = await caches.match(key);
    if (hit) return hit;
    if (e.request.mode === 'navigate') {
      // Offline on a page that isn't cached (e.g. /tools/gst without .html): try the .html file,
      // otherwise send the visitor to the cached home page.
      const html = !url.pathname.endsWith('/') && !url.pathname.endsWith('.html') && await caches.match(`${key}.html`);
      if (html) return html;
      if (await caches.match(self.registration.scope)) return Response.redirect(self.registration.scope, 302);
    }
    return Response.error();
  }
}

async function fromNetwork(e, key) {
  const res = await fetch(e.request);
  // Only keep complete, successful, same-origin responses: never errors, redirects or opaque bodies.
  if (res.status === 200 && res.type === 'basic' && !res.redirected) {
    const copy = res.clone();
    e.waitUntil(caches.open(CACHE).then((c) => c.put(key, copy)));
  }
  return res;
}

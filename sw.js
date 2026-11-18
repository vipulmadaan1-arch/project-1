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
const VERSION = 'v89';
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
  'js/pages/guide.js',
  'guides/index.html',
  'guides/rate-rise-november-2026.html',
  'guides/capital-gains-tax-2027.html',
  'guides/negative-gearing-2027.html',
  'guides/tax-cut-2026-27.html',
];

// hashes:start (written by scripts/sw-hashes.mjs: don't edit by hand)
const HASHES = {
  './': '34aed1525d5f948b',
  'js/analytics.js': '4bef7ed4b3c9194c',
  '404.html': 'a2f461c4aca8d18b',
  'css/style.css': 'ba2e8b18ec3a8e90',
  'tools/upfront-costs.html': 'bcf0549a2821b189',
  'tools/lmi.html': '4acb152b1cb4b840',
  'js/pages/upfront-costs.js': '605f91de49f15a12',
  'js/pages/lmi.js': '610211673a05c0d5',
  'js/upfront.js': '0c4ac83b3875f3a6',
  'js/lmi.js': 'ca8a492ea8898ef9',
  'js/pages/budget.js': '831670c69006e443',
  'js/pages/retirement.js': '4760678d0f2a8d2e',
  'js/budget.js': '8dcef1ae001d588d',
  'js/retirement.js': '846cf7da0a46b005',
  'tools/budget.html': 'cf6f01bac2c98ab8',
  'tools/retirement.html': '278c5ca54c4c96bd',
  'js/pages/rent-vs-buy.js': '5be1991fb20ae7b4',
  'js/pages/tax-refund.js': '9fded5a6532d3a0f',
  'js/rentbuy.js': 'c389bfa04e175e66',
  'js/refund.js': '395d5f0140549a29',
  'tools/rent-vs-buy.html': '5aab9b8b6783fa57',
  'tools/tax-refund.html': '59ac1f9a4452c9f8',
  'tools/balance-transfer.html': '3ab9c80670d8296c',
  'tools/term-deposit.html': '0e3ec6d24f351d35',
  'tools/refinance.html': 'ecaf9731805cca8e',
  'js/pages/balance-transfer.js': 'a83806c5c3c480de',
  'js/pages/term-deposit.js': 'e4a493c6bcbbe93c',
  'js/pages/refinance.js': '5751a61c9628725e',
  'js/balance-transfer.js': 'e7b9836f0590b16c',
  'js/term-deposit.js': '3ef0d3cf5795b531',
  'js/refinance.js': '4e0d44b282ef46ed',
  'tools/rental-cashflow.html': 'a2558768701432a5',
  'js/pages/rental-cashflow.js': '02aa3bc605600687',
  'js/rental.js': '0041fd583206e18e',
  'tools/borrowing-power.html': 'f9aaa5c5d74a595e',
  'tools/inflation.html': '2f490723e1a3b39d',
  'js/pages/borrowing-power.js': 'd3121ac47a2dc1b8',
  'js/pages/inflation.js': '56f9647b0c8fa5cc',
  'js/borrowing.js': 'f21f0e8cfd098da9',
  'js/inflation.js': '7ff1caedb42a41e6',
  'js/cpi-data.js': '1f763dc280f2a33a',
  'js/chart.js': 'a3dab35ca256e7f8',
  'js/aussie.js': '379504f3b89884d8',
  'js/format.js': '60fd3bc6cbd9acc9',
  'tools/car-stamp-duty.html': '31ea6adc67c8a620',
  'js/pages/car-stamp-duty.js': '20a270a88a631e97',
  'js/motor-duty.js': '9a30f7ba5cf3a291',
  'tools/medicare-levy-surcharge.html': 'bd3312c0fffe880a',
  'tools/super.html': '5906a394ae748ca2',
  'js/pages/medicare-levy-surcharge.js': '8142605060100729',
  'js/pages/super.js': '99afc0e9752b9bbb',
  'js/mls.js': '07db9fa825ba6310',
  'js/super.js': '7905eecbe1b9a884',
  'tools/savings-goal.html': '5b3ced928c41c75d',
  'tools/credit-card.html': '528ecf5df2ddcc51',
  'tools/personal-loan.html': 'a067fee33e91a0f9',
  'js/pages/savings-goal.js': 'd10e1fb820987f35',
  'js/pages/credit-card.js': '70238b2cb54face1',
  'js/pages/personal-loan.js': 'f5e08baf28802d6f',
  'js/loans.js': '3718099c698b7ab5',
  'js/pages/work-deductions.js': 'f99689df032a4023',
  'js/deductions.js': '397ffb5e0566d47a',
  'tools/work-deductions.html': 'f30bd6d1df187c93',
  'js/pages/hecs-help.js': '6360a3117bdec84d',
  'js/pages/gross-up.js': 'e6840ca47bcee366',
  'js/hecs.js': 'bf545521cdec79f1',
  'js/grossup.js': '57af1d271d096f44',
  'tools/hecs-help.html': '3c175dd04b7c9400',
  'tools/gross-up.html': 'caabb935d8b61fcd',
  'tools/capital-gains-tax.html': '78abacb887479022',
  'js/pages/capital-gains-tax.js': '2b9cc7f13154002e',
  'js/cgt.js': '649aa94f31daab1f',
  'fonts/instrument-sans.woff2': '2ee17598a98d8a59',
  'img/icon.svg': '2411553927ad6b14',
  'index.html': '34aed1525d5f948b',
  'js/ads.js': '3693ab2a0433a185',
  'js/calc.js': '618d5f68f2819292',
  'js/rates.js': '91bd0ec9179e7c03',
  'js/config.js': 'f45f3a2222e9e850',
  'js/duty.js': '511bfb98a0177d63',
  'js/icons.js': 'b77b2d5a3aad6693',
  'js/layout.js': 'a2d272ac7c9b0f4f',
  'js/site-footer.js': 'f5179bfc79bd2969',
  'js/pages/calculator.js': '4b0a93b681632315',
  'js/pages/compound-interest.js': '04639941f39dbd43',
  'js/pages/date-calculator.js': '9596e11c93512712',
  'js/pages/gst.js': '3f117f9b75185e6b',
  'js/pages/home.js': 'dfb9dc1b12c17987',
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
  'js/tools.js': '8a15a71105888653',
  'manifest.webmanifest': 'ade7e065154b24eb',
  'privacy.html': '9dd7c8567c5e099a',
  'about.html': 'a5896dc33f87d2c2',
  'terms.html': '0dff193b54dee017',
  'contact.html': 'b4f52c8f5915472c',
  'js/contact.js': '05a261814f05c635',
  'js/pages/contact.js': '9ce2d5a03c2974be',
  'js/affiliates.js': '01e2afd65b358c21',
  'js/present-value.js': '01d21de1aa3daf9d',
  'tools/calculator.html': '2f6861c98436b82b',
  'tools/compound-interest.html': '9b65f73c9bc9fa99',
  'tools/date-calculator.html': '0c40981e8360a13a',
  'tools/gst.html': '274ffc9743f3e608',
  'tools/mortgage.html': '16aa3be30c6ea444',
  'tools/offset.html': '92040932a1d75916',
  'tools/percentage.html': 'd56c4a53d7f711ce',
  'tools/rental-yield.html': '9822000028513771',
  'tools/stamp-duty-nsw.html': '97e455792f5196b2',
  'tools/stamp-duty-vic.html': '460425f4889df896',
  'tools/stamp-duty-qld.html': '01c55e17dff09e72',
  'tools/stamp-duty-wa.html': 'eabb9cd2b5dcaba7',
  'tools/stamp-duty-sa.html': '2f624d5fad7e21c8',
  'tools/stamp-duty-tas.html': '8e6af49e31d9aa06',
  'tools/stamp-duty-act.html': '6236f9eb77b009a8',
  'tools/stamp-duty-nt.html': '0ec85d27ce71d07b',
  'tools/stamp-duty.html': '18c1fc330aca30fe',
  'tools/stopwatch.html': '6b11f6628320dcd9',
  'tools/take-home-pay.html': '04b5afe67dcb6022',
  'tools/timer.html': '47712ae26a5a8c72',
  'tools/unit-converter.html': '86ceb2d6c987587c',
  'tools/world-clock.html': '135fcc02e1f40326',
  'js/pages/guide.js': 'bdffef8c7809734a',
  'guides/index.html': 'bf98fd6b029b9a8f',
  'guides/rate-rise-november-2026.html': '743510f0ecf480d1',
  'guides/capital-gains-tax-2027.html': 'b3d01c64b8e48afa',
  'guides/negative-gearing-2027.html': '84096809ae7df979',
  'guides/tax-cut-2026-27.html': 'fe7d79b1b46b788c',
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

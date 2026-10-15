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
const VERSION = 'v48';
const CACHE = `sortedmate-${VERSION}`;
const NETWORK_TIMEOUT_MS = 4000;
// Each version's cache also holds the HASHES it was built from, under this key.
const HASH_KEY = 'sw-hashes.json';
const FILES = [
  './',
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
  'tools/stamp-duty.html',
  'tools/stopwatch.html',
  'tools/take-home-pay.html',
  'tools/timer.html',
  'tools/unit-converter.html',
  'tools/world-clock.html',
];

// hashes:start (written by scripts/sw-hashes.mjs: don't edit by hand)
const HASHES = {
  './': 'a3193f42683eda5d',
  '404.html': '3b06049131abe280',
  'css/style.css': 'c89ce453b0f6c630',
  'tools/upfront-costs.html': '1fe8300bd4bf6f3a',
  'tools/lmi.html': '72a37a101c0e0a8e',
  'js/pages/upfront-costs.js': '605f91de49f15a12',
  'js/pages/lmi.js': '610211673a05c0d5',
  'js/upfront.js': '73abd461f450a1d0',
  'js/lmi.js': 'ca8a492ea8898ef9',
  'js/pages/budget.js': '831670c69006e443',
  'js/pages/retirement.js': '99b329883b02cf1f',
  'js/budget.js': '8dcef1ae001d588d',
  'js/retirement.js': 'e2b3a634539fe0ae',
  'tools/budget.html': '483e23d2d235e8d1',
  'tools/retirement.html': 'f59dcb4fb98b650b',
  'js/pages/rent-vs-buy.js': '0ebbbba0e0d39d5c',
  'js/pages/tax-refund.js': '8236aecff05422de',
  'js/rentbuy.js': 'c389bfa04e175e66',
  'js/refund.js': '707b0af2be637097',
  'tools/rent-vs-buy.html': '886c93adef25e97a',
  'tools/tax-refund.html': '2963d176bafb8062',
  'tools/balance-transfer.html': '15b1d1ecc9e22ba8',
  'tools/term-deposit.html': 'c97fa9bfd4912919',
  'tools/refinance.html': '9caff4a297a00e1a',
  'js/pages/balance-transfer.js': 'a83806c5c3c480de',
  'js/pages/term-deposit.js': 'b5dfab2d32d1ec26',
  'js/pages/refinance.js': '5751a61c9628725e',
  'js/balance-transfer.js': 'e7b9836f0590b16c',
  'js/term-deposit.js': '3ef0d3cf5795b531',
  'js/refinance.js': '4e0d44b282ef46ed',
  'tools/rental-cashflow.html': '0db257190bb95315',
  'js/pages/rental-cashflow.js': '37c0a36b98c83fc0',
  'js/rental.js': '0e4ccec12c46ee15',
  'tools/borrowing-power.html': '45f6edcecc8655ef',
  'tools/inflation.html': '435043af4bc510c3',
  'js/pages/borrowing-power.js': '064b68613b8d2f27',
  'js/pages/inflation.js': '56f9647b0c8fa5cc',
  'js/borrowing.js': 'f21f0e8cfd098da9',
  'js/inflation.js': '7ff1caedb42a41e6',
  'js/cpi-data.js': '32fdcfe77cb6e113',
  'js/chart.js': 'a3dab35ca256e7f8',
  'js/aussie.js': '0fc6e377f2217e89',
  'js/format.js': '60fd3bc6cbd9acc9',
  'tools/car-stamp-duty.html': 'c93f4b5b6ddddb48',
  'js/pages/car-stamp-duty.js': '20a270a88a631e97',
  'js/motor-duty.js': '9a30f7ba5cf3a291',
  'tools/medicare-levy-surcharge.html': '5e3e7057e841d5c8',
  'tools/super.html': 'b01f0401232edcc8',
  'js/pages/medicare-levy-surcharge.js': '8142605060100729',
  'js/pages/super.js': '99afc0e9752b9bbb',
  'js/mls.js': '07db9fa825ba6310',
  'js/super.js': '7905eecbe1b9a884',
  'tools/savings-goal.html': '8054ca22c14f4211',
  'tools/credit-card.html': '6dd0be5fbec5c80f',
  'tools/personal-loan.html': '38bd2a7e05af8a64',
  'js/pages/savings-goal.js': 'c87bbeb2410f21c3',
  'js/pages/credit-card.js': '70238b2cb54face1',
  'js/pages/personal-loan.js': 'f5e08baf28802d6f',
  'js/loans.js': '3718099c698b7ab5',
  'js/pages/work-deductions.js': 'f99689df032a4023',
  'js/deductions.js': 'e29892f8403fa769',
  'tools/work-deductions.html': 'f2d8cbcb761f069b',
  'js/pages/hecs-help.js': '6360a3117bdec84d',
  'js/pages/gross-up.js': 'e6840ca47bcee366',
  'js/hecs.js': 'e203acd7f256ce7c',
  'js/grossup.js': '57af1d271d096f44',
  'tools/hecs-help.html': 'da8e73401ae32065',
  'tools/gross-up.html': '28ced5edfc9a50eb',
  'tools/capital-gains-tax.html': 'd2599455b5f4ad8a',
  'js/pages/capital-gains-tax.js': '569856b2d357227c',
  'js/cgt.js': 'd3677db85c32d4f0',
  'fonts/instrument-sans.woff2': '2ee17598a98d8a59',
  'img/icon.svg': '2411553927ad6b14',
  'index.html': 'a3193f42683eda5d',
  'js/ads.js': 'f3e6055d5e0d8f2a',
  'js/calc.js': 'e6fc3cde7d502ae4',
  'js/rates.js': '51eca1accbc9a681',
  'js/config.js': 'f6530f2644cdf4cb',
  'js/duty.js': '511bfb98a0177d63',
  'js/icons.js': 'eac24fd4bc3a9d18',
  'js/layout.js': 'dace91d06fe1b931',
  'js/pages/calculator.js': '4b0a93b681632315',
  'js/pages/compound-interest.js': 'd92285fec769d950',
  'js/pages/date-calculator.js': '6728f8569d2b697f',
  'js/pages/gst.js': '3f117f9b75185e6b',
  'js/pages/home.js': 'b16721a1ae59d254',
  'js/pages/mortgage.js': '006682ff0ff2cfbe',
  'js/pages/offset.js': '358de09ba88ea789',
  'js/pages/percentage.js': '9ae086464f83548e',
  'js/pages/privacy.js': '962897a3db0a6419',
  'js/pages/rental-yield.js': '26c0ecc570950bc2',
  'js/pages/stamp-duty-nsw.js': 'af11c8f1ab717431',
  'js/pages/stamp-duty.js': '9351cc6d23446360',
  'js/pages/stopwatch.js': '94b9810dc7ee2782',
  'js/pages/take-home-pay.js': '1c76b0217d51eec7',
  'js/pages/timer.js': '1c7d873440292157',
  'js/pages/unit-converter.js': 'f3baedb421204958',
  'js/pages/world-clock.js': 'b82c395f8cf09da9',
  'js/tools.js': 'eb71b5bf5c82b29f',
  'manifest.webmanifest': 'fff29e3b8055e671',
  'privacy.html': '476ce67929948d5f',
  'about.html': '7fb806cf3e07da3b',
  'tools/calculator.html': 'c0414655aed66071',
  'tools/compound-interest.html': '63b1a3e47c29eb10',
  'tools/date-calculator.html': '1f6f3eca7bc87030',
  'tools/gst.html': '7922d027bf1998ba',
  'tools/mortgage.html': '0282a8dc848a731f',
  'tools/offset.html': '4267c2d031e5fbab',
  'tools/percentage.html': 'fe9764ca2971c5f8',
  'tools/rental-yield.html': 'f41fc5954a149c62',
  'tools/stamp-duty-nsw.html': '1fee40b333b81a33',
  'tools/stamp-duty-vic.html': '7e73de5efa10106c',
  'tools/stamp-duty-qld.html': '04e2703c92c35f72',
  'tools/stamp-duty-wa.html': '8ad2433d45a0b2f8',
  'tools/stamp-duty.html': 'b4deda028198e937',
  'tools/stopwatch.html': 'c56f3ae69583b1d3',
  'tools/take-home-pay.html': '528e98b877212efb',
  'tools/timer.html': 'd93fa3c97cab28eb',
  'tools/unit-converter.html': 'eadd82c2ba819285',
  'tools/world-clock.html': 'b7a7657c7f218b4b',
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
      if (!key.startsWith('sortedmate-') || key === CACHE) continue;
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
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('sortedmate-') && k !== CACHE).map((k) => caches.delete(k)))),
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

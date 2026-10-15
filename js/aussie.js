// "In Aussie terms": puts a dollar result next to familiar Australian yardsticks, with a comparison graphic.
// Every benchmark is sourced and dated. status: 'verified' = official/primary source; 'estimated' = industry source.
// Update these when the sources publish new figures (see README, "Rates to update").
export const BENCH = {
  minWage: { value: 26.44, label: 'National minimum wage, per hour', date: '1 Jul 2026', status: 'verified', source: 'Fair Work Commission', url: 'https://www.fairwork.gov.au/pay-and-wages/minimum-wages' },
  weeklyPay: { value: 2083.70, label: 'Average full-time weekly earnings', date: 'May 2026', status: 'verified', source: 'ABS Average Weekly Earnings', url: 'https://www.abs.gov.au/statistics/labour/earnings-and-working-conditions/average-weekly-earnings-australia/latest-release' },
  rent: { value: 713, label: 'National median weekly rent', date: 'Sep qtr 2026', status: 'estimated', source: 'Cotality', url: 'https://www.cotality.com/au/insights/articles/rental-growth-loses-momentum-as-vacancy-rates-rise' },
  home: { value: 899236, label: 'National median dwelling value', date: '30 Sep 2026', status: 'estimated', source: 'Cotality Home Value Index', url: 'https://discover.cotality.com/hubfs/Article-Reports/COTALITY%20HVI%20OCT%202026%20FINAL.pdf' },
  savings: { value: 47487, label: 'Average Australian savings balance', date: 'Aug 2026', status: 'estimated', source: 'Finder Consumer Sentiment Tracker', url: 'https://www.finder.com.au/news/savings-divide-2026' },
  rav4: { value: 45990, label: 'Toyota RAV4 GX hybrid, before on-roads', date: '2026', status: 'estimated', source: 'Toyota list price via CarExpert', url: 'https://www.carexpert.com.au/car-news/2026-toyota-rav4-price-and-specs' },
  footy: { value: 27, label: 'AFL adult general admission', date: '2026 season', status: 'verified', source: 'AFL', url: 'https://www.afl.com.au/news/1464336/price-freeze-on-general-admission-tickets-at-mcg-and-marvel-stadium-as-tickets-go-on-sale-for-the-2026-toyota-afl-premiership-season' },
  snag: { value: 3.50, label: 'Bunnings sausage sizzle', date: '2026', status: 'estimated', source: 'Bunnings price, as reported by Yahoo News', url: 'https://au.news.yahoo.com/bunnings-forced-to-hike-price-of-sausage-sizzle-for-first-time-in-15-years-015139047.html' },
};
// Counts for "one dollar for every …" comparisons, smallest to largest.
export const COUNTS = [
  { value: 12000, kind: 'beach', text: 'roughly 12,000 beaches on Australia’s coastline', status: 'estimated', source: 'Surf Life Saving Australia', url: 'https://sls.com.au/surf-life-saving-australia-release-coastal-safety-brief-on-beaches' },
  { value: 50000, kind: 'people', text: 'people on Bondi Beach on a busy summer day', status: 'verified', source: 'Waverley Council', url: 'https://www.waverley.nsw.gov.au/recreation/beaches_and_coast/our_beaches' },
  { value: 100024, kind: 'people', text: 'people at a sold-out MCG', status: 'verified', source: 'Melbourne Cricket Club', url: 'https://www.mcg.org.au/plan-a-visit/seating-and-ticket-information/ticket-information' },
  { value: 274000, kind: 'koala', text: 'koalas in New South Wales', status: 'verified', source: 'NSW Government koala baseline survey, 2025', url: 'https://www.environment.nsw.gov.au/topics/animals-and-plants/threatened-species/programs-legislation-and-framework/nsw-koala-strategy/building-our-knowledge-about-koalas/baseline-survey' },
  { value: 580700, kind: 'people', text: 'people living in Tasmania', status: 'verified', source: 'ABS, 31 Mar 2026', url: 'https://www.abs.gov.au/statistics/people/population/national-state-and-territory-population/latest-release' },
  { value: 2230500, kind: 'roo', text: 'kangaroos in Victoria’s harvest zones', status: 'verified', source: 'DCCEEW, 2023 survey', url: 'https://www.dcceew.gov.au/sites/default/files/documents/kangaroo-statistics-states-2024.pdf' },
  { value: 9634900, kind: 'roo', text: 'kangaroos in NSW’s harvest zones', status: 'verified', source: 'DCCEEW, 2023 survey', url: 'https://www.dcceew.gov.au/sites/default/files/documents/kangaroo-statistics-states-2024.pdf' },
  { value: 17727700, kind: 'roo', text: 'kangaroos in Queensland’s harvest zones', status: 'verified', source: 'DCCEEW, 2023 survey', url: 'https://www.dcceew.gov.au/sites/default/files/documents/kangaroo-statistics-states-2024.pdf' },
];

// Formatters made once: the card redraws on every keystroke.
const F0 = new Intl.NumberFormat('en-AU', { maximumFractionDigits: 0 });
const F1 = new Intl.NumberFormat('en-AU', { maximumFractionDigits: 1 });
const FMONEY = new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 });
const n0 = (n) => F0.format(Math.round(n));
const n1 = (n) => (n < 10 ? F1.format(n) : n0(n));
const money = (n) => FMONEY.format(n);
const unit = (n, one, many = `${one}s`) => (Math.round(n * 10) / 10 === 1 ? one : many);

// Up to four analogies, each a number and what it counts, chosen so the number reads sensibly.
export function analogies(amount) {
  const a = Math.abs(amount);
  if (!(a >= 1)) return [];
  const out = [];
  const add = (icon, key, n, what, after) => out.push({ icon, key, num: n1(n), unit: `${what} ${after}`.trim(), text: `${n1(n)} ${what} ${after}`.trim() });
  const hours = a / BENCH.minWage.value;
  if (hours > 38 * 52 * 1.5) add('clock', 'minWage', hours / (38 * 52), unit(hours / (38 * 52), 'year'), 'of full-time work at the minimum wage');
  else add('clock', 'minWage', hours, unit(hours, 'hour'), 'of work at the minimum wage');
  const weeks = (per, key, icon, after) => { const w = a / per; if (w > 104) add(icon, key, w / 52, unit(w / 52, 'year'), after); else add(icon, key, w, unit(w, 'week'), after); };
  if (a >= BENCH.weeklyPay.value / 2) weeks(BENCH.weeklyPay.value, 'weeklyPay', 'pay', 'of the average full-time pay packet');
  if (a >= BENCH.rent.value / 2) weeks(BENCH.rent.value, 'rent', 'home', 'of median rent');
  if (a >= 5000) add('ticket', 'footy', a / BENCH.footy.value, unit(a / BENCH.footy.value, 'footy ticket'), 'at the ’G (general admission)');
  else add('snag', 'snag', a / BENCH.snag.value, unit(a / BENCH.snag.value, 'Bunnings snag'), '');
  return out.slice(0, 4);
}

// One dollar per … : the count closest to the amount on a log scale.
export function countComparison(amount) {
  const a = Math.abs(amount);
  if (!(a >= 1000)) return null;
  const c = COUNTS.reduce((best, x) => (Math.abs(Math.log(a / x.value)) < Math.abs(Math.log(a / best.value)) ? x : best));
  const r = a / c.value;
  const each = { roo: 'kangaroo', koala: 'koala', beach: 'beach', people: 'person' }[c.kind];
  const head = `If every dollar were a ${each}, that’s`;
  const text = r >= 1.15 ? `${head} ${n1(r)} times the ${c.text}.` : r <= 0.87 ? `${head} ${Math.round(r * 100)}% of the ${c.text}.` : `${head} about as many as the ${c.text}.`;
  return { ...c, ratio: r, text };
}

// Benchmarks to draw next to the amount: the ones nearest in size, so the bars are readable.
export function comparisons(amount) {
  const a = Math.abs(amount);
  const list = [
    { label: 'A year of median rent', value: BENCH.rent.value * 52, key: 'rent' },
    { label: 'Average savings balance', value: BENCH.savings.value, key: 'savings' },
    { label: 'A new Toyota RAV4', value: BENCH.rav4.value, key: 'rav4' },
    { label: 'A year of average full-time pay', value: BENCH.weeklyPay.value * 52, key: 'weeklyPay' },
    { label: '20% deposit on the median home', value: BENCH.home.value * 0.2, key: 'home' },
    { label: 'The median home', value: BENCH.home.value, key: 'home' },
    { label: 'A month of median rent', value: (BENCH.rent.value * 52) / 12, key: 'rent' },
    { label: 'A week of average full-time pay', value: BENCH.weeklyPay.value, key: 'weeklyPay' },
    { label: 'A week at the minimum wage', value: BENCH.minWage.value * 38, key: 'minWage' },
    { label: 'A week of median rent', value: BENCH.rent.value, key: 'rent' },
  ];
  const near = list.map((b) => ({ ...b, d: Math.abs(Math.log(b.value / a)) })).sort((x, y) => x.d - y.d).slice(0, 3);
  return [{ label: 'Your result', value: a, you: true }, ...near].sort((x, y) => y.value - x.value);
}

// ---------- Rendering ----------
// Line icons for the tiles; filled silhouettes for the pictogram (so a filled icon reads as "counted").
const LINE = {
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  pay: '<rect x="3" y="6" width="18" height="12" rx="1.5"/><circle cx="12" cy="12" r="2.6"/>',
  home: '<path d="M4 11 12 4l8 7"/><path d="M6 9.5V20h12V9.5"/><path d="M10 20v-5h4v5"/>',
  ticket: '<path d="M4 7h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4z"/><path d="M14 7v10" stroke-dasharray="1.5 2"/>',
  snag: '<path d="M5 15c3-6 11-6 14 0"/><path d="M4.5 15.5h15"/><path d="M7 12.5c1.5-1 8.5-1 10 0"/>',
};
export const SHAPES = {
  koala: '<circle cx="6" cy="8" r="4.2"/><circle cx="18" cy="8" r="4.2"/><ellipse cx="12" cy="13.5" rx="6.6" ry="6.9"/><ellipse cx="12" cy="15" rx="1.9" ry="2.6" class="cut"/><circle cx="9" cy="11.8" r="1" class="cut"/><circle cx="15" cy="11.8" r="1" class="cut"/>',
  roo: '<path d="M16.4 2.6l.9 2.6 1.6-.9.3 2.4c.9.5 1.3 1.3 1.1 2.1l-2.3.2-1 .9c.7 2.7.1 5.3-1.6 7.4l1.7 3.4h2.6v1.1h-4.4l-1.6-2.6-2.4.9-1 1.7H6.6l.3-1.1 1.6-.6c-1.4-1.6-1.7-3.8-.7-6-1.6.6-3 1.9-4.2 3.8L2.5 18c1.3-3 3.4-5.2 6.4-6.2 1.9-2.4 4.2-3.5 6.4-3.4l.4-1.6z"/>',
  people: '<circle cx="12" cy="6" r="3.3"/><path d="M5.5 21v-4.2c0-3.3 2.9-5.6 6.5-5.6s6.5 2.3 6.5 5.6V21z"/>',
  beach: '<path d="M12 3.5c4.7 0 8.5 3.2 8.5 7.2H3.5c0-4 3.8-7.2 8.5-7.2z"/><rect x="11.2" y="10.4" width="1.6" height="9"/><path d="M3 20.5c2.2-1.3 4.4-1.3 6 0s3.8 1.3 6 0 3.8-1.3 6 0V22H3z"/>',
};
const line = (name) => `<svg class="icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${LINE[name]}</svg>`;
const est = '<abbr class="aus-est" title="estimate">est.</abbr>';
const tag = (key) => (BENCH[key].status === 'estimated' ? est : '');

// What one pictogram icon stands for: about a tenth of the benchmark, rounded to 1, 2 or 5 × a power of ten
// (the nearest on a log scale), so the key reads "Each icon is 10,000 people", not 10,002.
export function iconUnit(value) {
  const raw = value / 10;
  const p = 10 ** Math.floor(Math.log10(raw));
  return [1, 2, 5, 10].map((m) => m * p).reduce((best, x) => (Math.abs(Math.log(x / raw)) < Math.abs(Math.log(best / raw)) ? x : best));
}

// A row of up to 40 silhouettes. Outlines count out the benchmark and filled icons count out your amount,
// each icon being iconUnit() of them; the last filled icon is partly filled for the remainder.
function pictogram(c) {
  const per = iconUnit(c.value);
  const filled = Math.min((c.ratio * c.value) / per, 40);
  const shown = Math.min(40, Math.max(Math.round(c.value / per), Math.ceil(filled)));
  let icons = '';
  for (let i = 0; i < shown; i++) {
    const f = Math.max(0, Math.min(1, filled - i));
    icons += `<svg class="aus-pic" viewBox="0 0 24 24" aria-hidden="true"><g class="aus-pic-empty">${SHAPES[c.kind]}</g>${f > 0 ? `<g class="aus-pic-full" style="clip-path: inset(0 ${((1 - f) * 100).toFixed(0)}% 0 0)">${SHAPES[c.kind]}</g>` : ''}</svg>`;
  }
  const what = { roo: 'kangaroos', koala: 'koalas', beach: 'beaches', people: 'people' }[c.kind];
  return `<div class="aus-pics" aria-hidden="true">${icons}</div>
    <p class="aus-pic-key"><span class="aus-pic-swatch"></span>Each icon is ${n0(per)} ${what}.${(c.ratio * c.value) / per > 40 ? ` Showing the first 40 of ${n0((c.ratio * c.value) / per)}.` : ''}</p>`;
}

// Below $50 the yardsticks are all fractions, and past $10 billion they stop meaning anything.
export const MIN_AMOUNT = 50;
export const MAX_AMOUNT = 1e10;

function render(card, amount, what) {
  const list = Math.abs(amount) >= MIN_AMOUNT && Math.abs(amount) <= MAX_AMOUNT ? analogies(amount) : [];
  if (!list.length) { card.hidden = true; return; }
  card.hidden = false;
  const count = countComparison(amount);
  const bars = comparisons(amount);
  const max = Math.max(...bars.map((b) => b.value));
  card.querySelector('.aus-amount').textContent = money(Math.abs(amount));
  card.querySelector('.aus-what').textContent = what ? ` (${what[0].toLowerCase()}${what.slice(1)})` : '';
  card.querySelector('.aus-tiles').innerHTML = list.map((x) => `<li class="aus-tile">${line(x.icon)}<span class="aus-num">${x.num}</span><span class="aus-unit">${x.unit} ${tag(x.key)}</span></li>`).join('');
  const pic = card.querySelector('.aus-count');
  pic.hidden = !count;
  if (count) pic.innerHTML = `<p class="aus-count-text">${count.text}${count.status === 'estimated' ? ` ${est}` : ''}</p>${pictogram(count)}`;
  card.querySelector('.aus-bars').innerHTML = bars.map((b) => `<li class="${b.you ? 'is-you' : ''}"><span class="aus-bar-label">${b.label}${b.key && BENCH[b.key].status === 'estimated' ? ` ${est}` : ''}</span><span class="aus-bar-track"><span class="aus-bar" style="width:${Math.max(1.5, (b.value / max) * 100).toFixed(1)}%"></span></span><span class="aus-bar-value">${money(b.value)}</span></li>`).join('');
}

const SOURCES = () => [...Object.values(BENCH), ...COUNTS.filter((c, i, all) => all.findIndex((x) => x.url === c.url) === i)]
  .map((b) => `<li><a href="${b.url}" target="_blank" rel="noopener noreferrer">${b.source}</a>: ${b.label || b.text}${b.label ? ` ${b.value >= 100 ? money(b.value) : `$${b.value.toFixed(2)}`}` : ` (${n0(b.value)})`}${b.date ? `, ${b.date}` : ''} <em>${b.status}</em></li>`).join('');

// Watches the page's main dollar result and keeps the card in step with it.
export function mountAussieTerms() {
  // A page can mark the figure to translate with data-aussie; otherwise it's the headline result.
  const out = document.querySelector('[data-aussie]') || document.querySelector('.readout .result-big');
  const cols = document.querySelector('.cols');
  // scripts/content.py writes an empty .aus-slot (with its height held in CSS) on the pages that get the
  // card, so drawing it doesn't push the explainer down. Pages without a slot (the GST tool) don't get one.
  const slot = document.querySelector('.aus-slot');
  if (!out || !cols || !slot) return;
  const card = document.createElement('section');
  card.className = 'card aus-card';
  card.setAttribute('aria-labelledby', 'aus-title');
  card.hidden = true;
  card.innerHTML = `
    <h2 class="section-title" id="aus-title">In Aussie terms: <span class="aus-amount"></span><span class="aus-what"></span> is about</h2>
    <ul class="aus-tiles"></ul>
    <details class="aus-more"><summary>More comparisons</summary>
      <div class="aus-grid">
        <div class="aus-count"></div>
        <div><h3 class="aus-sub">How it stacks up</h3><ul class="aus-bars"></ul></div>
      </div>
    </details>
    <p class="aus-key">${est} marks an industry figure rather than an official statistic.</p>
    <details class="aus-sources"><summary>Where these numbers come from</summary><ul>${SOURCES()}</ul><p>“est.” marks industry figures rather than official statistics.</p></details>`;
  // Phones show just the tiles, with the pictogram and bars a tap away; wider screens show everything
  // (style.css hides the summary there).
  const wide = matchMedia('(min-width: 641px)');
  const more = card.querySelector('.aus-more');
  more.open = wide.matches;
  wide.addEventListener('change', () => { more.open = wide.matches; });
  slot.append(card);
  const read = () => {
    const t = out.textContent.trim();
    const m = t.match(/^(−|-)?\$([\d,]+(?:\.\d+)?)/);
    if (!m) { card.hidden = true; return; }
    // What the figure is, from its row label or the result heading (e.g. "Total interest").
    const label = (out.closest('.kv')?.firstElementChild ?? out.closest('.readout')?.firstElementChild)?.textContent.trim();
    render(card, parseFloat(m[2].replace(/,/g, '')), label && label.length < 48 ? label : '');
  };
  new MutationObserver(read).observe(out, { childList: true, characterData: true, subtree: true });
  read();
}

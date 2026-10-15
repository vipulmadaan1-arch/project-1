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
  { value: 12000, text: 'roughly 12,000 beaches on Australia’s coastline', status: 'estimated', source: 'Surf Life Saving Australia', url: 'https://sls.com.au/surf-life-saving-australia-release-coastal-safety-brief-on-beaches' },
  { value: 50000, text: 'people on Bondi Beach on a busy summer day', status: 'verified', source: 'Waverley Council', url: 'https://www.waverley.nsw.gov.au/recreation/beaches_and_coast/our_beaches' },
  { value: 100024, text: 'people at a sold-out MCG', status: 'verified', source: 'Melbourne Cricket Club', url: 'https://www.mcg.org.au/plan-a-visit/seating-and-ticket-information/ticket-information' },
  { value: 580700, text: 'people living in Tasmania', status: 'verified', source: 'ABS, 31 Mar 2026', url: 'https://www.abs.gov.au/statistics/people/population/national-state-and-territory-population/latest-release' },
  { value: 2230500, text: 'kangaroos in Victoria’s harvest zones', status: 'verified', source: 'DCCEEW, 2023 survey', url: 'https://www.dcceew.gov.au/sites/default/files/documents/kangaroo-statistics-states-2024.pdf' },
  { value: 9634900, text: 'kangaroos in NSW’s harvest zones', status: 'verified', source: 'DCCEEW, 2023 survey', url: 'https://www.dcceew.gov.au/sites/default/files/documents/kangaroo-statistics-states-2024.pdf' },
  { value: 17727700, text: 'kangaroos in Queensland’s harvest zones', status: 'verified', source: 'DCCEEW, 2023 survey', url: 'https://www.dcceew.gov.au/sites/default/files/documents/kangaroo-statistics-states-2024.pdf' },
];

const n0 = (n) => Math.round(n).toLocaleString('en-AU');
const n1 = (n) => (n < 10 ? n.toLocaleString('en-AU', { maximumFractionDigits: 1 }) : n0(n));
const money = (n) => n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 });
const plural = (n, one, many = `${one}s`) => `${n1(n)} ${Math.round(n * 10) / 10 === 1 ? one : many}`;

// Up to four analogies, chosen so each reads as a sensible number for this amount.
export function analogies(amount) {
  const a = Math.abs(amount);
  if (!(a >= 1)) return [];
  const out = [];
  const hours = a / BENCH.minWage.value;
  out.push({ icon: 'clock', key: 'minWage', text: hours > 38 * 52 * 1.5 ? `${plural(hours / (38 * 52), 'year')} of full-time work at the minimum wage` : `${plural(hours, 'hour')} of work at the minimum wage` });
  const weeks = (per) => { const w = a / per; return w > 104 ? plural(w / 52, 'year') : plural(w, 'week'); };
  if (a >= BENCH.weeklyPay.value / 2) out.push({ icon: 'pay', key: 'weeklyPay', text: `${weeks(BENCH.weeklyPay.value)} of the average full-time pay packet` });
  if (a >= BENCH.rent.value / 2) out.push({ icon: 'home', key: 'rent', text: `${weeks(BENCH.rent.value)} of median rent` });
  if (a >= 5000) out.push({ icon: 'ticket', key: 'footy', text: `${plural(a / BENCH.footy.value, 'footy ticket')} at the ’G (general admission)` });
  else out.push({ icon: 'snag', key: 'snag', text: `${plural(a / BENCH.snag.value, 'Bunnings snag')}` });
  return out.slice(0, 4);
}

// One dollar per … : the count closest to the amount on a log scale.
export function countComparison(amount) {
  const a = Math.abs(amount);
  if (!(a >= 1000)) return null;
  const c = COUNTS.reduce((best, x) => (Math.abs(Math.log(a / x.value)) < Math.abs(Math.log(a / best.value)) ? x : best));
  const r = a / c.value;
  const text = r >= 1.15
    ? `If every dollar were a person or a roo, that’s ${n1(r)} times the ${c.text}.`
    : r <= 0.87
      ? `If every dollar were a person or a roo, that’s ${Math.round(r * 100)}% of the ${c.text}.`
      : `If every dollar were a person or a roo, that’s about as many as the ${c.text}.`;
  return { ...c, ratio: r, text: text.replace('a person or a roo', c.text.includes('kangaroo') ? 'a kangaroo' : c.text.includes('beach') ? 'a beach' : 'a person') };
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
const ICONS = {
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  pay: '<rect x="3" y="6" width="18" height="12" rx="1.5"/><circle cx="12" cy="12" r="2.6"/>',
  home: '<path d="M4 11 12 4l8 7"/><path d="M6 9.5V20h12V9.5"/><path d="M10 20v-5h4v5"/>',
  ticket: '<path d="M4 7h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4z"/><path d="M14 7v10" stroke-dasharray="1.5 2"/>',
  snag: '<path d="M5 15c3-6 11-6 14 0"/><path d="M4.5 15.5h15"/><path d="M7 12.5c1.5-1 8.5-1 10 0"/>',
  people: '<circle cx="8" cy="8" r="2.5"/><circle cx="16" cy="8" r="2.5"/><path d="M3.5 18c.5-3 2.3-4.5 4.5-4.5s4 1.5 4.5 4.5M11.5 18c.5-3 2.3-4.5 4.5-4.5s4 1.5 4.5 4.5"/>',
  wave: '<path d="M3 15c2 0 2-1.5 4.5-1.5S10 15 12 15s2.5-1.5 4.5-1.5S19 15 21 15"/><path d="M3 19c2 0 2-1.5 4.5-1.5S10 19 12 19s2.5-1.5 4.5-1.5S19 19 21 19"/><circle cx="16" cy="7" r="2.5"/>',
  roo: '<path d="M6 19c1-3 3-5 6-5 2 0 3-1 3.5-3L17 6l1.5 1L19 5"/><path d="M12 14l-1 5M15 13l3 6h2"/><path d="M5 12c2 0 4 1 5 2"/>',
};
const svg = (name) => `<svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
const tag = (key) => (BENCH[key].status === 'estimated' ? '<span class="aus-est" title="Estimated: industry source">est.</span>' : '');

function render(card, amount, what) {
  const list = analogies(amount);
  if (!list.length) { card.hidden = true; return; }
  card.hidden = false;
  const count = countComparison(amount);
  const bars = comparisons(amount);
  const max = Math.max(...bars.map((b) => b.value));
  card.querySelector('.aus-amount').textContent = money(Math.abs(amount));
  card.querySelector('.aus-what').textContent = what ? ` (${what[0].toLowerCase()}${what.slice(1)})` : '';
  card.querySelector('.aus-list').innerHTML = list.map((x) => `<li>${svg(x.icon)}<span>${x.text} ${tag(x.key)}</span></li>`).join('')
    + (count ? `<li class="aus-count">${svg(count.text.includes('kangaroo') ? 'roo' : count.text.includes('beach') ? 'wave' : 'people')}<span>${count.text}${count.status === 'estimated' ? ' <span class="aus-est">est.</span>' : ''}</span></li>` : '');
  card.querySelector('.aus-bars').innerHTML = bars.map((b) => `<li class="${b.you ? 'is-you' : ''}"><span class="aus-bar-label">${b.label}${b.key && BENCH[b.key].status === 'estimated' ? ' <span class="aus-est">est.</span>' : ''}</span><span class="aus-bar-track"><span class="aus-bar" style="width:${Math.max(1.5, (b.value / max) * 100).toFixed(1)}%"></span></span><span class="aus-bar-value">${money(b.value)}</span></li>`).join('');
}

const SOURCES = () => [...Object.values(BENCH), ...COUNTS.filter((c, i, all) => all.findIndex((x) => x.url === c.url) === i)]
  .map((b) => `<li><a href="${b.url}" target="_blank" rel="noopener noreferrer">${b.source}</a>: ${b.label || b.text}${b.value >= 1000 && !b.label ? ` (${n0(b.value)})` : b.label ? ` ${b.value >= 100 ? money(b.value) : `$${b.value.toFixed(2)}`}` : ''}${b.date ? `, ${b.date}` : ''} <em>${b.status}</em></li>`).join('');

// Watches the page's main dollar result and keeps the card in step with it.
export function mountAussieTerms() {
  // A page can mark the figure to translate with data-aussie; otherwise it's the headline result.
  const out = document.querySelector('[data-aussie]') || document.querySelector('.readout .result-big');
  const cols = document.querySelector('.cols');
  if (!out || !cols) return;
  const card = document.createElement('section');
  card.className = 'card aus-card';
  card.setAttribute('aria-labelledby', 'aus-title');
  card.hidden = true;
  card.innerHTML = `
    <h2 class="section-title" id="aus-title">In Aussie terms: <span class="aus-amount"></span><span class="aus-what"></span> is about</h2>
    <div class="aus-grid">
      <ul class="aus-list"></ul>
      <div><h3 class="aus-sub">How it stacks up</h3><ul class="aus-bars"></ul></div>
    </div>
    <details class="aus-sources"><summary>Where these numbers come from</summary><ul>${SOURCES()}</ul><p>“est.” marks industry figures rather than official statistics.</p></details>`;
  cols.after(card);
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

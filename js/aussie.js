// "In Aussie terms": puts a dollar result next to familiar Australian yardsticks.
// Every benchmark is sourced and dated. status: 'verified' = official/primary source; 'estimated' = industry source.
// Update these when the sources publish new figures (see README, "Rates to update").
export const BENCH = {
  minWage: { value: 26.44, label: 'National minimum wage, per hour', date: '1 Jul 2026', status: 'verified', source: 'Fair Work Commission', url: 'https://www.fairwork.gov.au/pay-and-wages/minimum-wages' },
  weeklyPay: { value: 2083.70, label: 'Average full-time weekly earnings', date: 'May 2026', status: 'verified', source: 'ABS Average Weekly Earnings', url: 'https://www.abs.gov.au/statistics/labour/earnings-and-working-conditions/average-weekly-earnings-australia/latest-release' },
  rent: { value: 713, label: 'National median weekly rent', date: 'Sep qtr 2026', status: 'estimated', source: 'Cotality', url: 'https://www.cotality.com/au/insights/articles/rental-growth-loses-momentum-as-vacancy-rates-rise' },
  home: { value: 884855, label: 'National median dwelling value', date: '31 Oct 2026', status: 'estimated', source: 'Cotality Home Value Index', url: 'https://discover.cotality.com/hubfs/COTALITY%20HVI%20NOV%202026%20FINAL.pdf' },
  savings: { value: 47487, label: 'Average Australian savings balance', date: 'Aug 2026', status: 'estimated', source: 'Finder Consumer Sentiment Tracker', url: 'https://www.finder.com.au/news/savings-divide-2026' },
  rav4: { value: 45990, label: 'Toyota RAV4 GX hybrid, before on-roads', date: '2026', status: 'estimated', source: 'Toyota list price via CarExpert', url: 'https://www.carexpert.com.au/car-news/2026-toyota-rav4-price-and-specs' },
  footy: { value: 27, label: 'AFL adult general admission', date: '2026 season', status: 'verified', source: 'AFL', url: 'https://www.afl.com.au/news/1464336/price-freeze-on-general-admission-tickets-at-mcg-and-marvel-stadium-as-tickets-go-on-sale-for-the-2026-toyota-afl-premiership-season' },
};

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
  add('ticket', 'footy', a / BENCH.footy.value, unit(a / BENCH.footy.value, 'footy ticket'), 'at the ’G (general admission)');
  return out.slice(0, 4);
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
// Line icons for the tiles.
const LINE = {
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  pay: '<rect x="3" y="6" width="18" height="12" rx="1.5"/><circle cx="12" cy="12" r="2.6"/>',
  home: '<path d="M4 11 12 4l8 7"/><path d="M6 9.5V20h12V9.5"/><path d="M10 20v-5h4v5"/>',
  ticket: '<path d="M4 7h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4z"/><path d="M14 7v10" stroke-dasharray="1.5 2"/>',
};
const line = (name) => `<svg class="icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${LINE[name]}</svg>`;
const est = '<abbr class="aus-est" title="estimate">est.</abbr>';
const tag = (key) => (BENCH[key].status === 'estimated' ? est : '');

// Below $50 the yardsticks are all fractions, and past $10 billion they stop meaning anything.
export const MIN_AMOUNT = 50;
export const MAX_AMOUNT = 1e10;

function render(card, amount, what) {
  const list = Math.abs(amount) >= MIN_AMOUNT && Math.abs(amount) <= MAX_AMOUNT ? analogies(amount) : [];
  if (!list.length) { card.hidden = true; return; }
  card.hidden = false;
  const bars = comparisons(amount);
  const max = Math.max(...bars.map((b) => b.value));
  card.querySelector('.aus-amount').textContent = money(Math.abs(amount));
  card.querySelector('.aus-what').textContent = what ? ` (${what[0].toLowerCase()}${what.slice(1)})` : '';
  card.querySelector('.aus-tiles').innerHTML = list.map((x) => `<li class="aus-tile">${line(x.icon)}<span class="aus-num">${x.num}</span><span class="aus-unit">${x.unit} ${tag(x.key)}</span></li>`).join('');
  card.querySelector('.aus-bars').innerHTML = bars.map((b) => `<li class="${b.you ? 'is-you' : ''}"><span class="aus-bar-label">${b.label}${b.key && BENCH[b.key].status === 'estimated' ? ` ${est}` : ''}</span><span class="aus-bar-track"><span class="aus-bar" style="width:${Math.max(1.5, (b.value / max) * 100).toFixed(1)}%"></span></span><span class="aus-bar-value">${money(b.value)}</span></li>`).join('');
}

const SOURCES = () => Object.values(BENCH)
  .map((b) => `<li><a href="${b.url}" target="_blank" rel="noopener noreferrer">${b.source}</a>: ${b.label} ${b.value >= 100 ? money(b.value) : `$${b.value.toFixed(2)}`}, ${b.date} <em>${b.status}</em></li>`).join('');

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
      <h3 class="aus-sub">How it stacks up</h3><ul class="aus-bars"></ul>
    </details>
    <p class="aus-key">${est} marks an industry figure rather than an official statistic.</p>
    <details class="aus-sources"><summary>Where these numbers come from</summary><ul>${SOURCES()}</ul><p>“est.” marks industry figures rather than official statistics.</p></details>`;
  // Phones show just the tiles, with the bars a tap away; wider screens show everything
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

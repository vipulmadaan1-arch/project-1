import { safeGet, safeSet, announce } from '../layout.js';

const CITIES = [
  ['Sydney', 'Australia/Sydney'], ['Melbourne', 'Australia/Melbourne'], ['Brisbane', 'Australia/Brisbane'],
  ['Adelaide', 'Australia/Adelaide'], ['Perth', 'Australia/Perth'], ['Darwin', 'Australia/Darwin'], ['Hobart', 'Australia/Hobart'],
  ['Auckland', 'Pacific/Auckland'], ['Fiji', 'Pacific/Fiji'], ['Tokyo', 'Asia/Tokyo'], ['Seoul', 'Asia/Seoul'],
  ['Shanghai', 'Asia/Shanghai'], ['Hong Kong', 'Asia/Hong_Kong'], ['Singapore', 'Asia/Singapore'], ['Manila', 'Asia/Manila'],
  ['Jakarta', 'Asia/Jakarta'], ['Bangkok', 'Asia/Bangkok'], ['Ho Chi Minh City', 'Asia/Ho_Chi_Minh'], ['Kathmandu', 'Asia/Kathmandu'],
  ['New Delhi', 'Asia/Kolkata'], ['Karachi', 'Asia/Karachi'], ['Dubai', 'Asia/Dubai'], ['Riyadh', 'Asia/Riyadh'],
  ['Istanbul', 'Europe/Istanbul'], ['Moscow', 'Europe/Moscow'], ['Athens', 'Europe/Athens'], ['Cairo', 'Africa/Cairo'],
  ['Johannesburg', 'Africa/Johannesburg'], ['Nairobi', 'Africa/Nairobi'], ['Lagos', 'Africa/Lagos'],
  ['Berlin', 'Europe/Berlin'], ['Paris', 'Europe/Paris'], ['Rome', 'Europe/Rome'], ['Madrid', 'Europe/Madrid'],
  ['Amsterdam', 'Europe/Amsterdam'], ['London', 'Europe/London'], ['Dublin', 'Europe/Dublin'], ['Reykjavik', 'Atlantic/Reykjavik'],
  ['São Paulo', 'America/Sao_Paulo'], ['Buenos Aires', 'America/Argentina/Buenos_Aires'], ['New York', 'America/New_York'],
  ['Toronto', 'America/Toronto'], ['Chicago', 'America/Chicago'], ['Mexico City', 'America/Mexico_City'],
  ['Denver', 'America/Denver'], ['Los Angeles', 'America/Los_Angeles'], ['Vancouver', 'America/Vancouver'],
  ['Anchorage', 'America/Anchorage'], ['Honolulu', 'Pacific/Honolulu'], ['UTC', 'UTC'],
];
const DEFAULT = ['Europe/London', 'America/New_York', 'Asia/Kolkata', 'Asia/Tokyo'];
const KEY = 'worldClockZones';
const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

// Saved cities can only be ones from the list above. Anything else in storage is ignored.
const KNOWN = new Set(CITIES.map((c) => c[1]));
let zones;
try {
  const saved = JSON.parse(safeGet(KEY));
  zones = Array.isArray(saved) ? [...new Set(saved.filter((z) => KNOWN.has(z)))] : DEFAULT;
} catch { zones = DEFAULT; }
const save = () => safeSet(KEY, JSON.stringify(zones));
const nameOf = (tz) => (CITIES.find((c) => c[1] === tz) || [tz.split('/').pop().replace(/_/g, ' ')])[0];
const make = (tag, className, text) => {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
};
const cityOptions = () => CITIES.map(([n, tz]) => new Option(n, tz));

const $sel = document.getElementById('zone-select');
const $clocks = document.getElementById('clocks');
$sel.replaceChildren(...cityOptions());

function offsetMinutes(tz, d) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' })
    .formatToParts(d).reduce((a, p) => ((a[p.type] = +p.value), a), {});
  return Math.round((Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute) - d.getTime()) / 60000);
}
function diffLabel(tz, d) {
  const diff = offsetMinutes(tz, d) - offsetMinutes(localZone, d);
  if (diff === 0) return 'Same as you';
  const h = Math.floor(Math.abs(diff) / 60), m = Math.abs(diff) % 60;
  return `${h}h${m ? ` ${m}m` : ''} ${diff > 0 ? 'ahead' : 'behind'}`;
}

const $at = document.getElementById('at');
const $in = document.getElementById('in-zone');
$in.replaceChildren(new Option(`Your time (${nameOf(localZone)})`, localZone), ...cityOptions());
let fixed = null; // a chosen moment, or null for live time

// Converts a wall-clock time in a given zone to an absolute Date. Around daylight saving
// changes a wall time can be skipped (clocks go forward) or happen twice (clocks go back).
// Like most calendars, a skipped time moves forward by the gap and a repeated time uses the
// first occurrence. `shift` says which happened, so the page can explain it.
function wallTimeToDate(value, tz) {
  const [date, time] = value.split('T');
  const [y, mo, da] = date.split('-').map(Number), [h, mi] = time.split(':').map(Number);
  const wall = Date.UTC(y, mo - 1, da, h, mi);
  const before = offsetMinutes(tz, new Date(wall - 86400000)), after = offsetMinutes(tz, new Date(wall + 86400000));
  const fits = [before, after].filter((o, i, a) => a.indexOf(o) === i && offsetMinutes(tz, new Date(wall - o * 60000)) === o);
  if (fits.length) {
    const t = Math.min(...fits.map((o) => wall - o * 60000));
    return { date: new Date(t), shift: fits.length > 1 ? 'repeated' : '' };
  }
  return { date: new Date(wall - before * 60000), shift: 'skipped' };
}
function setFixed() {
  const r = $at.value ? wallTimeToDate($at.value, $in.value) : null;
  fixed = r && !Number.isNaN(r.date.getTime()) ? r.date : null;
  const where = $in.options[$in.selectedIndex].text;
  const when = $at.value.replace('T', ' ');
  const shown = fixed ? fixed.toLocaleTimeString('en-AU', { timeZone: $in.value, hour: 'numeric', minute: '2-digit' }) : '';
  document.getElementById('mode-note').textContent = !fixed ? 'Showing live time.'
    : r.shift === 'skipped' ? `${when} doesn’t exist in ${where} because clocks go forward for daylight saving. Showing ${shown} instead.`
    : r.shift === 'repeated' ? `${when} happens twice in ${where} because clocks go back. Showing the first time, before the change.`
    : `Showing ${when} in ${where} across all cities.`;
  render();
}
$at.addEventListener('input', setFixed);
$in.addEventListener('input', setFixed);
document.getElementById('now').addEventListener('click', () => { $at.value = ''; setFixed(); });

// Cards are only rebuilt when the city list changes. Each second just the text updates,
// so a focused Remove button keeps its focus.
let builtFor = '';
function render() {
  const d = fixed || new Date();
  const list = [localZone, ...zones.filter((z) => z !== localZone)];
  if (list.join() !== builtFor) {
    builtFor = list.join();
    $clocks.replaceChildren(...list.map((tz) => {
      const isLocal = tz === localZone;
      const el = make('div', `card clock${isLocal ? ' local' : ''}`);
      el.dataset.tz = tz;
      el.append(
        make('div', 'city', isLocal ? `Your time · ${nameOf(tz)}` : nameOf(tz)),
        make('div', 'time'),
        make('div', 'meta'),
      );
      if (!isLocal) {
        const btn = make('button', 'remove', '✕');
        btn.type = 'button';
        btn.setAttribute('aria-label', `Remove ${nameOf(tz)}`);
        btn.dataset.tz = tz;
        el.append(btn);
      }
      return el;
    }));
  }
  for (const el of $clocks.children) {
    const tz = el.dataset.tz;
    el.querySelector('.time').textContent = d.toLocaleTimeString('en-AU', fixed ? { timeZone: tz, hour: 'numeric', minute: '2-digit' } : { timeZone: tz, hour: 'numeric', minute: '2-digit', second: '2-digit' });
    const date = d.toLocaleDateString('en-AU', { timeZone: tz, weekday: 'short', day: 'numeric', month: 'short' });
    el.querySelector('.meta').textContent = `${date} · ${tz === localZone ? 'Local' : diffLabel(tz, d)}`;
  }
}

$clocks.addEventListener('click', (e) => {
  const btn = e.target.closest('.remove');
  if (!btn) return;
  const tz = btn.dataset.tz;
  const index = [...$clocks.querySelectorAll('.remove')].indexOf(btn);
  zones = zones.filter((z) => z !== tz); save(); render();
  // Focus moves to the next Remove button, or back to the city picker when none are left.
  const rest = $clocks.querySelectorAll('.remove');
  (rest[Math.min(index, rest.length - 1)] || $sel).focus();
  announce(`${nameOf(tz)} removed`);
});
document.getElementById('add').addEventListener('click', () => {
  const tz = $sel.value;
  if (zones.includes(tz) || tz === localZone) return announce(`${nameOf(tz)} is already shown`);
  zones.push(tz); save(); render();
  announce(`${nameOf(tz)} added`);
});
render();
setInterval(() => { if (!fixed) render(); }, 1000);

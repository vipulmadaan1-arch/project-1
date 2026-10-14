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

let zones;
try { zones = JSON.parse(safeGet(KEY)) || DEFAULT; } catch { zones = DEFAULT; }
const save = () => safeSet(KEY, JSON.stringify(zones));
const nameOf = (tz) => (CITIES.find((c) => c[1] === tz) || [tz.split('/').pop().replace(/_/g, ' ')])[0];

const $sel = document.getElementById('zone-select');
const $clocks = document.getElementById('clocks');
$sel.innerHTML = CITIES.map(([n, tz]) => `<option value="${tz}">${n}</option>`).join('');

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
$in.innerHTML = `<option value="${localZone}">Your time (${nameOf(localZone)})</option>` +
  CITIES.map(([n, tz]) => `<option value="${tz}">${n}</option>`).join('');
let fixed = null; // a chosen moment, or null for live time

// Converts a wall-clock time in a given zone to an absolute Date.
function wallTimeToDate(value, tz) {
  const [date, time] = value.split('T');
  const [y, mo, da] = date.split('-').map(Number), [h, mi] = time.split(':').map(Number);
  const wall = Date.UTC(y, mo - 1, da, h, mi);
  let guess = wall - offsetMinutes(tz, new Date(wall)) * 60000;
  guess = wall - offsetMinutes(tz, new Date(guess)) * 60000;
  return new Date(guess);
}
function setFixed() {
  if (!$at.value) { fixed = null; } else { fixed = wallTimeToDate($at.value, $in.value); }
  document.getElementById('mode-note').textContent = fixed
    ? `Showing ${$at.value.replace('T', ' ')} in ${$in.options[$in.selectedIndex].text} across all cities.`
    : 'Showing live time.';
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
      const el = document.createElement('div');
      const isLocal = tz === localZone;
      el.className = `card clock${isLocal ? ' local' : ''}`;
      el.dataset.tz = tz;
      el.innerHTML = `<div class="city">${isLocal ? `Your time · ${nameOf(tz)}` : nameOf(tz)}</div>
        <div class="time"></div><div class="meta"></div>
        ${isLocal ? '' : `<button class="remove" type="button" aria-label="Remove ${nameOf(tz)}" data-tz="${tz}">✕</button>`}`;
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

import { safeGet, safeSet } from '../layout.js';

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

function render() {
  const d = new Date();
  const list = [localZone, ...zones.filter((z) => z !== localZone)];
  $clocks.replaceChildren(...list.map((tz) => {
    const el = document.createElement('div');
    const isLocal = tz === localZone;
    el.className = `card clock${isLocal ? ' local' : ''}`;
    const time = d.toLocaleTimeString('en-AU', { timeZone: tz, hour: 'numeric', minute: '2-digit', second: '2-digit' });
    const date = d.toLocaleDateString('en-AU', { timeZone: tz, weekday: 'short', day: 'numeric', month: 'short' });
    el.innerHTML = `<div class="city">${isLocal ? `Your time · ${nameOf(tz)}` : nameOf(tz)}</div>
      <div class="time">${time}</div><div class="meta">${date} · ${isLocal ? 'Local' : diffLabel(tz, d)}</div>
      ${isLocal ? '' : `<button class="remove" aria-label="Remove ${nameOf(tz)}" data-tz="${tz}">✕</button>`}`;
    return el;
  }));
}

$clocks.addEventListener('click', (e) => {
  const tz = e.target.closest('.remove')?.dataset.tz;
  if (tz) { zones = zones.filter((z) => z !== tz); save(); render(); }
});
document.getElementById('add').addEventListener('click', () => {
  if (!zones.includes($sel.value)) { zones.push($sel.value); save(); render(); }
});
render();
setInterval(render, 1000);

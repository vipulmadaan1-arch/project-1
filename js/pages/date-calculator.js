import { num, syncFormWithUrl, addResultActions } from '../layout.js';
import { daysBetween, businessDays, ymdBetween, addDays } from '../calc.js';

const $ = (id) => document.getElementById(id);
const today = new Date();
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
$('start').value = iso(today);
$('end').value = `${today.getFullYear()}-12-25`;
if ($('end').value < $('start').value) $('end').value = `${today.getFullYear() + 1}-12-25`;

const fmtDate = (s) => new Date(`${s}T00:00:00`).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

function update() {
  const a = $('start').value, b = $('end').value;
  const n = Math.trunc(num($('n')));
  $('added-label').textContent = `Start date ${n < 0 ? '−' : '+'} ${Math.abs(n)} days`;
  $('added').textContent = a ? fmtDate(addDays(a, n)) : '–';
  if (!a || !b) return;
  const d = daysBetween(a, b, { inclusive: $('incl').checked });
  const y = ymdBetween(a, b);
  $('days').textContent = `${d.toLocaleString('en-AU')} days`;
  $('ymd').textContent = [plural(y.years, 'year'), plural(y.months, 'month'), plural(y.days, 'day')].join(', ');
  $('weeks').textContent = `${Math.floor(Math.abs(d) / 7)} weeks, ${Math.abs(d) % 7} days`;
  $('biz').textContent = businessDays(a, b).toLocaleString('en-AU');
}
$('form').addEventListener('input', update);
$('form').addEventListener('submit', (e) => e.preventDefault());
update();
syncFormWithUrl($('form'), update);
addResultActions(document.querySelectorAll('.cols > .card')[1]);

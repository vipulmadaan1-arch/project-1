import { readNumber, setError, wireForm, blank, syncFormWithUrl, addResultActions } from '../layout.js';
import { daysBetween, businessDays, ymdBetween, addDays, HOLIDAY_YEARS } from '../calc.js';

const $ = (id) => document.getElementById(id);
const today = new Date();
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
$('start').value = iso(today);
$('end').value = `${today.getFullYear()}-12-25`;
if ($('end').value < $('start').value) $('end').value = `${today.getFullYear() + 1}-12-25`;

const fmtDate = (s) => new Date(`${s}T00:00:00`).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
const plural = (n, w) => `${n.toLocaleString('en-AU')} ${w}${n === 1 ? '' : 's'}`;
const MAX_DAYS = 100000;

// Date fields: an empty or half-typed date reads as ''. Only say so once you've left the field.
function readDate(el, name) {
  setError(el, !el.value && el.dataset.touched ? `Enter the ${name}, for example 25/12/2026` : '');
  return el.value || null;
}

function update() {
  const a = readDate($('start'), 'start date'), b = readDate($('end'), 'end date');
  const n = readNumber($('n'), { name: 'Days to add', unit: 'days', whole: true, min: -MAX_DAYS, max: MAX_DAYS, example: '90 or -30' });
  $('added-label').textContent = n === null ? 'Start date + days' : `Start date ${n < 0 ? '−' : '+'} ${Math.abs(n).toLocaleString('en-AU')} days`;
  const added = a && n !== null ? addDays(a, n) : '';
  $('added').textContent = /^\d{4}-/.test(added) ? fmtDate(added) : added ? 'Outside supported dates (years 1 to 9999)' : '–';
  if (!a || !b) return blank($('days'), $('ymd'), $('weeks'), $('biz'));
  const incl = $('incl').checked;
  const d = daysBetween(a, b, { inclusive: incl });
  // Including the end date adds a day to the later date, so years/months/days agrees with the day count.
  const [lo, hi] = a <= b ? [a, b] : [b, a];
  const y = ymdBetween(lo, incl ? addDays(hi, 1) : hi);
  $('days').textContent = `${plural(d, 'day')}${d < 0 ? ' (end is before start)' : ''}`;
  $('ymd').textContent = [plural(y.years, 'year'), plural(y.months, 'month'), plural(y.days, 'day')].join(', ');
  $('weeks').textContent = `${plural(Math.floor(Math.abs(d) / 7), 'week')}, ${plural(Math.abs(d) % 7, 'day')}`;
  const hol = $('hol').checked;
  const state = $('state').value;
  $('state-field').hidden = !hol;
  $('biz').textContent = businessDays(a, b, { excludeHolidays: hol, state }).toLocaleString('en-AU');
  const years = [+a.slice(0, 4), +b.slice(0, 4)];
  const outside = hol && years.some((yr) => !HOLIDAY_YEARS.includes(yr));
  $('hol-note').textContent = outside
    ? `Public holidays are only included for ${HOLIDAY_YEARS.join('–')}. Dates outside those years count weekends only.`
    : hol ? `Business days exclude weekends and ${$('state').selectedOptions[0].text} full-day public holidays for 2026–2027 (Fair Work Ombudsman). Regional and part-day holidays aren't included.` : 'Business days exclude weekends only.';
}
for (const id of ['start', 'end']) $(id).addEventListener('focusout', () => { $(id).dataset.touched = '1'; update(); });
wireForm($('form'), update);
$('form').addEventListener('change', update); // the state select and holiday tick
syncFormWithUrl($('form'), update);
addResultActions(document.querySelectorAll('.cols > .card')[1]);

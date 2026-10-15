import { fmtMoney, readNumber, wireForm, blank, syncFormWithUrl, addResultActions, setError } from '../layout.js';
import { inflate, yearByYear, cpi, quarterLabel, FIRST, LATEST } from '../inflation.js';

const $ = (id) => document.getElementById(id);
const pct = (n, dp = 1) => `${n < 0 ? '−' : ''}${Math.abs(n).toLocaleString('en-AU', { minimumFractionDigits: dp, maximumFractionDigits: dp })}%`;

// Year pickers, newest first, so the latest published quarter is close at hand.
for (const id of ['from-year', 'to-year']) {
  const sel = $(id);
  for (let y = LATEST.year; y >= FIRST.year; y--) sel.add(new Option(String(y), String(y)));
}
$('from-year').value = '2000';
$('from-q').value = '2';
$('to-year').value = String(LATEST.year);
$('to-q').value = String(LATEST.q);

const OUT = ['total', 'change', 'annual', 'from-cpi', 'to-cpi'];
const latest = quarterLabel(LATEST.year, LATEST.q);

function readQuarter(prefix) {
  const year = Number($(`${prefix}-year`).value), q = Number($(`${prefix}-q`).value);
  const ok = cpi(year, q) != null;
  setError($(`${prefix}-q`), ok ? '' : `Choose a quarter from ${quarterLabel(FIRST.year, FIRST.q)} to ${latest}. The ABS hasn't published ${quarterLabel(year, q)}.`);
  return ok ? { year, q } : null;
}

function update() {
  const amount = readNumber($('amount'), { name: 'Amount', unit: 'money', min: 0, max: 1e12 });
  const from = readQuarter('from'), to = readQuarter('to');
  const r = amount !== null && from && to ? inflate({ amount, from, to }) : null;
  if (!r) { $('note').textContent = ''; $('rows').textContent = ''; return blank(...OUT.map($)); }
  const fromLabel = quarterLabel(from.year, from.q), toLabel = quarterLabel(to.year, to.q);
  $('total-label').textContent = `${fmtMoney(amount, 2)} in ${fromLabel} is worth, in ${toLabel}`;
  $('total').textContent = fmtMoney(r.value, 2);
  $('change-label').textContent = r.totalPct >= 0 ? 'Total change in prices' : 'Total change in prices (going back in time)';
  $('change').textContent = pct(r.totalPct);
  $('annual').textContent = r.years > 0 ? pct(r.annualPct, 2) : '–';
  $('from-cpi-label').textContent = `CPI, ${fromLabel}`;
  $('from-cpi').textContent = r.fromCpi.toFixed(2);
  $('to-cpi-label').textContent = `CPI, ${toLabel}`;
  $('to-cpi').textContent = r.toCpi.toFixed(2);

  const rows = yearByYear(from, to).reverse();
  $('rows').innerHTML = rows.length
    ? rows.map((x) => `<tr><td>${quarterLabel(x.year, x.q)}</td><td>${pct(x.pct)}</td></tr>`).join('')
    : '<tr><td colspan="2">Choose quarters at least a year apart to see yearly inflation.</td></tr>';

  const later = (to.year * 4 + to.q) >= (from.year * 4 + from.q);
  const [a, b] = later ? [fromLabel, toLabel] : [toLabel, fromLabel];
  $('note').textContent = r.years > 0
    ? `Prices ${r.annualPct >= 0 ? 'rose' : 'fell'} by an average of ${pct(Math.abs(r.annualPct), 2)} a year between ${a} and ${b}, over ${r.years} years.`
      + ` Latest figure: ${latest}. The September quarter 2026 figure is due from the ABS in late October 2026.`
    : `Latest figure: ${latest}.`;
}

wireForm($('form'), update);
$('form').addEventListener('change', update); // selects
syncFormWithUrl($('form'), update);
addResultActions(document.querySelectorAll('.cols > .card')[1]);

import { fmtMoney, readNumber, wireForm, blank, syncFormWithUrl, addResultActions, todaysDollars } from '../layout.js';
import { compoundInterest } from '../calc.js';
import { stackedColumns, perFrame } from '../chart.js';

const $ = (id) => document.getElementById(id);
// The headline figures update as you type; the chart and year table follow a frame later.
const later = perFrame();
function update() {
  const principal = readNumber($('principal'), { name: 'Starting amount', unit: 'money', min: 0, max: 1e12, optional: true, example: '10,000' });
  const ratePct = readNumber($('rate'), { name: 'Interest rate', unit: 'percent', min: 0, max: 100, example: '5' });
  const years = readNumber($('years'), { name: 'Years', unit: 'years', min: 1, max: 100, example: '10' });
  const contribution = readNumber($('contrib'), { name: 'Regular deposit', unit: 'money', min: 0, max: 1e12, optional: true, example: '200' });
  if ([principal, ratePct, years, contribution].includes(null)) {
    later(null);
    $('rows').replaceChildren();
    $('chart').closest('.chart-card').hidden = true;
    todaysDollars(null, 0, { always: true });
    return blank($('balance'), $('contributed'), $('interest'));
  }
  const r = compoundInterest({
    principal, ratePct, years, compoundsPerYear: +$('comp').value, contribution, contributionsPerYear: +$('cfreq').value,
  });
  $('balance').textContent = fmtMoney(r.balance);
  // Present value of the final balance (ASIC Instrument 2026/41 s 8(1)(e)(iv)); shown for every term so the row doesn't come and go.
  todaysDollars(r.balance, years, { always: true });
  $('contributed').textContent = fmtMoney(r.contributed);
  $('interest').textContent = fmtMoney(r.interest);
  later(() => {
    $('rows').innerHTML = r.yearly.map((y) =>
      `<tr><td>${y.year}</td><td>${fmtMoney(y.contributed)}</td><td>${fmtMoney(y.interest)}</td><td>${fmtMoney(y.balance)}</td></tr>`).join('');
    $('chart').closest('.chart-card').hidden = false;
    stackedColumns($('chart'), {
      title: 'Balance by year, split into money deposited and interest earned',
      labels: r.yearly.map((y) => y.year),
      prefix: 'Year ',
      series: [{ name: 'Deposited', values: r.yearly.map((y) => y.contributed) }, { name: 'Interest', values: r.yearly.map((y) => y.interest) }],
      format: (n) => fmtMoney(n),
    });
  });
}
wireForm($('form'), update);
syncFormWithUrl($('form'), update);
addResultActions(document.querySelectorAll('.cols > .card')[1]);

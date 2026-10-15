import { fmtMoney, readNumber, wireForm, blank, syncFormWithUrl, addResultActions } from '../layout.js';
import { compoundInterest } from '../calc.js';
import { stackedColumns } from '../chart.js';

const $ = (id) => document.getElementById(id);
function update() {
  const principal = readNumber($('principal'), { name: 'Starting amount', unit: 'money', min: 0, max: 1e12, optional: true, example: '10,000' });
  const ratePct = readNumber($('rate'), { name: 'Interest rate', unit: 'percent', min: 0, max: 100, example: '5' });
  const years = readNumber($('years'), { name: 'Years', unit: 'years', min: 1, max: 100, example: '10' });
  const contribution = readNumber($('contrib'), { name: 'Regular deposit', unit: 'money', min: 0, max: 1e12, optional: true, example: '200' });
  if ([principal, ratePct, years, contribution].includes(null)) {
    $('rows').replaceChildren();
    $('chart').closest('.chart-card').hidden = true;
    return blank($('balance'), $('contributed'), $('interest'));
  }
  const r = compoundInterest({
    principal, ratePct, years, compoundsPerYear: +$('comp').value, contribution, contributionsPerYear: +$('cfreq').value,
  });
  $('balance').textContent = fmtMoney(r.balance);
  $('contributed').textContent = fmtMoney(r.contributed);
  $('interest').textContent = fmtMoney(r.interest);
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
}
wireForm($('form'), update);
syncFormWithUrl($('form'), update);
addResultActions(document.querySelectorAll('.cols > .card')[1]);

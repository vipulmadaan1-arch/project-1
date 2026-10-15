import { fmtMoney, readNumber, wireForm, blank, syncFormWithUrl, addResultActions } from '../layout.js';
import { mortgage, mortgageSchedule } from '../calc.js';
import { stackedColumns } from '../chart.js';

const $ = (id) => document.getElementById(id);
function update() {
  const freq = $('freq').value;
  $('freq-label').textContent = `${freq[0].toUpperCase()}${freq.slice(1)} repayment`;
  const principal = readNumber($('principal'), { name: 'Loan amount', unit: 'money', min: 0, max: 1e12 });
  const ratePct = readNumber($('rate'), { name: 'Interest rate', unit: 'percent', min: 0, max: 100, example: '6.25' });
  const years = readNumber($('years'), { name: 'Loan term', unit: 'years', min: 1, max: 40, example: '30' });
  if ([principal, ratePct, years].includes(null)) {
    $('chart').replaceChildren(); $('rows').replaceChildren();
    return blank($('repayment'), $('interest'), $('total'));
  }
  const r = mortgage({ principal, ratePct, years, frequency: freq });
  $('repayment').textContent = fmtMoney(r.repayment, 2);
  $('interest').textContent = fmtMoney(r.interest);
  $('total').textContent = fmtMoney(r.total);
  const rows = mortgageSchedule({ principal, ratePct, years, frequency: freq });
  stackedColumns($('chart'), {
    title: 'Repayments each year, split into principal and interest',
    labels: rows.map((y) => y.year),
    prefix: 'Year ',
    series: [{ name: 'Principal', values: rows.map((y) => y.principal) }, { name: 'Interest', values: rows.map((y) => y.interest) }],
    format: (n) => fmtMoney(n),
  });
  $('rows').innerHTML = rows.map((y) => `<tr><td>${y.year}</td><td>${fmtMoney(y.principal)}</td><td>${fmtMoney(y.interest)}</td><td>${fmtMoney(y.balance)}</td></tr>`).join('');
}
wireForm($('form'), update);
syncFormWithUrl($('form'), update);
addResultActions(document.querySelectorAll('.cols > .card')[1]);

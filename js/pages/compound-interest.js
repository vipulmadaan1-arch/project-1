import { fmtMoney, readNumber, wireForm, blank, syncFormWithUrl, addResultActions } from '../layout.js';
import { compoundInterest } from '../calc.js';

const $ = (id) => document.getElementById(id);
function update() {
  const principal = readNumber($('principal'), { name: 'Starting amount', unit: 'money', min: 0, max: 1e12, optional: true, example: '10,000' });
  const ratePct = readNumber($('rate'), { name: 'Interest rate', unit: 'percent', min: 0, max: 100, example: '5' });
  const years = readNumber($('years'), { name: 'Years', unit: 'years', min: 1, max: 100, example: '10' });
  const contribution = readNumber($('contrib'), { name: 'Regular deposit', unit: 'money', min: 0, max: 1e12, optional: true, example: '200' });
  if ([principal, ratePct, years, contribution].includes(null)) {
    $('rows').replaceChildren();
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
}
wireForm($('form'), update);
syncFormWithUrl($('form'), update);
addResultActions(document.querySelectorAll('.cols > .card')[1]);

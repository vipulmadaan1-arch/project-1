import { fmtMoney, readNumber, wireForm, blank, syncFormWithUrl, addResultActions } from '../layout.js';
import { mortgage } from '../calc.js';

const $ = (id) => document.getElementById(id);
function update() {
  const freq = $('freq').value;
  $('freq-label').textContent = `${freq[0].toUpperCase()}${freq.slice(1)} repayment`;
  const principal = readNumber($('principal'), { name: 'Loan amount', unit: 'money', min: 0, max: 1e12 });
  const ratePct = readNumber($('rate'), { name: 'Interest rate', unit: 'percent', min: 0, max: 100, example: '6.25' });
  const years = readNumber($('years'), { name: 'Loan term', unit: 'years', min: 1, max: 40, example: '30' });
  if ([principal, ratePct, years].includes(null)) return blank($('repayment'), $('interest'), $('total'));
  const r = mortgage({ principal, ratePct, years, frequency: freq });
  $('repayment').textContent = fmtMoney(r.repayment, 2);
  $('interest').textContent = fmtMoney(r.interest);
  $('total').textContent = fmtMoney(r.total);
}
wireForm($('form'), update);
syncFormWithUrl($('form'), update);
addResultActions(document.querySelectorAll('.cols > .card')[1]);

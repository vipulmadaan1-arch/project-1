import { fmtMoney, readNumber, wireForm, blank, syncFormWithUrl, addResultActions, setEnabled, nextStep } from '../layout.js';
import { nswDuty } from '../calc.js';

const $ = (id) => document.getElementById(id);
const next = nextStep();
function update() {
  const residential = $('residential').checked;
  for (const id of ['fhb', 'foreign']) setEnabled($(id), residential, 'Only for residential property. Tick “Residential property” to use this.');
  const value = readNumber($('value'), { name: 'Property value', unit: 'money', min: 0, max: 1e12 });
  if (value === null) { $('note').textContent = ''; next(null); return blank($('total'), $('duty'), $('surcharge')); }
  const r = nswDuty(value, { residential, firstHomeBuyer: $('fhb').checked, foreign: $('foreign').checked });
  $('total').textContent = fmtMoney(r.total);
  $('duty').textContent = fmtMoney(r.duty);
  $('surcharge').textContent = fmtMoney(r.surcharge);
  $('note').textContent = r.note;
  // Homes only: the upfront costs calculator has no foreign purchaser surcharge or commercial rates.
  next(value > 0 && residential && !$('foreign').checked ? { state: 'NSW', price: value, fhb: $('fhb').checked } : null);
}
wireForm($('form'), update);
syncFormWithUrl($('form'), update);
addResultActions(document.querySelectorAll('.cols > .card')[1]);

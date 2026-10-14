import { fmtMoney, readNumber, wireForm, blank, syncFormWithUrl, addResultActions } from '../layout.js';
import { nswDuty } from '../calc.js';

const $ = (id) => document.getElementById(id);
function update() {
  const residential = $('residential').checked;
  $('fhb').disabled = $('foreign').disabled = !residential;
  const value = readNumber($('value'), { name: 'Property value', unit: 'money', min: 0, max: 1e12 });
  if (value === null) { $('note').textContent = ''; return blank($('total'), $('duty'), $('surcharge')); }
  const r = nswDuty(value, { residential, firstHomeBuyer: $('fhb').checked, foreign: $('foreign').checked });
  $('total').textContent = fmtMoney(r.total);
  $('duty').textContent = fmtMoney(r.duty);
  $('surcharge').textContent = fmtMoney(r.surcharge);
  $('note').textContent = r.note;
}
wireForm($('form'), update);
syncFormWithUrl($('form'), update);
addResultActions(document.querySelectorAll('.cols > .card')[1]);

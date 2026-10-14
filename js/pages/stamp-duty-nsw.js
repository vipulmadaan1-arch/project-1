import { fmtMoney, num, syncFormWithUrl, addResultActions } from '../layout.js';
import { nswDuty } from '../calc.js';

const $ = (id) => document.getElementById(id);
function update() {
  const residential = $('residential').checked;
  $('fhb').disabled = $('foreign').disabled = !residential;
  const r = nswDuty(num($('value')), { residential, firstHomeBuyer: $('fhb').checked, foreign: $('foreign').checked });
  $('total').textContent = fmtMoney(r.total);
  $('duty').textContent = fmtMoney(r.duty);
  $('surcharge').textContent = fmtMoney(r.surcharge);
  $('note').textContent = r.note;
}
$('form').addEventListener('input', update);
$('form').addEventListener('submit', (e) => e.preventDefault());
update();
syncFormWithUrl($('form'), update);
addResultActions(document.querySelectorAll('.cols > .card')[1]);

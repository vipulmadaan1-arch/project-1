import { fmtMoney, num, syncFormWithUrl, addResultActions } from '../layout.js';
import { gst } from '../calc.js';

const $ = (id) => document.getElementById(id);
function update() {
  const mode = $('mode').value;
  const r = gst(num($('amount')), mode);
  $('amount-label').textContent = mode === 'add' ? 'Amount excluding GST ($)' : 'Amount including GST ($)';
  $('headline-label').textContent = mode === 'add' ? 'Total including GST' : 'GST included';
  $('headline').textContent = fmtMoney(mode === 'add' ? r.inclusive : r.gst, 2);
  $('ex').textContent = fmtMoney(r.exclusive, 2);
  $('g').textContent = fmtMoney(r.gst, 2);
  $('inc').textContent = fmtMoney(r.inclusive, 2);
}
$('form').addEventListener('input', update);
$('form').addEventListener('submit', (e) => e.preventDefault());
update();
syncFormWithUrl($('form'), update);
addResultActions(document.querySelectorAll('.cols > .card')[1]);

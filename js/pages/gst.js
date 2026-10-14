import { fmtMoney, readNumber, wireForm, blank, syncFormWithUrl, addResultActions } from '../layout.js';
import { gst } from '../calc.js';

const $ = (id) => document.getElementById(id);
function update() {
  const mode = $('mode').value;
  $('amount-label').textContent = mode === 'add' ? 'Amount excluding GST ($)' : 'Amount including GST ($)';
  $('headline-label').textContent = mode === 'add' ? 'Total including GST' : 'GST included';
  const amount = readNumber($('amount'), { name: 'Amount', unit: 'money', min: 0, max: 1e12, example: '1,100' });
  if (amount === null) return blank($('headline'), $('ex'), $('g'), $('inc'));
  const r = gst(amount, mode);
  $('headline').textContent = fmtMoney(mode === 'add' ? r.inclusive : r.gst, 2);
  $('ex').textContent = fmtMoney(r.exclusive, 2);
  $('g').textContent = fmtMoney(r.gst, 2);
  $('inc').textContent = fmtMoney(r.inclusive, 2);
}
wireForm($('form'), update);
syncFormWithUrl($('form'), update);
addResultActions(document.querySelectorAll('.cols > .card')[1]);

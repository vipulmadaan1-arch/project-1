import { fmtMoney, readNumber, wireForm, blank, syncFormWithUrl, addResultActions } from '../layout.js';
import { takeHome } from '../calc.js';

const $ = (id) => document.getElementById(id);
const LABEL = { 1: 'year', 12: 'month', 26: 'fortnight', 52: 'week' };
function update() {
  const per = +$('period').value;
  $('period-label').textContent = `Take-home pay per ${LABEL[per]}`;
  $('help-row').hidden = !$('help').checked;
  const gross = readNumber($('gross'), { name: 'Annual salary', unit: 'money', min: 0, max: 1e12, example: '90,000' });
  if (gross === null) return blank($('net'), $('salary'), $('tax'), $('medicare'), $('helpamt'), $('super'), $('eff'));
  const r = takeHome(gross, { includesSuper: $('incl').checked, help: $('help').checked });
  $('net').textContent = fmtMoney(r.net / per);
  $('salary').textContent = fmtMoney(r.salary / per);
  $('tax').textContent = fmtMoney(r.tax / per);
  $('medicare').textContent = fmtMoney(r.medicare / per);
  $('helpamt').textContent = fmtMoney(r.help / per);
  $('super').textContent = fmtMoney(r.super / per);
  $('eff').textContent = `${(r.effectiveRate * 100).toFixed(1)}%`;
}
wireForm($('form'), update);
syncFormWithUrl($('form'), update);
addResultActions(document.querySelectorAll('.cols > .card')[1]);

import { fmtMoney, num } from '../layout.js';
import { takeHome } from '../calc.js';

const $ = (id) => document.getElementById(id);
const LABEL = { 1: 'year', 12: 'month', 26: 'fortnight', 52: 'week' };
function update() {
  const per = +$('period').value;
  const r = takeHome(num($('gross')), { includesSuper: $('incl').checked });
  $('period-label').textContent = `Take-home pay per ${LABEL[per]}`;
  $('net').textContent = fmtMoney(r.net / per);
  $('salary').textContent = fmtMoney(r.salary / per);
  $('tax').textContent = fmtMoney(r.tax / per);
  $('medicare').textContent = fmtMoney(r.medicare / per);
  $('super').textContent = fmtMoney(r.super / per);
  $('eff').textContent = `${(r.effectiveRate * 100).toFixed(1)}%`;
}
$('form').addEventListener('input', update);
$('form').addEventListener('submit', (e) => e.preventDefault());
update();

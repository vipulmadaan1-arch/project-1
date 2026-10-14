import { fmtMoney, num } from '../layout.js';
import { mortgage } from '../calc.js';

const $ = (id) => document.getElementById(id);
function update() {
  const freq = $('freq').value;
  const r = mortgage({ principal: num($('principal')), ratePct: num($('rate')), years: Math.max(1, num($('years'))), frequency: freq });
  $('freq-label').textContent = `${freq[0].toUpperCase()}${freq.slice(1)} repayment`;
  $('repayment').textContent = fmtMoney(r.repayment, 2);
  $('interest').textContent = fmtMoney(r.interest);
  $('total').textContent = fmtMoney(r.total);
}
$('form').addEventListener('input', update);
$('form').addEventListener('submit', (e) => e.preventDefault());
update();

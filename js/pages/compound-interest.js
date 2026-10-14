import { fmtMoney, num } from '../layout.js';
import { compoundInterest } from '../calc.js';

const $ = (id) => document.getElementById(id);
function update() {
  const r = compoundInterest({
    principal: num($('principal')), ratePct: num($('rate')), years: Math.min(100, Math.max(1, num($('years')))),
    compoundsPerYear: +$('comp').value, contribution: num($('contrib')), contributionsPerYear: +$('cfreq').value,
  });
  $('balance').textContent = fmtMoney(r.balance);
  $('contributed').textContent = fmtMoney(r.contributed);
  $('interest').textContent = fmtMoney(r.interest);
  $('rows').innerHTML = r.yearly.map((y) =>
    `<tr><td>${y.year}</td><td>${fmtMoney(y.contributed)}</td><td>${fmtMoney(y.interest)}</td><td>${fmtMoney(y.balance)}</td></tr>`).join('');
}
$('form').addEventListener('input', update);
$('form').addEventListener('submit', (e) => e.preventDefault());
update();

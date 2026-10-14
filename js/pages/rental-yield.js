import { fmtMoney, num, syncFormWithUrl, addResultActions } from '../layout.js';
import { rentalYield } from '../calc.js';

const $ = (id) => document.getElementById(id);
function update() {
  const r = rentalYield({ price: num($('price')), weeklyRent: num($('rent')), annualCosts: num($('costs')), vacancyWeeks: Math.min(52, num($('vacancy'))) });
  $('net').textContent = `${r.net.toFixed(2)}%`;
  $('gross').textContent = `${r.gross.toFixed(2)}%`;
  $('annual').textContent = fmtMoney(r.annualRent);
  $('income').textContent = fmtMoney(r.netIncome);
}
$('form').addEventListener('input', update);
$('form').addEventListener('submit', (e) => e.preventDefault());
update();
syncFormWithUrl($('form'), update);
addResultActions(document.querySelectorAll('.cols > .card')[1]);

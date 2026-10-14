import { fmtMoney, num, syncFormWithUrl, addResultActions } from '../layout.js';
import { offsetSavings } from '../calc.js';

const $ = (id) => document.getElementById(id);
function update() {
  const r = offsetSavings({
    principal: num($('principal')), offset: num($('offset')), ratePct: num($('rate')),
    years: Math.min(40, Math.max(1, num($('years')))), frequency: $('freq').value,
  });
  const y = Math.floor(r.yearsSaved), m = Math.round((r.yearsSaved - y) * 12);
  $('saved').textContent = fmtMoney(r.interestSaved);
  $('time').textContent = r.periodsSaved > 0 ? `${y} yr ${m} mth` : '–';
  $('repayment').textContent = fmtMoney(r.repayment, 2);
  $('base').textContent = fmtMoney(r.baseInterest);
  $('with').textContent = fmtMoney(r.offsetInterest);
}
$('form').addEventListener('input', update);
$('form').addEventListener('submit', (e) => e.preventDefault());
update();
syncFormWithUrl($('form'), update);
addResultActions(document.querySelectorAll('.cols > .card')[1]);

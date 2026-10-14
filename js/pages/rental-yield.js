import { fmtMoney, readNumber, wireForm, blank, syncFormWithUrl, addResultActions } from '../layout.js';
import { rentalYield } from '../calc.js';

const $ = (id) => document.getElementById(id);
function update() {
  const price = readNumber($('price'), { name: 'Purchase price', unit: 'money', above: 0, max: 1e12 });
  const weeklyRent = readNumber($('rent'), { name: 'Weekly rent', unit: 'money', min: 0, max: 1e12, example: '520' });
  const annualCosts = readNumber($('costs'), { name: 'Annual costs', unit: 'money', min: 0, max: 1e12, optional: true, example: '7,500' });
  const vacancyWeeks = readNumber($('vacancy'), { name: 'Vacancy', unit: 'weeks', min: 0, max: 52, optional: true, example: '2' });
  if ([price, weeklyRent, annualCosts, vacancyWeeks].includes(null)) return blank($('net'), $('gross'), $('annual'), $('income'));
  const r = rentalYield({ price, weeklyRent, annualCosts, vacancyWeeks });
  $('net').textContent = `${r.net.toFixed(2)}%`;
  $('gross').textContent = `${r.gross.toFixed(2)}%`;
  $('annual').textContent = fmtMoney(r.annualRent);
  $('income').textContent = fmtMoney(r.netIncome);
}
wireForm($('form'), update);
syncFormWithUrl($('form'), update);
addResultActions(document.querySelectorAll('.cols > .card')[1]);

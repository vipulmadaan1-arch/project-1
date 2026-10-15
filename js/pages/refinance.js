import { fmtMoney, readNumber, wireForm, blank, syncFormWithUrl, addResultActions } from '../layout.js';
import { refinance } from '../refinance.js';
import { describeMonths } from '../loans.js';
import { stackedColumns, perFrame } from '../chart.js';

const $ = (id) => document.getElementById(id);
// The headline figures update as you type; the year table follows a frame later.
const later = perFrame();
const OUT = ['net', 'pay-now', 'pay-new', 'monthly', 'interest', 'costs', 'breakeven', 'keep-sooner', 'keep-interest', 'keep-net'];

function update() {
  const balance = readNumber($('balance'), { name: 'Loan balance', unit: 'money', above: 0, max: 1e10, example: '500,000' });
  const currentRatePct = readNumber($('rate'), { name: 'Current interest rate', unit: 'percent', min: 0, max: 30, example: '6.5' });
  const yearsLeft = readNumber($('years'), { name: 'Years left', unit: 'years', min: 1, max: 40, example: '25' });
  const newRatePct = readNumber($('newrate'), { name: 'New interest rate', unit: 'percent', min: 0, max: 30, example: '5.9' });
  const newYearsIn = readNumber($('newyears'), { name: 'New loan term', unit: 'years', min: 1, max: 40, optional: true, example: '25' });
  const fees = ['discharge', 'newfees', 'govfees'].map((id) => readNumber($(id), { name: $(id).labels[0].textContent.replace(/ \(\$\)$/, ''), unit: 'money', min: 0, max: 1e7, optional: true, example: '350' }));
  const cashback = readNumber($('cashback'), { name: 'Cashback', unit: 'money', min: 0, max: 1e7, optional: true, example: '2,000' });
  const card = $('chart').closest('.chart-card');
  if ([balance, currentRatePct, yearsLeft, newRatePct, newYearsIn, cashback, ...fees].includes(null)) {
    card.hidden = true;
    later(null);
    $('note').textContent = '';
    return blank(...OUT.map($));
  }
  const newYears = newYearsIn || yearsLeft;
  const costs = fees.reduce((s, x) => s + x, 0);
  const addCosts = $('addcosts').checked;
  const r = refinance({ balance, currentRatePct, yearsLeft, newRatePct, newYears, costs, cashback, addCosts });

  $('net-label').textContent = r.netSaving >= 0 ? 'Net saving over the loan' : 'Net extra cost over the loan';
  $('net').textContent = fmtMoney(Math.abs(r.netSaving));
  $('pay-now').textContent = fmtMoney(r.currentRepayment, 2);
  $('pay-new').textContent = fmtMoney(r.newRepayment, 2);
  $('monthly-label').textContent = r.monthlySaving >= 0 ? 'Monthly saving' : 'Monthly increase';
  $('monthly').textContent = fmtMoney(Math.abs(r.monthlySaving), 2);
  $('interest-label').textContent = r.interestSaved >= 0 ? 'Interest saved' : 'Extra interest';
  $('interest').textContent = fmtMoney(Math.abs(r.interestSaved));
  $('costs').textContent = `${fmtMoney(costs)}${cashback ? ` less ${fmtMoney(cashback)} cashback` : ''}`;
  $('breakeven').textContent = r.breakEven === null ? 'Never' : r.breakEven === 0 ? 'Straight away' : `After ${describeMonths(r.breakEven)}`;

  if (r.keep) {
    $('keep-sooner').textContent = r.keep.monthsSaved > 0 ? `${describeMonths(r.keep.monthsSaved)} sooner` : r.keep.monthsSaved === 0 ? 'Same time' : `${describeMonths(-r.keep.monthsSaved)} later`;
    $('keep-interest').textContent = fmtMoney(r.keep.interestSaved);
    $('keep-net').textContent = fmtMoney(r.keep.netSaving);
    $('keep-net-label').textContent = r.keep.netSaving >= 0 ? 'Net saving after costs' : 'Net extra cost after costs';
    if (r.keep.netSaving < 0) $('keep-net').textContent = fmtMoney(-r.keep.netSaving);
  } else blank($('keep-sooner'), $('keep-interest'), $('keep-net'));

  const notes = [];
  if (r.breakEven === null) notes.push('Switching doesn’t pay for itself over the life of the loan with these figures.');
  else if (r.breakEven > 0) notes.push(`You get your switching costs back after ${describeMonths(r.breakEven)}, ${r.monthlySaving > 0 ? 'counting both the lower repayments and the faster drop in what you owe' : 'counting the faster drop in what you owe'}.`);
  if (newYears > yearsLeft && r.monthlySaving > 0) notes.push(`The new term is ${describeMonths((newYears - yearsLeft) * 12)} longer than what you have left, so part of the monthly saving comes from stretching the loan out.`);
  if (r.keep && r.keep.monthsSaved > 0) notes.push(`If you keep paying ${fmtMoney(r.currentRepayment, 2)} a month on the new loan, it’s paid off in ${describeMonths(r.keep.months)} instead of ${describeMonths(Math.round(yearsLeft * 12))}.`);
  $('note').textContent = notes.join(' ');

  card.hidden = false;
  stackedColumns($('chart'), {
    title: 'Interest and switching costs: current loan versus new loan',
    labels: ['Stay', 'Switch'],
    series: [{ name: 'Interest', values: [r.interestCurrent, r.interestNew] }, { name: addCosts ? 'Switching costs (added to loan)' : 'Switching costs', values: [0, costs] }],
    format: (n) => fmtMoney(n),
  });
  later(() => { $('rows').innerHTML = r.years.map((y) => `<tr><td>${y.year}</td><td>${fmtMoney(y.currentBalance)}</td><td>${fmtMoney(y.newBalance)}</td><td>${fmtMoney(y.ahead)}</td></tr>`).join(''); });
}
wireForm($('form'), update);
syncFormWithUrl($('form'), update);
addResultActions(document.querySelectorAll('.cols > .card')[1]);

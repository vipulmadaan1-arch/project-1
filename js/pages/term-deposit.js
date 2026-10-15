import { fmtMoney, readNumber, wireForm, blank, syncFormWithUrl, addResultActions } from '../layout.js';
import { termDeposit, taxOnInterest, TAX_YEAR } from '../term-deposit.js';

const $ = (id) => document.getElementById(id);
const EVERY = { monthly: 'month', quarterly: 'quarter', annually: 'year' };

function update() {
  const paid = $('paid').value;
  const atMaturity = paid === 'maturity';
  $('reinvest-field').hidden = atMaturity;
  const reinvest = $('reinvest').value === '1';
  $('tax-year').textContent = TAX_YEAR;

  const amount = readNumber($('amount'), { name: 'Amount invested', unit: 'money', above: 0, max: 1e10, example: '10,000' });
  const ratePct = readNumber($('rate'), { name: 'Interest rate', unit: 'percent', min: 0, max: 30, example: '4.5' });
  const months = readNumber($('months'), { name: 'Term', unit: 'plain', min: 1, max: 120, whole: true, example: '12' });
  const incomeEmpty = $('income').value.trim() === '';
  const income = readNumber($('income'), { name: 'Other taxable income', unit: 'money', min: 0, max: 1e9, optional: true, example: '80,000' });
  if ([amount, ratePct, months, income].includes(null)) {
    $('note').textContent = '';
    return blank($('interest'), $('balance'), $('per'), $('effective'), $('tax'), $('after'));
  }
  const r = termDeposit({ amount, ratePct, months, paid, reinvest });
  $('interest').textContent = fmtMoney(r.interest, 2);
  const paidOut = !atMaturity && !reinvest;
  $('balance-label').textContent = paidOut ? 'Balance at maturity (interest paid out)' : 'Balance at maturity';
  $('balance').textContent = fmtMoney(r.balance, 2);
  $('per-label').textContent = atMaturity ? 'Interest paid at maturity' : reinvest ? `Interest added in the first ${EVERY[paid]}` : `Interest paid each ${EVERY[paid]}`;
  $('per').textContent = fmtMoney(atMaturity ? r.interest : r.perPayment, 2);
  $('effective').textContent = `${r.effectiveRatePct.toLocaleString('en-AU', { maximumFractionDigits: 2 })}% a year`;
  if (incomeEmpty) {
    $('tax').textContent = 'Add your income';
    $('after').textContent = '–';
  } else {
    const t = taxOnInterest(r.interest, income);
    $('tax').textContent = `${fmtMoney(t.tax, 2)} (${t.ratePct.toLocaleString('en-AU', { maximumFractionDigits: 1 })}%)`;
    $('after').textContent = fmtMoney(t.afterTax, 2);
  }
  const notes = [];
  if (atMaturity && months > 12) notes.push('Many banks pay interest at least once a year on terms longer than 12 months. Check how your bank pays it.');
  if (amount > 250000) notes.push('The Financial Claims Scheme guarantees deposits up to $250,000 per person per bank, so you may want to spread larger amounts across banks.');
  $('note').textContent = notes.join(' ');
}
wireForm($('form'), update);
syncFormWithUrl($('form'), update);
addResultActions(document.querySelectorAll('.cols > .card')[1]);

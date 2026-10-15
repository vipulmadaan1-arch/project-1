import { fmtMoney, readNumber, setError, wireForm, blank, syncFormWithUrl, addResultActions } from '../layout.js';
import { personalLoan } from '../loans.js';

const $ = (id) => document.getElementById(id);
const cap = (s) => `${s[0].toUpperCase()}${s.slice(1)}`;
const pct = (n) => `${n.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}% p.a.`;

function update() {
  const freq = $('freq').value;
  const inMonths = $('unit').value === 'months';
  $('total-label').textContent = `${cap(freq)} repayment`;
  $('with-fees-label').textContent = `${cap(freq)} repayment including fees`;
  const amount = readNumber($('amount'), { name: 'Amount to borrow', unit: 'money', above: 0, max: 1e9, example: '30,000' });
  const ratePct = readNumber($('rate'), { name: 'Interest rate', unit: 'percent', min: 0, max: 100, example: '9' });
  const term = inMonths
    ? readNumber($('term'), { name: 'Loan term', unit: 'plain', min: 1, max: 360, whole: true, example: '60' })
    : readNumber($('term'), { name: 'Loan term', unit: 'years', above: 0, max: 30, example: '5' });
  const upfrontFee = readNumber($('upfront'), { name: 'Upfront fee', unit: 'money', min: 0, max: 1e6, optional: true, example: '250' });
  const monthlyFee = readNumber($('monthly'), { name: 'Monthly fee', unit: 'money', min: 0, max: 1e5, optional: true, example: '10' });
  let balloon = readNumber($('balloon'), { name: 'Balloon', unit: 'money', min: 0, max: 1e9, optional: true, example: '9,000' });
  // The balloon has to be less than what you borrow, or there's nothing to repay.
  const financeFee = $('finance').checked;
  if (balloon !== null && amount !== null && upfrontFee !== null && balloon >= amount + (financeFee ? upfrontFee : 0)) {
    setError($('balloon'), 'Balloon must be less than the amount you borrow');
    balloon = null;
  }
  const outs = [$('total'), $('with-fees'), $('balloon-out'), $('interest'), $('fees'), $('cost'), $('paid'), $('true-rate')];
  if ([amount, ratePct, term, upfrontFee, monthlyFee, balloon].includes(null)) { $('note').textContent = ''; return blank(...outs); }

  const months = inMonths ? term : term * 12;
  const r = personalLoan({ amount, ratePct, months, frequency: freq, upfrontFee, financeFee, monthlyFee, balloon });
  $('total').textContent = fmtMoney(r.repayment, 2);
  $('with-fees').textContent = fmtMoney(r.repaymentWithFees, 2);
  $('balloon-out').textContent = fmtMoney(r.balloon);
  $('interest').textContent = fmtMoney(r.interest);
  $('fees').textContent = fmtMoney(r.fees);
  $('cost').textContent = fmtMoney(r.totalCost);
  $('paid').textContent = fmtMoney(r.totalPaid);
  $('true-rate').textContent = Number.isFinite(r.trueRate) ? pct(r.trueRate) : '–';

  const notes = [];
  if (r.fees > 0 && Number.isFinite(r.trueRate)) {
    notes.push(`With fees, this loan costs the same as a loan at ${pct(r.trueRate)} with no fees. That’s the idea behind a comparison rate, which lenders must show in ads, but theirs is worked out on a standard loan (such as $30,000 over 5 years), so yours can differ.`);
  }
  if (r.balloon > 0) {
    notes.push(`You’ll still owe ${fmtMoney(r.balloon)} after the last repayment: pay it, refinance it, or sell or trade in the car to cover it.`);
  }
  $('note').textContent = notes.join(' ');
}
wireForm($('form'), update);
syncFormWithUrl($('form'), update);
addResultActions(document.querySelectorAll('.cols > .card')[1]);

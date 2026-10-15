import { fmtMoney, readNumber, wireForm, blank, syncFormWithUrl, addResultActions } from '../layout.js';
import { cardPayoff, cardPaymentFor, cardMinimumOnly, describeMonths } from '../loans.js';

const $ = (id) => document.getElementById(id);
const NEVER = { interest: 'Never', 'too-long': '100+ years' };

function update() {
  const byMonths = $('mode').value === 'months';
  $('payment-field').hidden = byMonths;
  $('months-field').hidden = !byMonths;
  $('total-label').textContent = byMonths ? 'Monthly repayment needed' : 'Time to pay off';
  $('other-label').textContent = byMonths ? 'Time to pay off' : 'Monthly repayment';

  const balance = readNumber($('balance'), { name: 'Card balance', unit: 'money', above: 0, max: 1e8, example: '5,000' });
  const ratePct = readNumber($('rate'), { name: 'Interest rate', unit: 'percent', min: 0, max: 100, example: '20' });
  const payment = byMonths ? 0 : readNumber($('payment'), { name: 'Monthly repayment', unit: 'money', above: 0, max: 1e8, example: '200' });
  const months = byMonths ? readNumber($('months'), { name: 'Months', unit: 'plain', min: 1, max: 600, whole: true, example: '24' }) : 0;
  const minPct = readNumber($('minpct'), { name: 'Minimum repayment percentage', unit: 'percent', above: 0, max: 100, example: '2' });
  const minFloor = readNumber($('minfloor'), { name: 'Minimum repayment floor', unit: 'money', min: 0, max: 1e6, optional: true, example: '25' });

  const notes = [];
  let plan = null;
  // Your plan
  if ([balance, ratePct, payment, months].includes(null)) {
    blank($('total'), $('other'), $('interest'), $('paid'), $('saved'));
  } else {
    const r = byMonths ? cardPaymentFor({ balance, ratePct, months }) : cardPayoff({ balance, ratePct, payment });
    if (byMonths) {
      $('total').textContent = fmtMoney(r.payment, 2);
      $('other').textContent = describeMonths(r.months);
    } else if (r.paysOff) {
      $('total').textContent = describeMonths(r.months);
      $('other').textContent = fmtMoney(payment, 2);
    } else {
      $('total').textContent = NEVER[r.reason];
      $('other').textContent = fmtMoney(payment, 2);
    }
    $('interest').textContent = r.paysOff ? fmtMoney(r.interest) : '–';
    $('paid').textContent = r.paysOff ? fmtMoney(r.totalPaid) : '–';
    if (!r.paysOff && r.reason === 'too-long') notes.push(`At ${fmtMoney(payment, 2)} a month the card would take more than 100 years to clear, because the repayment barely covers the interest.`);
    if (!r.paysOff && r.reason === 'interest') {
      notes.push(`Warning: your first month’s interest is about ${fmtMoney(r.firstInterest, 2)}, so a ${fmtMoney(payment, 2)} repayment won’t reduce the balance. Pay more than the interest, or talk to your bank about a hardship arrangement or a lower rate.`);
    }
    plan = r;
  }

  // Minimum repayments only
  if ([balance, ratePct, minPct, minFloor].includes(null)) {
    blank($('min-first'), $('min-time'), $('min-interest'), $('saved'));
  } else {
    const m = cardMinimumOnly({ balance, ratePct, minPct, minFloor });
    $('min-first').textContent = fmtMoney(m.firstPayment, 2);
    $('min-time').textContent = m.paysOff ? describeMonths(m.months) : NEVER[m.reason];
    $('min-interest').textContent = m.paysOff ? fmtMoney(m.interest) : '–';
    if (plan?.paysOff && m.paysOff) $('saved').textContent = fmtMoney(Math.max(0, m.interest - plan.interest));
    else $('saved').textContent = '–';
    if (!m.paysOff && m.reason === 'too-long') notes.push('Paying only the minimum, the card would take more than 100 years to clear.');
    if (!m.paysOff && m.reason === 'interest') notes.push(`A minimum of ${minPct}% of the balance is no more than the monthly interest (${(ratePct / 12).toLocaleString('en-AU', { maximumFractionDigits: 2 })}% a month), so paying only the minimum would never reduce the balance.`);
  }
  $('note').textContent = notes.join(' ');
}
wireForm($('form'), update);
syncFormWithUrl($('form'), update);
addResultActions(document.querySelectorAll('.cols > .card')[1]);

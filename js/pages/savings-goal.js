import { fmtMoney, readNumber, setError, wireForm, blank, syncFormWithUrl, addResultActions } from '../layout.js';
import { FREQ, savingsTime, savingsDeposit, periodsUntil, describeMonths } from '../loans.js';

const $ = (id) => document.getElementById(id);
const today = new Date();
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const longDate = (d) => d.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
const UNIT = { weekly: 'week', fortnightly: 'fortnight', monthly: 'month' };
if (!$('by').value) $('by').value = iso(new Date(today.getFullYear() + 2, today.getMonth(), today.getDate()));

// Date of the nth deposit period's end, counting from today.
function addPeriods(n, perYear) {
  if (perYear === 12) return new Date(today.getFullYear(), today.getMonth() + n, today.getDate());
  return new Date(today.getFullYear(), today.getMonth(), today.getDate() + n * (364 / perYear));
}

// "14 weeks" for short stretches, otherwise years and months.
function duration(n, perYear) {
  if (perYear === 12) return describeMonths(n);
  const weeks = n * (52 / perYear);
  if (weeks < 13) return `${weeks} week${weeks === 1 ? '' : 's'}`;
  return `About ${describeMonths((weeks * 12) / 52)}`;
}

function update() {
  const byDate = $('mode').value === 'date';
  const freq = $('freq').value;
  const perYear = FREQ[freq];
  $('deposit-field').hidden = byDate;
  $('date-field').hidden = !byDate;
  $('total-label').textContent = byDate ? `You need to save each ${UNIT[freq]}` : 'Time to reach your goal';
  $('other-label').textContent = byDate ? 'Goal date' : 'Goal reached around';

  const target = readNumber($('target'), { name: 'Savings goal', unit: 'money', above: 0, max: 1e12, example: '10,000' });
  const start = readNumber($('start'), { name: 'Amount already saved', unit: 'money', min: 0, max: 1e12, optional: true, example: '1,000' });
  const ratePct = readNumber($('rate'), { name: 'Interest rate', unit: 'percent', min: 0, max: 100, example: '4.5' });
  const deposit = byDate ? 0 : readNumber($('deposit'), { name: 'Amount you save', unit: 'money', min: 0, max: 1e12, optional: true, example: '200' });
  let periods = 0;
  if (!byDate) setError($('by'), '');
  else {
    const el = $('by');
    if (!el.value) { setError(el, 'Enter the date you want to reach your goal by'); periods = null; }
    else {
      periods = periodsUntil(today, el.value, perYear);
      if (periods < 1) { setError(el, `Choose a date at least one ${UNIT[freq]} from today`); periods = null; }
      else setError(el, '');
    }
  }
  const outs = [$('total'), $('other'), $('count'), $('deposited'), $('interest'), $('balance')];
  if ([target, start, ratePct, deposit, periods].includes(null)) { $('note').textContent = ''; return blank(...outs); }
  const compoundsPerYear = +$('comp').value;

  let r, note = '';
  if (byDate) {
    r = savingsDeposit({ target, start, ratePct, compoundsPerYear, depositsPerYear: perYear, periods });
    $('total').textContent = fmtMoney(r.deposit, 2);
    $('other').textContent = longDate(new Date(`${$('by').value}T00:00:00`));
    if (r.startEnough) note = start >= target ? 'You’ve already reached your goal.' : 'Interest on what you’ve already saved gets you there by this date, with no more deposits.';
  } else {
    r = savingsTime({ target, start, ratePct, compoundsPerYear, deposit, depositsPerYear: perYear });
    if (!r.reached) {
      $('total').textContent = deposit > 0 || ratePct > 0 ? 'More than 100 years' : 'Never, without deposits';
      blank($('other'), $('count'), $('deposited'), $('interest'), $('balance'));
      $('note').textContent = deposit > 0 || ratePct > 0 ? 'At this rate it would take more than 100 years. Try saving more each time.' : 'Enter an amount to save each time, or an interest rate, to see how long it will take.';
      return;
    }
    $('total').textContent = r.periods === 0 ? 'Already there' : duration(r.periods, perYear);
    $('other').textContent = longDate(addPeriods(r.periods, perYear));
    if (r.periods === 0) note = 'What you’ve already saved meets your goal.';
  }
  $('count').textContent = r.periods.toLocaleString('en-AU');
  $('deposited').textContent = fmtMoney(r.deposited);
  $('interest').textContent = fmtMoney(r.interest);
  $('balance').textContent = fmtMoney(r.balance);
  $('note').textContent = note;
}
wireForm($('form'), update);
syncFormWithUrl($('form'), update);
addResultActions(document.querySelectorAll('.cols > .card')[1]);

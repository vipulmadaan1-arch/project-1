import { fmtMoney, readNumber, wireForm, blank, syncFormWithUrl, addResultActions } from '../layout.js';
import { offsetSavings } from '../calc.js';

const $ = (id) => document.getElementById(id);
const HINT = 'Assumes the balance stays constant.';
function update() {
  const principal = readNumber($('principal'), { name: 'Loan amount', unit: 'money', min: 0, max: 1e12 });
  const offset = readNumber($('offset'), { name: 'Offset balance', unit: 'money', min: 0, max: 1e12, optional: true });
  const ratePct = readNumber($('rate'), { name: 'Interest rate', unit: 'percent', min: 0, max: 100, example: '6.25' });
  const years = readNumber($('years'), { name: 'Loan term', unit: 'years', min: 1, max: 40, example: '30' });
  $('offset-hint').textContent = principal !== null && offset > principal
    ? `More than the loan amount, so only ${fmtMoney(principal)} reduces interest. ${HINT}`
    : HINT;
  if ([principal, offset, ratePct, years].includes(null)) return blank($('saved'), $('time'), $('repayment'), $('base'), $('with'));
  const r = offsetSavings({ principal, offset, ratePct, years, frequency: $('freq').value });
  // Round to whole months first, so 51 weeks shows as "1 yr" rather than "0 yr 12 mth".
  const months = Math.round(r.yearsSaved * 12), y = Math.floor(months / 12), m = months % 12;
  $('saved').textContent = fmtMoney(r.interestSaved);
  $('time').textContent = months > 0 ? [y && `${y} yr`, m && `${m} mth`].filter(Boolean).join(' ') : r.periodsSaved > 0 ? 'Under 1 mth' : '–';
  $('repayment').textContent = fmtMoney(r.repayment, 2);
  $('base').textContent = fmtMoney(r.baseInterest);
  $('with').textContent = fmtMoney(r.offsetInterest);
}
wireForm($('form'), update);
syncFormWithUrl($('form'), update);
addResultActions(document.querySelectorAll('.cols > .card')[1]);

import { fmtMoney, readNumber, wireForm, blank, syncFormWithUrl, addResultActions, setError } from '../layout.js';
import { rentalCashflow, fyLabel, GRANDFATHER_DATE, LIMIT_START_FY } from '../rental.js';

const $ = (id) => document.getElementById(id);
const show = (id, on) => { $(id).hidden = !on; };
const OUT = ['total', 'after-year', 'pre-week', 'pre-year', 'rent-out', 'interest', 'principal', 'holding', 'net', 'tax-effect', 'status', 'carried-out', 'cmp', 'yield'];
const money = (name, el, extra = {}) => readNumber($(el), { name, unit: 'money', min: 0, max: 1e10, ...extra });
// Signed money for cashflow: "−$240" reads better than "-$240" and fmtMoney already handles the sign.
const signed = (n) => (n < 0 ? `−${fmtMoney(-n)}` : fmtMoney(n));

function readAcquired(fyStart) {
  const d = $('acquired').value;
  const fyEnd = `${fyStart + 1}-06-30`;
  if (!d) setError($('acquired'), 'Enter the date you signed the contract');
  else if (d > fyEnd) setError($('acquired'), `That's after the ${fyLabel(fyStart)} income year ends. Pick a later income year or an earlier date`);
  else setError($('acquired'), '');
  return d && d <= fyEnd ? d : null;
}

function update() {
  const fyStart = Number($('fy').value);
  const pi = $('loan-type').value === 'pi';
  show('term-field', pi);
  show('principal-row', pi);
  const acquired = readAcquired(fyStart);
  const onBudgetDay = $('acquired').value === GRANDFATHER_DATE;
  show('budget-time-wrap', onBudgetDay);
  show('carried-field', fyStart >= LIMIT_START_FY);

  const v = {
    weeklyRent: money('Weekly rent', 'rent'),
    vacancyWeeks: readNumber($('vacancy'), { name: 'Weeks vacant', unit: 'weeks', min: 0, max: 52 }),
    price: money('Purchase price', 'price', { optional: true }),
    loan: money('Loan amount', 'loan', { optional: true }),
    ratePct: readNumber($('rate'), { name: 'Interest rate', unit: 'percent', min: 0, max: 30 }),
    termYears: pi ? readNumber($('term'), { name: 'Loan term', unit: 'years', min: 1, max: 40 }) : 30,
    councilRates: money('Council rates', 'council', { optional: true }),
    strata: money('Strata', 'strata', { optional: true }),
    insurance: money('Insurance', 'insurance', { optional: true }),
    pmPct: readNumber($('pm'), { name: 'Property management fee', unit: 'percent', min: 0, max: 30, optional: true }),
    maintenance: money('Repairs and maintenance', 'maintenance', { optional: true }),
    landTax: money('Land tax', 'land-tax', { optional: true }),
    depreciation: money('Depreciation', 'depreciation', { optional: true }),
    income: money('Other taxable income', 'income', { optional: true }),
    carriedForward: fyStart >= LIMIT_START_FY ? money('Losses carried forward', 'carried', { optional: true }) : 0,
  };
  // Joint owners each declare their share of the rent and expenses and claim their share of any loss (ATO).
  const share = readNumber($('share'), { name: 'Ownership share', unit: 'percent', above: 0, max: 100 });
  if (share != null && share < 100) for (const k of ['weeklyRent', 'price', 'loan', 'councilRates', 'strata', 'insurance', 'maintenance', 'landTax', 'depreciation']) if (v[k]) v[k] *= share / 100;
  if (share == null) v.share = null;
  const r = acquired && !Object.values(v).includes(null) ? rentalCashflow({
    fyStart, ...v, loanType: pi ? 'pi' : 'io', acquired, beforeBudgetTime: onBudgetDay && $('budget-time').checked, newBuild: $('newbuild').checked,
  }) : null;
  if (!r) { $('note').textContent = ''; return blank(...OUT.map($)); }

  const fy = fyLabel(fyStart);
  $('total-label').textContent = `After-tax cashflow per week, ${fy}`;
  $('total').textContent = signed(r.afterTaxWeekly);
  $('after-year').textContent = signed(r.afterTax);
  $('pre-week').textContent = signed(r.preTaxWeekly);
  $('pre-year').textContent = signed(r.preTax);
  $('rent-out').textContent = fmtMoney(r.rent);
  $('interest').textContent = fmtMoney(r.interest);
  $('principal').textContent = fmtMoney(r.principal);
  $('holding').textContent = fmtMoney(r.holding);
  $('net-label').textContent = r.net < 0 ? 'Net rental loss for tax' : 'Net rental profit for tax';
  $('net').textContent = fmtMoney(Math.abs(r.net));
  $('tax-label').textContent = r.taxEffect > 0 ? 'Extra tax on rental profit' : 'Tax saved on your other income';
  $('tax-effect').textContent = fmtMoney(Math.abs(r.taxEffect));

  const status = !r.yearCovered ? `No, it starts in ${fyLabel(LIMIT_START_FY)}`
    : r.grandfathered ? 'No, bought before Budget night'
      : r.newBuild ? 'No, new build'
        : 'Yes';
  $('status').textContent = status;
  show('carried-row', r.limited);
  $('carried-out').textContent = fmtMoney(r.carriedOut);
  // Compare with the other rule: what negative gearing is worth, or what the limit would cost.
  const other = r.limited ? r.full : r.capped;
  $('cmp-label').textContent = r.limited ? 'If you could negatively gear (per week)' : 'If the limit applied (per week)';
  $('cmp').textContent = signed(other.afterTaxWeekly);
  $('yield').textContent = r.grossYield == null ? '–' : `${r.grossYield.toFixed(2)}%`;

  const notes = [];
  const diff = Math.abs(r.full.afterTax - r.capped.afterTax);
  if (r.limited && r.net < 0) {
    notes.push(`Under the limit, the ${fmtMoney(-r.net)} loss can't reduce tax on your other income this year. It's carried forward to reduce future rental profit or a capital gain on residential property, which costs you ${fmtMoney(diff)} in tax this year compared with negative gearing.`);
  } else if (r.limited && r.carriedUsed > 0) {
    notes.push(`${fmtMoney(r.carriedUsed)} of your carried-forward losses reduced this year's rental profit.`);
  } else if (!r.limited && r.net < 0) {
    notes.push(`The ${fmtMoney(-r.net)} loss reduces the tax on your other income by ${fmtMoney(-r.taxEffect)}.`);
    if (!r.yearCovered && !r.exempt) notes.push(`From ${fyLabel(LIMIT_START_FY)} this property is caught by the limit, because it was bought after 7.30 pm on 12 May 2026: the same loss would save no tax that year.`);
    else if (r.grandfathered) notes.push('Bought before 7.30 pm (AEST) on 12 May 2026, so it keeps negative gearing until you sell it.');
    else if (r.newBuild) notes.push('New builds keep negative gearing, but the exact definition is still to be set by the Minister, so check before you rely on it.');
  }
  if (r.limited) notes.push('The limit applies across all your established homes bought after Budget night together: a profit on one absorbs a loss on another.');
  if (r.marginal != null && r.taxEffect !== 0) notes.push(`Your marginal rate, with the Medicare levy, is about ${Math.round(r.marginal * 100)}%.`);
  if (share < 100) notes.push(`These figures are your ${share.toLocaleString('en-AU')}% share: rent, costs, cashflow and tax. Your co-owner works out theirs the same way, with their own income.`);
  $('note').textContent = notes.join(' ');
}

wireForm($('form'), update);
$('form').addEventListener('change', update); // date picker, selects and checkboxes
syncFormWithUrl($('form'), update);
addResultActions(document.querySelectorAll('.cols > .card')[1]);

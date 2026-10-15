import { fmtMoney, readNumber, wireForm, blank, syncFormWithUrl, addResultActions, setError, setEnabled } from '../layout.js';
import { rentVsBuy } from '../rentbuy.js';

const $ = (id) => document.getElementById(id);
const OUT = ['diff', 'buy', 'rentw', 'breakeven', 'duty', 'upfrontamt', 'loan', 'repay', 'owncosts', 'rentmonth'];
const money = (id, name, o = {}) => readNumber($(id), { name, unit: 'money', min: 0, max: 1e10, ...o });
const pct = (id, name, o = {}) => readNumber($(id), { name, unit: 'percent', min: 0, max: 30, example: '5', ...o });
const table = $('rows').closest('section');

function update() {
  const home = $('home').checked;
  setEnabled($('fhb'), home, "Only for a home you'll live in. Tick “I'll live in it” to use this.");
  if (!home) $('fhb').checked = false;
  const v = {
    price: money('price', 'Home price', { above: 0, max: 1e9 }),
    deposit: money('deposit', 'Deposit', { max: 1e9 }),
    otherUpfront: money('upfront', 'Other upfront costs', { optional: true }),
    ratePct: pct('rate', 'Loan interest rate', { example: '6.25' }),
    termYears: readNumber($('term'), { name: 'Loan term', unit: 'years', min: 1, max: 40, whole: true, example: '30' }),
    councilRates: money('council', 'Council and water rates', { optional: true }),
    strata: money('strata', 'Strata levies', { optional: true }),
    insurance: money('insurance', 'Home insurance', { optional: true }),
    maintenancePct: pct('maint', 'Maintenance', { max: 10, optional: true }),
    costInflationPct: pct('costinf', 'Cost increases', { optional: true }),
    growthPct: pct('growth', 'Home price growth', { min: -10 }),
    sellingCostPct: pct('selling', 'Selling costs', { max: 10, optional: true }),
    weeklyRent: money('rent', 'Rent', { max: 1e6 }),
    rentGrowthPct: pct('rentgrowth', 'Rent increases', { min: -10, optional: true }),
    returnPct: pct('ret', 'Investment return', { min: -10 }),
    taxDragPct: pct('drag', 'Tax on investment earnings', { max: 100, optional: true }),
    years: readNumber($('years'), { name: 'Years to compare', unit: 'years', min: 1, max: 40, whole: true, example: '10' }),
  };
  // The deposit can't be more than the price.
  if (v.price !== null && v.deposit !== null && v.deposit > v.price) {
    setError($('deposit'), 'Deposit must be no more than the home price');
    v.deposit = null;
  }
  if (Object.values(v).includes(null)) {
    $('note').textContent = '';
    $('estimate-note').textContent = '';
    $('result-label').textContent = 'Difference in net wealth';
    table.hidden = true;
    return blank(...OUT.map($));
  }
  const r = rentVsBuy({ ...v, state: $('state').value, home, firstHome: $('fhb').checked });
  const yrs = `${v.years} year${v.years === 1 ? '' : 's'}`;
  const ahead = r.diff >= 0 ? 'Buying' : 'Renting and investing';
  $('result-label').textContent = Math.abs(r.diff) < 0.5 ? `After ${yrs}, it's a tie` : `After ${yrs}, ${ahead.toLowerCase()} is ahead by`;
  $('diff').textContent = fmtMoney(Math.abs(r.diff));
  $('buy').textContent = fmtMoney(r.buy);
  $('rentw').textContent = fmtMoney(r.rent);
  $('breakeven').textContent = r.breakEven === null ? `Not within ${yrs}` : r.breakEven === 1 ? 'Year 1 (buying ahead from the start)' : `Year ${r.breakEven}`;
  $('duty').textContent = fmtMoney(r.duty);
  $('upfrontamt').textContent = fmtMoney(r.upfront);
  $('loan').textContent = fmtMoney(r.loan);
  $('repay').textContent = fmtMoney(r.repayment, 2);
  $('owncosts').textContent = fmtMoney(r.firstMonthOwnCosts, 2);
  $('rentmonth').textContent = fmtMoney(r.firstMonthRent, 2);
  const notes = [];
  const outBuy = r.repayment + r.firstMonthOwnCosts, outRent = r.firstMonthRent;
  notes.push(outBuy > outRent
    ? `In the first year owning costs ${fmtMoney(outBuy - outRent)} a month more than renting, so the renter invests that each month.`
    : `In the first year owning costs ${fmtMoney(outRent - outBuy)} a month less than renting, so the buyer invests that each month.`);
  notes.push(`The renter starts by investing the ${fmtMoney(r.upfront)} the buyer spends upfront.`);
  if (v.price && v.deposit / v.price < 0.2) notes.push('Your deposit is under 20%, so a lender will usually charge lenders mortgage insurance: add an estimate to other upfront costs.');
  if (r.dutyNote) notes.push(r.dutyNote);
  $('note').textContent = notes.join(' ');
  $('estimate-note').textContent = r.dutyEstimate ? ' (this result uses a formula from independent calculators, not the revenue office)' : '';
  table.hidden = false;
  $('rows').innerHTML = r.rows.map((y) => `<tr><td>${y.year}</td><td>${fmtMoney(y.value)}</td><td>${fmtMoney(y.balance)}</td><td>${fmtMoney(y.buy)}</td><td>${fmtMoney(y.rent)}</td><td>${y.diff < 0 ? '−' : ''}${fmtMoney(Math.abs(y.diff))}</td></tr>`).join('');
}
wireForm($('form'), update);
syncFormWithUrl($('form'), update);
addResultActions(document.querySelectorAll('.cols > .card')[1]);

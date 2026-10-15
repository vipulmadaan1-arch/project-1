import { fmtMoney, readNumber, wireForm, blank, syncFormWithUrl, addResultActions } from '../layout.js';
import { workDeductions, YEARS, CAR_KM_CAP } from '../deductions.js';

const $ = (id) => document.getElementById(id);
const cents = (r) => `${Math.round(r * 100)}c`;
function update() {
  const year = $('year').value;
  const y = YEARS[year];
  const logbook = $('method').value === 'logbook';
  $('km-field').hidden = logbook;
  $('costs-field').hidden = !logbook;
  $('pct-field').hidden = !logbook;
  $('standard-row').hidden = !y.standard;
  $('extra-row').hidden = !y.standard;

  const wfhHours = readNumber($('hours'), { name: 'Hours worked from home', min: 0, max: 8784, example: '600' });
  const km = logbook ? 0 : readNumber($('km'), { name: 'Work-related kilometres', min: 0, max: 1e6, example: '2,000' });
  const carCosts = logbook ? readNumber($('costs'), { name: 'Total car costs', unit: 'money', min: 0, max: 1e9 }) : 0;
  const businessPct = logbook ? readNumber($('pct'), { name: 'Business-use percentage', unit: 'percent', min: 0, max: 100, example: '30' }) : 0;
  const taxableIncome = readNumber($('income'), { name: 'Taxable income', unit: 'money', min: 0, max: 1e10 });
  if ([wfhHours, km, carCosts, businessPct, taxableIncome].includes(null)) {
    $('note').textContent = '';
    return blank($('total'), $('wfh'), $('car'), $('saving'), $('standard'), $('extra'));
  }
  const r = workDeductions({ year, wfhHours, carMethod: logbook ? 'logbook' : 'cents', km, carCosts, businessPct, taxableIncome });
  $('total-label').textContent = `Total deduction, ${year}`;
  $('total').textContent = fmtMoney(r.total);
  $('wfh-label').textContent = `Working from home (${cents(r.wfh.rate)} an hour${r.estimate ? ', estimate' : ''})`;
  $('wfh').textContent = fmtMoney(r.wfh.amount, 2);
  $('car-label').textContent = logbook ? `Car, logbook (${r.car.pct}% business use)` : `Car (${cents(r.car.rate)} a km)`;
  $('car').textContent = fmtMoney(r.car.amount, 2);
  $('saving').textContent = fmtMoney(r.taxSaving);
  if (y.standard) {
    $('standard').textContent = `−${fmtMoney(r.standard)}`;
    $('extra').textContent = r.extraSaving < 0 ? `−${fmtMoney(-r.extraSaving)}` : fmtMoney(r.extraSaving);
  }

  const notes = [];
  if (!logbook && r.car.capped) notes.push(`Only ${CAR_KM_CAP.toLocaleString('en-AU')} km can be claimed per car with cents per km. If you drive more for work, a logbook may give a bigger claim.`);
  if (y.standard) {
    notes.push(r.extra <= 0
      ? `These claims total ${fmtMoney(r.total)}, less than the $1,000 standard deduction you get automatically from 2026-27 without receipts, so you're better off not claiming them.`
      : `Claims reduce the $1,000 standard deduction dollar for dollar, so you're ${fmtMoney(r.extra)} ahead on deductions. You'll need written evidence for every work-related expense you claim.`);
  } else {
    notes.push('The $1,000 standard deduction starts in 2026-27, so it doesn\'t apply to this year.');
  }
  notes.push('Cents are dropped from the final claim, as the ATO asks.');
  $('note').textContent = notes.join(' ');
  $('estimate-note').textContent = r.estimate
    ? 'The ATO hasn\'t published a 2026-27 working from home rate yet, so this uses the 2025-26 rate of 70c an hour as an estimate. '
    : '';
}
wireForm($('form'), update);
syncFormWithUrl($('form'), update);
addResultActions(document.querySelectorAll('.cols > .card')[1]);

import { fmtMoney, readNumber, wireForm, blank, syncFormWithUrl, addResultActions, partsFormat } from '../layout.js';
import { taxRefund } from '../refund.js';

const $ = (id) => document.getElementById(id);
const OUT = ['refund', 'income', 'deductions', 'taxable', 'gross', 'lito', 'medicare', 'mls', 'helpamt', 'frankingamt', 'liability', 'withheldamt'];
const money = (id, name) => readNumber($(id), { name, unit: 'money', min: 0, max: 1e10, optional: true });

function update() {
  const year = $('year').value;
  const v = {
    salary: money('salary', 'Salary and wages'), withheld: money('withheld', 'Tax withheld'),
    interest: money('interest', 'Bank interest'), dividends: money('dividends', 'Dividends received'),
    franking: money('franking', 'Franking credits'), workDeductions: money('work', 'Work-related deductions'),
    otherDeductions: money('other', 'Other deductions'),
  };
  if (Object.values(v).includes(null)) {
    $('note').textContent = '';
    $('refund-label').textContent = 'Estimated refund';
    return blank(...OUT.map($));
  }
  const r = taxRefund({ year, ...v, privateCover: $('cover').checked, help: $('help').checked });
  const owe = r.refund < -0.005;
  $('refund-label').textContent = owe ? `Estimated amount you owe, ${year}` : `Estimated refund, ${year}`;
  // Tax and levies, then the refund: whole dollars from $1,000 up, cents below that, unless rounding would
  // stop the lines adding up (then every line keeps its cents).
  const dollars = partsFormat(
    [[r.gross, -r.lito, r.medicare, r.mls.amount, r.help, -r.franking], r.liability],
    [[r.withheld, -r.liability], r.refund],
  );
  $('refund').textContent = dollars(Math.abs(r.refund));
  $('income').textContent = fmtMoney(r.income);
  $('deductions-label').textContent = r.useStandard ? `Deductions (incl. ${fmtMoney(r.standard)} standard deduction)` : 'Deductions';
  $('deductions').textContent = r.deductions ? `−${fmtMoney(r.deductions)}` : fmtMoney(0);
  $('taxable').textContent = fmtMoney(r.taxable);
  $('gross').textContent = dollars(r.gross);
  $('lito').textContent = r.lito ? `−${dollars(r.lito)}` : fmtMoney(0);
  $('medicare').textContent = dollars(r.medicare);
  $('mls-row').hidden = $('cover').checked;
  $('mls-label').textContent = r.mls.rate ? `Medicare levy surcharge (${(r.mls.rate * 100).toLocaleString('en-AU')}%)` : 'Medicare levy surcharge';
  $('mls').textContent = dollars(r.mls.amount);
  $('help-row').hidden = !$('help').checked;
  $('helpamt').textContent = dollars(r.help);
  $('franking-row').hidden = !r.franking;
  $('frankingamt').textContent = `−${dollars(r.franking)}`;
  $('liability').textContent = dollars(r.liability);
  $('withheldamt').textContent = `−${dollars(r.withheld)}`;

  const notes = [];
  if (r.standard > 0) {
    notes.push(r.useStandard
      ? `Your work-related deductions are less than the standard deduction, so the ATO's ${fmtMoney(r.standard)} standard deduction is used instead.`
      : `Your work-related deductions are more than ${fmtMoney(r.standard)}, so you get them in full instead of the standard deduction (claims reduce it dollar for dollar). Keep receipts and records.`);
  }
  if (!$('cover').checked && !r.mls.rate) notes.push(`No Medicare levy surcharge at this income for a single person in ${year}.`);
  if (owe) notes.push('You may owe tax: pay it by the due date on your notice of assessment.');
  $('note').textContent = notes.join(' ');
  $('estimate-note').textContent = r.medicareEstimate ? 'The ATO hasn\'t published 2026-27 Medicare levy low-income thresholds yet, so 2025-26 ones are used (only matters below about $35,000). ' : '';
}
wireForm($('form'), update);
syncFormWithUrl($('form'), update);
addResultActions(document.querySelectorAll('.cols > .card')[1]);

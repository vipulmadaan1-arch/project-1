import { fmtMoney, readNumber, wireForm, blank, syncFormWithUrl, addResultActions, setError, setEnabled } from '../layout.js';
import { lmi, SCHEME_URL } from '../lmi.js';

const $ = (id) => document.getElementById(id);
const pct = (n) => `${n.toLocaleString('en-AU', { maximumFractionDigits: 2 })}%`;

function schemeText(r) {
  if (!r.needed) return 'Not needed';
  return r.scheme.eligible ? 'Could avoid LMI' : 'Not eligible';
}

function update() {
  const isLoan = $('mode').value === 'loan';
  $('amount-label').textContent = isLoan ? 'Loan amount ($)' : 'Deposit ($)';
  const home = $('home').checked;
  const state = $('state').value;
  // The ACT has one price cap for the whole territory, so the area choice doesn't matter there.
  setEnabled($('area'), state !== 'ACT', 'The ACT has one price cap for the whole territory, so this doesn\'t apply.');
  const value = readNumber($('value'), { name: 'Property value', unit: 'money', above: 0, max: 1e9 });
  const amount = readNumber($('amount'), { name: isLoan ? 'Loan amount' : 'Deposit', unit: 'money', min: 0, max: 1e9 });
  let loan = null;
  if (value !== null && amount !== null) {
    loan = isLoan ? amount : value - amount;
    if (loan < 0) { setError($('amount'), 'Deposit must be no more than the property value'); loan = null; }
    else if (loan > value) { setError($('amount'), 'Loan must be no more than the property value'); loan = null; }
  }
  const r = loan === null ? null : lmi({ state, value, loan, firstHome: $('fhb').checked, home, area: $('area').value });
  if (!r) {
    $('note').textContent = '';
    $('rows').innerHTML = '';
    return blank($('total'), $('lvr'), $('loan'), $('premium'), $('duty'), $('scheme'));
  }
  $('lvr').textContent = pct(r.lvr);
  $('loan').textContent = fmtMoney(r.loan);
  $('duty-label').textContent = `Duty on the premium (${r.duty.rate ? pct(r.duty.rate * 100) : 'nil'} in ${state})`;
  $('premium-label').textContent = r.rate ? `LMI premium (estimate, ${r.rate.toLocaleString('en-AU', { maximumFractionDigits: 3 })}% of the loan)` : 'LMI premium (estimate)';
  $('scheme').textContent = schemeText(r);
  const src = $('source');
  src.href = r.duty.source;
  src.textContent = r.duty.office;

  const notes = [];
  if (r.overMax) {
    $('total').textContent = 'Over 95%';
    blank($('premium'), $('duty'));
    notes.push('Most lenders won\'t lend more than 95% of the value with LMI, so there\'s no estimate. A bigger deposit, a guarantor or the 5% Deposit Scheme are the usual options.');
  } else {
    $('total').textContent = fmtMoney(r.total);
    $('premium').textContent = fmtMoney(r.premium);
    $('duty').textContent = fmtMoney(r.dutyOnPremium);
    if (!r.needed) notes.push('No LMI: you\'re borrowing 80% or less of the value.');
    if (r.aboveTable) notes.push('The published table stops at $1 million loans, so this uses its top band. Expect a higher real quote.');
  }
  if (r.duty.note) notes.push(r.duty.note);
  if (r.needed) {
    if (r.scheme.eligible) notes.push(`You may be able to skip LMI with the Australian Government 5% Deposit Scheme: no income cap, at least a 5% deposit, price under ${fmtMoney(r.scheme.cap)} here. Apply through a participating lender.`);
    else notes.push(`The 5% Deposit Scheme (no LMI) isn't an option here because ${r.scheme.reasons.join(', and ')}.`);
  }
  $('note').textContent = notes.join(' ');
  if (r.needed) {
    const a = document.createElement('a');
    a.href = SCHEME_URL; a.target = '_blank'; a.rel = 'noopener noreferrer';
    a.textContent = 'About the 5% Deposit Scheme';
    $('note').append(' ', a);
  }

  // The same property with 5%, 10%, 15% and 20% deposits.
  $('rows').innerHTML = [0.05, 0.1, 0.15, 0.2].map((d) => {
    const x = lmi({ state, value, loan: value * (1 - d), firstHome: $('fhb').checked, home, area: $('area').value });
    return `<tr><td>${pct(d * 100)} (${fmtMoney(value * d)})</td><td>${pct(x.lvr)}</td><td>${fmtMoney(x.loan)}</td><td>${fmtMoney(x.total)}</td></tr>`;
  }).join('');
}
wireForm($('form'), update);
syncFormWithUrl($('form'), update);
addResultActions(document.querySelectorAll('.cols > .card')[1]);

import { fmtMoney, readNumber, wireForm, blank, syncFormWithUrl, addResultActions, setError, setEnabled, partsFormat, nextStep } from '../layout.js';
import { upfrontCosts } from '../upfront.js';
import { SCHEME_URL } from '../lmi.js';

const $ = (id) => document.getElementById(id);
const pct = (n) => `${n.toLocaleString('en-AU', { maximumFractionDigits: 2 })}%`;
const next = nextStep();
const money = (id, name) => readNumber($(id), { name, unit: 'money', min: 0, max: 1e9, optional: true });

function update() {
  const home = $('home').checked;
  // Options that need the one before them are unticked when they're switched off, so what's shown is what's calculated.
  for (const id of ['fhb', 'newhome']) { setEnabled($(id), home, "Only for a home you'll live in. Tick “I'll live in it” to use this."); if (!home) $(id).checked = false; }
  const fhb = $('fhb').checked;
  setEnabled($('scheme'), fhb, 'Only for first home buyers. Tick “First home buyer” to use this.');
  if (!fhb) $('scheme').checked = false;
  setEnabled($('area'), $('state').value !== 'ACT', 'The ACT has one price cap for the whole territory, so this doesn\'t apply.');

  const price = readNumber($('price'), { name: 'Purchase price', unit: 'money', above: 0, max: 1e9 });
  let deposit = readNumber($('deposit'), { name: 'Deposit', unit: 'money', min: 0, max: 1e9 });
  if (price !== null && deposit !== null && deposit > price) { setError($('deposit'), 'Deposit must be no more than the purchase price'); deposit = null; }
  const legal = money('legal', 'Conveyancing and legal');
  const inspection = money('inspection', 'Building and pest inspection');
  const loanFee = money('loanfee', 'Loan application fee');
  const other = money('other', 'Other costs');
  const r = [price, deposit, legal, inspection, loanFee, other].includes(null) ? null : upfrontCosts({
    state: $('state').value, price, deposit, home, firstHome: fhb, newHome: $('newhome').checked, area: $('area').value,
    legal, inspection, loanFee, other, lmiToLoan: $('lmiloan').checked, scheme: $('scheme').checked,
  });
  if (!r) {
    $('note').textContent = ''; $('estimate-note').textContent = ''; $('rows').innerHTML = ''; next(null);
    return blank($('cash'), $('dep'), $('costs'), $('duty'), $('loan'), $('lvr'));
  }
  // Whole dollars from $1,000 up, registration fees to the cent, unless rounding would stop the figures adding up.
  const amounts = r.items.map((i) => i.amount);
  const dollars = partsFormat([[deposit, r.costs], r.cash], [amounts, r.costs], [[deposit, ...amounts], r.cash]);
  $('cash').textContent = dollars(r.cash);
  $('dep').textContent = dollars(deposit);
  $('costs').textContent = dollars(r.costs);
  $('duty').textContent = dollars(r.duty.total);
  $('loan-label').textContent = $('lmiloan').checked && r.lmiCost ? 'Loan amount, including LMI' : 'Loan amount';
  $('loan').textContent = fmtMoney(r.loanWithLmi);
  $('lvr').textContent = pct(r.lvr);
  const loan = Math.round(r.loanWithLmi);
  next(loan > 0 ? { principal: loan } : null);
  $('duty-source').href = r.duty.state.source; $('duty-source').textContent = r.duty.state.office;
  $('rego-source').href = r.rego.source; $('rego-source').textContent = r.rego.office;

  const notes = [];
  if (r.duty.note) notes.push(`Stamp duty: ${r.duty.note}`);
  if (r.lmi.overMax && !r.schemeUsed) notes.push('Your deposit is under 5%, which most lenders won\'t accept even with LMI, so LMI isn\'t included.');
  if (r.lmi.needed && r.schemeUsed) notes.push('With the 5% Deposit Scheme you pay no LMI. Check the price cap for your suburb with a participating lender.');
  else if ($('scheme').checked && r.lmi.needed && !r.lmi.overMax) notes.push(`The 5% Deposit Scheme doesn't apply because ${r.lmi.scheme.reasons.join(', and ')}, so LMI is included.`);
  else if (r.lmi.needed && r.lmi.scheme.eligible) notes.push('LMI is included because you\'re borrowing more than 80%. You could skip it with the 5% Deposit Scheme: tick it above to compare.');
  else if (r.lmi.needed && !r.lmi.overMax) notes.push('LMI is included because you\'re borrowing more than 80% of the price. A 20% deposit avoids it.');
  if (r.rego.missing) notes.push('Northern Territory registration fees for 2026-27 aren\'t included: we couldn\'t confirm them. Add them under other costs from your conveyancer\'s quote.');
  $('note').textContent = notes.join(' ');
  if (r.lmi.needed) {
    const a = document.createElement('a');
    a.href = SCHEME_URL; a.target = '_blank'; a.rel = 'noopener noreferrer';
    a.textContent = 'About the 5% Deposit Scheme';
    $('note').append(' ', a);
  }
  $('estimate-note').textContent = [
    r.duty.estimate ? 'Part of the stamp duty uses a formula from independent calculators. ' : '',
    r.rego.estimate ? `Some ${r.duty.state.code} registration fees are estimates because the land titles office publishes only a calculator or document. ` : '',
  ].join('');

  const src = (i) => {
    if (i.key === 'duty') return r.duty.estimate ? 'Revenue office (part estimate)' : 'Revenue office';
    if (i.key === 'transfer' || i.key === 'mortgage') return i.missing ? 'Not included' : r.rego.estimate ? 'Land titles office (estimate)' : 'Land titles office';
    if (i.key === 'other') return 'Your figure';
    return 'Estimate';
  };
  const rows = [{ label: 'Deposit', amount: deposit, s: 'Your figure' }, ...r.items.map((i) => ({ label: i.label, amount: i.amount, s: src(i) }))];
  $('rows').innerHTML = `${rows.map((x) => `<tr><td>${x.label}</td><td>${dollars(x.amount)}</td><td>${x.s}</td></tr>`).join('')}<tr class="total-row"><th scope="row">Total cash needed</th><td>${dollars(r.cash)}</td><td></td></tr>`;
}
wireForm($('form'), update);
syncFormWithUrl($('form'), update);
addResultActions(document.querySelectorAll('.cols > .card')[1]);

import { fmtMoney, readNumber, wireForm, blank, syncFormWithUrl, addResultActions, nextStep } from '../layout.js';
import { borrowingPower, APRA_BUFFER, DTI_LIMIT } from '../borrowing.js';

const $ = (id) => document.getElementById(id);
const show = (id, on) => { $(id).hidden = !on; };
const OUT = ['total', 'repay', 'assess', 'net', 'spend', 'debts', 'surplus', 'dti'];
const next = nextStep();
const rate = (n) => `${Number(n.toFixed(2)).toLocaleString('en-AU')}%`;

function update() {
  const two = $('applicants').value === '2';
  show('income2-field', two);
  show('help2-field', two);
  if (!two) $('help2').checked = false;
  $('income1-label').textContent = two ? 'First borrower\'s income before tax ($ a year)' : 'Your income before tax ($ a year)';
  $('help1-label').textContent = two ? 'First borrower has a HECS or HELP debt' : 'I have a HECS or HELP debt';

  const v = {
    income1: readNumber($('income1'), { name: 'Income', unit: 'money', min: 0, max: 1e9 }),
    income2: two ? readNumber($('income2'), { name: 'Second borrower\'s income', unit: 'money', min: 0, max: 1e9 }) : 0,
    other: readNumber($('other'), { name: 'Rental or other income', unit: 'money', min: 0, max: 1e9, optional: true }),
    expenses: readNumber($('expenses'), { name: 'Living expenses', unit: 'money', min: 0, max: 1e8 }),
    cards: readNumber($('cards'), { name: 'Credit card limits', unit: 'money', min: 0, max: 1e8, optional: true }),
    repayments: readNumber($('repayments'), { name: 'Other loan repayments', unit: 'money', min: 0, max: 1e8, optional: true }),
    owing: readNumber($('owing'), { name: 'Total owing', unit: 'money', min: 0, max: 1e10, optional: true }),
    rate: readNumber($('rate'), { name: 'Interest rate', unit: 'percent', min: 0, max: 30, example: '6' }),
    years: readNumber($('years'), { name: 'Loan term', unit: 'years', min: 1, max: 40, whole: true, example: '30' }),
  };
  if (Object.values(v).includes(null)) { $('note').textContent = ''; next(null); return blank(...OUT.map($)); }

  const applicants = [{ income: v.income1, help: $('help1').checked }];
  if (two) applicants.push({ income: v.income2, help: $('help2').checked });
  const r = borrowingPower({
    applicants, otherIncome: v.other, expenses: v.expenses, cardLimits: v.cards,
    otherRepayments: v.repayments, otherDebt: v.owing, ratePct: v.rate, years: v.years,
  });

  const maxLoan = Math.floor(r.maxLoan / 1000) * 1000;
  $('total').textContent = fmtMoney(maxLoan);
  // Cash needed to buy with this loan: the price is the loan plus a 10% deposit (the deposit is
  // 10% of the price, as in the upfront costs calculator's own example).
  const price = Math.round(maxLoan / 0.9 / 1000) * 1000;
  next(maxLoan > 0 ? { price, deposit: price - maxLoan } : null);
  $('repay-label').textContent = `Monthly repayment at ${rate(v.rate)}`;
  $('repay').textContent = fmtMoney(r.repayment);
  $('assess-label').textContent = `Repayment the bank tests, at ${rate(r.assessRate)}`;
  $('assess').textContent = fmtMoney(r.assessedRepayment);
  $('net').textContent = fmtMoney(r.netMonthly);
  $('spend').textContent = fmtMoney(v.expenses);
  $('debts').textContent = fmtMoney(r.commitments);
  $('surplus').textContent = fmtMoney(r.surplus);
  $('dti').textContent = r.dti == null ? '–' : `${r.dti.toFixed(1)} times income`;

  const notes = [];
  if (r.surplus <= 0) notes.push('Your expenses and debts use up all of your take-home income, so a bank is unlikely to lend. Lowering credit card limits or paying off other debts helps most.');
  else notes.push(`Banks must check you could still repay at ${rate(r.assessRate)}, ${APRA_BUFFER} percentage points above your rate, so the most you can borrow is what ${fmtMoney(r.surplus)} a month repays at that rate over ${v.years} years.`);
  if (r.highDti) notes.push(`Total debt of ${DTI_LIMIT} times income or more is "high DTI". Since 1 February 2026, APRA lets each bank make only 20% of its new home loans at that level, so it may be harder to get. Keeping total debt under ${DTI_LIMIT} times income means borrowing about ${fmtMoney(Math.floor(r.dtiCapLoan / 1000) * 1000)} or less.`);
  if (v.cards > 0) notes.push(`Your card limits count as ${fmtMoney(r.cardCommitment)} a month even if you pay them off in full.`);
  const deps = Number($('dependants').value);
  notes.push(deps > 0
    ? `Lenders compare your expenses with their own minimum for a household with ${deps === 4 ? '4 or more' : deps} dependant${deps === 1 ? '' : 's'} and use the higher figure. That minimum isn't published, so this uses your figure.`
    : 'Lenders compare your expenses with their own minimum (the Household Expenditure Measure) and use the higher figure. That minimum isn\'t published, so this uses your figure.');
  $('note').textContent = notes.join(' ');
}

wireForm($('form'), update);
$('form').addEventListener('change', update); // selects and checkboxes
syncFormWithUrl($('form'), update);
addResultActions(document.querySelectorAll('.cols > .card')[1]);

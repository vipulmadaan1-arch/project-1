import { fmtMoney, readNumber, wireForm, blank, syncFormWithUrl, addResultActions } from '../layout.js';
import { project, drawdown, ASFA, PRESERVATION_AGE, CONCESSIONAL_CAP } from '../retirement.js';
import { stackedColumns } from '../chart.js';

const $ = (id) => document.getElementById(id);
const OUT = ['total', 'future', 'paidin', 'earned', 'fees', 'lasts', 'asfa-c', 'asfa-m', 'asfa-l'];
const pct = (n) => `${Math.round(n * 100)}%`;
const card = $('chart').closest('.chart-card');

function update() {
  const age = readNumber($('age'), { name: 'Your age', unit: 'years', min: 18, max: 74, whole: true, example: '35' });
  const retireAge = readNumber($('retire'), { name: 'Retirement age', unit: 'years', min: 19, max: 80, whole: true, example: '67' });
  const v = {
    balance: readNumber($('balance'), { name: 'Super balance', unit: 'money', min: 0, max: 1e9, optional: true }),
    salary: readNumber($('salary'), { name: 'Yearly salary', unit: 'money', min: 0, max: 1e8, optional: true }),
    sg: readNumber($('sg'), { name: 'Employer super', unit: 'percent', min: 0, max: 50, example: '12' }),
    sacrifice: readNumber($('sacrifice'), { name: 'Salary sacrifice', unit: 'money', min: 0, max: 1e8, optional: true }),
    returnPct: readNumber($('return'), { name: 'Investment return', unit: 'percent', min: -10, max: 20, example: '6.5' }),
    earningsTaxPct: readNumber($('etax'), { name: 'Tax on earnings', unit: 'percent', min: 0, max: 15, example: '7' }),
    feePct: readNumber($('feepct'), { name: 'Admin fee', unit: 'percent', min: 0, max: 5, optional: true, example: '0.11' }),
    feeDollar: readNumber($('feedollar'), { name: 'Admin fee in dollars', unit: 'money', min: 0, max: 1e5, optional: true }),
    wageGrowthPct: readNumber($('wage'), { name: 'Wage growth', unit: 'percent', min: -5, max: 15, example: '3.7' }),
    inflationPct: readNumber($('inflation'), { name: 'Inflation', unit: 'percent', min: -5, max: 15, example: '2.5' }),
    income: readNumber($('income'), { name: 'Retirement income', unit: 'money', min: 0, max: 1e8, optional: true }),
  };
  const fail = (msg = '') => { card.hidden = true; $('note').textContent = msg; return blank(...OUT.map($)); };
  if (age === null || retireAge === null || Object.values(v).includes(null)) return fail();
  if (retireAge <= age) return fail('Your retirement age needs to be later than your age now. Already retired? Enter next year as your retirement age.');

  const hh = ASFA[$('household').value] || ASFA.single;
  const who = $('household').value === 'couple' ? 'couple' : 'single';
  const r = project({ age, retireAge, ...v, sgRate: v.sg / 100 });
  const d = drawdown({ balance: r.balanceReal, income: v.income, startAge: retireAge, returnPct: v.returnPct, feePct: v.feePct, feeDollar: v.feeDollar, inflationPct: v.inflationPct });

  $('total-label').textContent = `Super at ${retireAge}, in today's dollars`;
  $('total').textContent = fmtMoney(r.balanceReal);
  $('future-label').textContent = `In ${new Date().getFullYear() + retireAge - age} dollars`;
  $('future').textContent = fmtMoney(r.balance);
  $('paidin').textContent = fmtMoney(r.paidInReal);
  $('earned').textContent = fmtMoney(r.earningsReal);
  $('fees').textContent = fmtMoney(r.fees);
  $('lasts-label').textContent = v.income > 0 ? `Drawing ${fmtMoney(v.income)} a year, it lasts` : 'Drawing no income, it lasts';
  $('lasts').textContent = d.lastsForever ? `Past age 110` : `${d.years < 1 ? 'Under a year' : `${Math.floor(d.years)} years`}, to ${Math.floor(d.runsOutAge)}`;
  $('asfa-c-label').textContent = `ASFA comfortable, ${who}, per year`;
  $('asfa-c').textContent = fmtMoney(hh.comfortable);
  $('asfa-m-label').textContent = `ASFA modest, ${who}, per year`;
  $('asfa-m').textContent = fmtMoney(hh.modest);
  $('asfa-l-label').textContent = `ASFA lump sum for comfortable at 67 (you: ${pct(r.balanceReal / hh.lumpComfortable)})`;
  $('asfa-l').textContent = fmtMoney(hh.lumpComfortable);

  const notes = [];
  if (r.cappedYears) notes.push(`Your employer super plus salary sacrifice would go over the ${fmtMoney(CONCESSIONAL_CAP)} concessional cap, so we cut the sacrifice back to fit in ${r.cappedYears === r.rows.length ? 'every year' : `${r.cappedYears} of ${r.rows.length} years`}.`);
  if (retireAge < PRESERVATION_AGE) notes.push(`You usually can't take your super until ${PRESERVATION_AGE} (your preservation age) and retired, or 65.`);
  if (v.income > 0) {
    const level = v.income >= hh.comfortable ? 'at or above ASFA’s comfortable' : v.income >= hh.modest ? 'between ASFA’s modest and comfortable' : 'below ASFA’s modest';
    notes.push(`Your income of ${fmtMoney(v.income)} a year is ${level} standard for a ${who} homeowner. The Age Pension (from 67) could pay part of it once your super is lower; it isn't included here.`);
  }
  $('note').textContent = notes.join(' ');

  card.hidden = false;
  stackedColumns($('chart'), {
    title: "Super balance by age in today's dollars, split into contributions and earnings",
    labels: r.rows.map((x) => x.age),
    prefix: 'Age ',
    series: [{ name: 'Starting balance and contributions', values: r.rows.map((x) => x.paidInReal) }, { name: 'Earnings after tax and fees', values: r.rows.map((x) => x.earningsReal) }],
    format: (n) => fmtMoney(n),
  });
  $('rows').innerHTML = r.rows.map((x) => `<tr><td>${x.age}</td><td>${fmtMoney(x.paidInReal)}</td><td>${fmtMoney(x.earningsReal)}</td><td>${fmtMoney(x.balanceReal)}</td><td>${fmtMoney(x.balance)}</td></tr>`).join('');
}
wireForm($('form'), update);
syncFormWithUrl($('form'), update);
addResultActions(document.querySelectorAll('.cols > .card')[1]);

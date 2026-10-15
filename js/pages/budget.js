import { fmtMoney, readNumber, wireForm, blank, syncFormWithUrl, addResultActions } from '../layout.js';
import { budget, CATEGORIES, PER_LABEL } from '../budget.js';
import { stackedColumns } from '../chart.js';

const $ = (id) => document.getElementById(id);
const OUT = ['total', 'income-out', 'spend', 'spent-share', 'needs', 'wants', 'saving'];
const pct = (n) => (n === null ? '–' : `${(Math.round(n * 1000) / 10).toLocaleString('en-AU')}%`);
const chartCard = $('chart').closest('.chart-card');
const tableCard = $('rows').closest('.chart-card');

function update() {
  const view = $('view').value;
  const per = PER_LABEL[view];
  const income = readNumber($('income'), { name: 'Take-home pay', unit: 'money', min: 0, max: 1e9 });
  const items = {};
  let bad = income === null;
  for (const c of CATEGORIES) {
    const amount = readNumber($(c.key), { name: c.label, unit: 'money', min: 0, max: 1e9, optional: true });
    if (amount === null) bad = true;
    items[c.key] = { amount, freq: $(`${c.key}-per`).value };
  }
  $('total-label').textContent = `Left over each ${per}`;
  $('amount-head').textContent = `Per ${per}`;
  if (bad) {
    chartCard.hidden = true; tableCard.hidden = true; $('note').textContent = '';
    return blank(...OUT.map($));
  }
  const r = budget({ income: { amount: income, freq: $('income-per').value }, items, view });
  const short = r.surplus < -0.005;
  $('total-label').textContent = short ? `Shortfall each ${per}` : `Left over each ${per}`;
  $('total').textContent = fmtMoney(Math.abs(r.surplus), 2);
  $('income-label').textContent = `Income per ${per}`;
  $('income-out').textContent = fmtMoney(r.income, 2);
  $('spend-label').textContent = `Spending and savings per ${per}`;
  $('spend').textContent = fmtMoney(r.spending, 2);
  $('spent-share').textContent = pct(r.spentShare);
  $('needs').textContent = pct(r.groups.needs.share);
  $('wants').textContent = pct(r.groups.wants.share);
  $('saving').textContent = pct(r.groups.savings.share);

  const notes = [];
  if (short) notes.push(`You're spending ${fmtMoney(-r.surplus, 2)} a ${per} more than you earn. Start with the biggest lines in the table below.`);
  else if (r.income > 0 && r.groups.savings.share !== null && r.groups.savings.share < 0.2) notes.push(`Putting what's left over into savings would bring your savings to ${pct((r.groups.savings.amount + r.surplus) / r.income)} of income.`);
  if (r.income === 0) notes.push('Enter your take-home pay to see shares of income.');
  $('note').innerHTML = '';
  $('note').append(notes.join(' '));
  if (short) {
    const a = document.createElement('a');
    a.href = 'https://moneysmart.gov.au/managing-debt/financial-counselling';
    a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = 'Free financial counselling';
    $('note').append(' ', a, ' (Moneysmart).');
  }

  tableCard.hidden = false;
  const shown = r.rows.filter((x) => x.yearly > 0);
  $('rows').innerHTML = shown.length
    ? shown.map((x) => `<tr><td>${x.label}</td><td>${fmtMoney(x.amount, 2)}</td><td>${pct(x.share)}</td></tr>`).join('')
      + `<tr><th scope="row">Total</th><th>${fmtMoney(r.spending, 2)}</th><th>${pct(r.spentShare)}</th></tr>`
    : '<tr><td colspan="3">Add some spending to see the breakdown.</td></tr>';

  chartCard.hidden = !(r.income > 0);
  if (r.income > 0) {
    const g = [['Needs', r.groups.needs], ['Wants', r.groups.wants], ['Savings', r.groups.savings]];
    stackedColumns($('chart'), {
      title: `Spending per ${per} on needs, wants and savings, against 50%, 30% and 20% of income`,
      labels: g.map(([name]) => name),
      series: [{ name: 'Within the rule of thumb', values: g.map(([, x]) => x.within) }, { name: 'Over the rule of thumb', values: g.map(([, x]) => x.over) }],
      format: (n) => fmtMoney(n, 2),
    });
  }
}
wireForm($('form'), update);
syncFormWithUrl($('form'), update);
addResultActions(document.querySelectorAll('.cols > .card')[1]);

import { fmtMoney, readNumber, wireForm, blank, syncFormWithUrl, addResultActions } from '../layout.js';
import { voluntaryEffect, MAX_YEARS } from '../hecs.js';
import { HELP } from '../calc.js';

const $ = (id) => document.getElementById(id);
const yrs = (n) => `${n} year${n === 1 ? '' : 's'}`;
function update() {
  const debt = readNumber($('debt'), { name: 'HECS/HELP debt', unit: 'money', min: 0, max: 1e7, example: '30,000' });
  const income = readNumber($('income'), { name: 'Income', unit: 'money', min: 0, max: 1e9, example: '85,000' });
  const payRisePct = readNumber($('rise'), { name: 'Pay rise', unit: 'percent', min: 0, max: 20, optional: true, example: '3' });
  const indexationPct = readNumber($('index'), { name: 'Indexation', unit: 'percent', min: 0, max: 20, optional: true, example: '2.8' });
  const voluntary = readNumber($('extra'), { name: 'Voluntary repayments', unit: 'money', min: 0, max: 1e7, optional: true, example: '1,000' });
  const outs = [$('total'), $('final'), $('repaid'), $('indexation'), $('compulsory'), $('voluntary'), $('saved'), $('isaved')];
  if ([debt, income, payRisePct, indexationPct, voluntary].includes(null)) {
    $('head').replaceChildren(); $('rows').replaceChildren(); $('note').textContent = '';
    return blank(...outs);
  }
  const { plan: r, base, yearsSaved, indexationSaved } = voluntaryEffect({ debt, income, payRisePct, indexationPct, voluntary });
  $('total').textContent = r.repaid ? yrs(r.years) : `Not within ${MAX_YEARS} years`;
  $('final').textContent = r.finalYear ?? '–';
  $('repaid').textContent = fmtMoney(r.totalRepaid);
  $('indexation').textContent = fmtMoney(r.totalIndexation);
  $('compulsory').textContent = fmtMoney(r.totalCompulsory);
  $('voluntary').textContent = fmtMoney(r.totalVoluntary);
  const hasVol = voluntary > 0 && debt > 0;
  $('vol-row').hidden = !hasVol;
  $('saved-row').hidden = !hasVol;
  $('isaved-row').hidden = !hasVol;
  $('saved').textContent = yearsSaved !== null ? yrs(yearsSaved) : base.repaid ? '–' : `Repaid in ${yrs(r.years ?? 0)} instead of not at all`;
  $('isaved').textContent = fmtMoney(indexationSaved);
  const notes = [];
  if (!r.repaid) notes.push(`At this income your repayments don't keep up with indexation, so the debt would still be ${fmtMoney(r.remaining)} after ${MAX_YEARS} years. HELP debts aren't written off while you're alive.`);
  if (income <= HELP.threshold && debt > 0) notes.push(`Nothing is repaid compulsorily in 2026-27 on income of ${fmtMoney(HELP.threshold)} or less.`);
  $('note').textContent = notes.join(' ');
  $('head').innerHTML = `<tr><th>Income year</th><th>Income</th><th>Indexation</th>${hasVol ? '<th>Voluntary</th>' : ''}<th>Compulsory</th><th>Balance after</th></tr>`;
  $('rows').innerHTML = r.rows.map((y) =>
    `<tr><td>${y.label.replace('-', '\u2011')}</td><td>${fmtMoney(y.income)}</td><td>${fmtMoney(y.indexation)}</td>${hasVol ? `<td>${fmtMoney(y.voluntary)}</td>` : ''}<td>${fmtMoney(y.compulsory)}</td><td>${fmtMoney(y.balance)}</td></tr>`).join('');
}
wireForm($('form'), update);
syncFormWithUrl($('form'), update);
addResultActions(document.querySelectorAll('.cols > .card')[1]);

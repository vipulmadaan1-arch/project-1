import { fmtMoney, readNumber, wireForm, blank, syncFormWithUrl, addResultActions } from '../layout.js';
import { grossUp } from '../grossup.js';

const $ = (id) => document.getElementById(id);
const LABEL = { 1: 'year', 12: 'month', 26: 'fortnight', 52: 'week' };
function update() {
  const per = +$('period').value;
  const incl = $('incl').checked;
  const help = $('help').checked;
  $('help-row').hidden = !help;
  $('total-label').textContent = incl ? 'Package needed per year (including super)' : 'Salary needed per year (plus super)';
  $('per-label').textContent = `${incl ? 'Package' : 'Salary'} per ${LABEL[per]}`;
  const want = readNumber($('want'), { name: 'Take-home pay', unit: 'money', min: 0, max: 1e9, example: '2,500' });
  if (want === null) {
    $('note').textContent = '';
    return blank($('total'), $('per'), $('net'), $('tax'), $('medicare'), $('helpamt'), $('super'), $('package'));
  }
  const opts = { includesSuper: incl, help, standardDeduction: $('std').checked };
  const r = grossUp(want * per, opts);
  $('total').textContent = fmtMoney(r.gross);
  $('per').textContent = fmtMoney(r.gross / per);
  $('net').textContent = fmtMoney(r.net);
  $('tax').textContent = fmtMoney(r.tax);
  $('medicare').textContent = fmtMoney(r.medicare);
  $('helpamt').textContent = fmtMoney(r.help);
  $('super').textContent = fmtMoney(r.super);
  $('package').textContent = fmtMoney(r.package);
  // How much more you'd need to earn for an extra $1,000 a year in your pocket, at this level.
  const extra = want > 0 ? grossUp(want * per + 1000, opts).gross - r.gross : 0;
  $('note').textContent = want > 0
    ? `At this level, each extra $1,000 a year in your pocket needs about ${fmtMoney(extra)} more ${incl ? 'package' : 'salary'}.`
    : '';
}
wireForm($('form'), update);
syncFormWithUrl($('form'), update);
addResultActions(document.querySelectorAll('.cols > .card')[1]);

import { fmtMoney, readNumber, wireForm, blank, syncFormWithUrl, addResultActions } from '../layout.js';
import { balanceTransfer, transferPayoff } from '../balance-transfer.js';
import { describeMonths } from '../loans.js';
import { stackedColumns } from '../chart.js';

const $ = (id) => document.getElementById(id);
const NEVER = { interest: 'Never', 'too-long': '100+ years' };
const OUT = ['total', 'stay-time', 'stay-cost', 'stay-left', 'fee-out', 'move-interest', 'move-cost', 'move-time', 'move-left', 'clear'];

function update() {
  const balance = readNumber($('balance'), { name: 'Card balance', unit: 'money', above: 0, max: 1e8, example: '5,000' });
  const currentRatePct = readNumber($('rate'), { name: 'Current card interest rate', unit: 'percent', min: 0, max: 100, example: '20' });
  const payment = readNumber($('payment'), { name: 'Monthly repayment', unit: 'money', above: 0, max: 1e8, example: '300' });
  const feePct = readNumber($('fee'), { name: 'Balance transfer fee', unit: 'percent', min: 0, max: 20, optional: true, example: '2' });
  const introRatePct = readNumber($('intro'), { name: 'Intro interest rate', unit: 'percent', min: 0, max: 100, optional: true, example: '0' });
  const introMonths = readNumber($('months'), { name: 'Intro period', unit: 'plain', min: 0, max: 60, whole: true, example: '12' });
  const revertRatePct = readNumber($('revert'), { name: 'Revert rate', unit: 'percent', min: 0, max: 100, example: '21' });
  const card = $('chart').closest('.chart-card');
  if ([balance, currentRatePct, payment, feePct, introRatePct, introMonths, revertRatePct].includes(null)) {
    card.hidden = true;
    $('note').textContent = '';
    return blank(...OUT.map($));
  }
  document.querySelectorAll('.intro-n').forEach((el) => { el.textContent = introMonths; });
  const r = balanceTransfer({ balance, currentRatePct, feePct, introRatePct, introMonths, revertRatePct, payment });
  // What staying would leave owing at the end of the intro period (same model, one rate throughout).
  const stayAtIntro = transferPayoff({ balance, introRatePct: currentRatePct, introMonths, revertRatePct: currentRatePct, payment });

  if (r.saving === null) {
    $('total-label').textContent = r.move.paysOff ? 'The transfer clears your card; staying never does' : 'Neither option clears the card';
    $('total').textContent = r.move.paysOff ? fmtMoney(r.move.cost) : 'Never';
  } else {
    $('total-label').textContent = r.saving >= 0 ? 'You save with the transfer' : 'The transfer costs you more by';
    $('total').textContent = fmtMoney(Math.abs(r.saving));
  }
  const time = (x) => (x.paysOff ? describeMonths(x.months) : NEVER[x.reason]);
  $('stay-time').textContent = time(r.stay);
  $('stay-cost').textContent = r.stay.paysOff ? fmtMoney(r.stay.interest) : '–';
  $('stay-left').textContent = fmtMoney(stayAtIntro.leftAtIntroEnd ?? 0);
  $('fee-out').textContent = fmtMoney(r.fee, 2);
  $('move-interest').textContent = r.move.paysOff ? fmtMoney(r.move.interest) : '–';
  $('move-cost').textContent = r.move.paysOff ? fmtMoney(r.move.cost) : '–';
  $('move-time').textContent = time(r.move);
  $('move-left').textContent = fmtMoney(r.move.leftAtIntroEnd ?? 0);
  $('clear').textContent = r.clearInIntro === null ? '–' : fmtMoney(r.clearInIntro, 2);

  const notes = [];
  if (introMonths > 0 && r.move.leftAtIntroEnd > 0.005) notes.push(`${fmtMoney(r.move.leftAtIntroEnd)} will still be owing when the intro period ends and starts attracting ${revertRatePct}% interest. Paying ${fmtMoney(r.clearInIntro, 2)} a month would clear it in time.`);
  if (!r.move.paysOff && r.move.reason === 'interest') notes.push('After the intro period your repayment won’t cover the interest at the revert rate, so the balance would never go down.');
  if (!r.stay.paysOff && r.stay.reason === 'interest') notes.push('On your current card the repayment doesn’t cover the monthly interest.');
  notes.push('New purchases on a balance transfer card often attract interest straight away, so avoid using it for spending.');
  $('note').textContent = notes.join(' ');

  const finite = (n) => (Number.isFinite(n) ? n : 0);
  if (r.stay.paysOff || r.move.paysOff) {
    card.hidden = false;
    stackedColumns($('chart'), {
      title: 'Interest and fees if you stay or transfer',
      labels: ['Stay', 'Transfer'],
      series: [{ name: 'Interest', values: [finite(r.stay.interest), finite(r.move.interest)] }, { name: 'Transfer fee', values: [0, r.fee] }],
      format: (n) => fmtMoney(n),
    });
  } else card.hidden = true;
  const cell = (x) => (Number.isFinite(x) ? fmtMoney(x) : 'Never cleared');
  $('rows').innerHTML = `<tr><td>Stay</td><td>${cell(r.stay.interest)}</td><td>${fmtMoney(0)}</td><td>${cell(r.stay.cost)}</td></tr>`
    + `<tr><td>Transfer</td><td>${cell(r.move.interest)}</td><td>${fmtMoney(r.fee)}</td><td>${cell(r.move.cost)}</td></tr>`;
}
wireForm($('form'), update);
syncFormWithUrl($('form'), update);
addResultActions(document.querySelectorAll('.cols > .card')[1]);

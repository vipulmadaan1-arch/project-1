import { fmtMoney, readNumber, wireForm, blank, syncFormWithUrl, addResultActions, setError } from '../layout.js';
import { capitalGainsTax, oldRulesTax, REFORM_START } from '../cgt.js';

const $ = (id) => document.getElementById(id);
const show = (id, on) => { $(id).hidden = !on; };
const OUT = ['total', 'factor', 'gross', 'deferred', 'post', 'net', 'tax', 'mintax', 'rate', 'old'];

function readDates() {
  const bought = $('bought').value, sold = $('sold').value;
  setError($('bought'), bought ? '' : 'Enter the date you bought it');
  if (!sold) setError($('sold'), 'Enter the date you sold it');
  else if (bought && sold < bought) setError($('sold'), 'The sale date must be on or after the purchase date');
  else if (sold < '2024-07-01') setError($('sold'), 'Enter a sale from 1 July 2024 onwards');
  else setError($('sold'), '');
  return bought && sold && sold >= bought && sold >= '2024-07-01' ? { bought, sold } : null;
}

function update() {
  const asset = $('asset').value;
  const dates = readDates();
  const heldAcross = dates && dates.bought < REFORM_START && dates.sold >= REFORM_START && asset !== 'newbuild' && asset !== 'home';
  show('start-value-field', !!heldAcross);
  const v = {
    price: readNumber($('price'), { name: 'Purchase price', unit: 'money', above: 0, max: 1e12 }),
    buyCosts: readNumber($('buy-costs'), { name: 'Buying costs', unit: 'money', min: 0, max: 1e12, optional: true }),
    proceeds: readNumber($('proceeds'), { name: 'Sale price', unit: 'money', min: 0, max: 1e12 }),
    sellCosts: readNumber($('sell-costs'), { name: 'Selling costs', unit: 'money', min: 0, max: 1e12, optional: true }),
    income: readNumber($('income'), { name: 'Other taxable income', unit: 'money', min: 0, max: 1e10, optional: true }),
    priorLosses: readNumber($('losses'), { name: 'Capital losses', unit: 'money', min: 0, max: 1e12, optional: true }),
    inflation: readNumber($('inflation'), { name: 'Assumed inflation', unit: 'percent', min: -5, max: 20 }),
    startValue: heldAcross ? readNumber($('start-value'), { name: 'Value at 30 June 2027', unit: 'money', min: 0, max: 1e12, optional: true }) : 0,
  };
  // Joint owners: each is taxed on their share of the gain, at their own rates (ATO). Scale the asset's figures.
  const share = readNumber($('share'), { name: 'Ownership share', unit: 'percent', above: 0, max: 100 });
  if (share != null && share < 100) for (const k of ['price', 'buyCosts', 'proceeds', 'sellCosts', 'startValue']) if (v[k]) v[k] *= share / 100;
  if (share == null) v.share = null;
  const r = dates && !Object.values(v).includes(null) ? capitalGainsTax({
    asset, ...dates, ...v, inflation: v.inflation / 100, foreign: $('foreign').checked, support: $('support').checked,
  }) : null;
  if (!r) { $('note').textContent = ''; $('projected-note').textContent = ''; return blank(...OUT.map($)); }

  const isNew = r.rules === 'new';
  $('total').textContent = fmtMoney(r.total);
  $('gross-label').textContent = r.gross < 0 ? 'Capital loss' : 'Capital gain';
  $('gross').textContent = fmtMoney(Math.abs(r.gross));
  show('split-row', isNew && r.startValue != null);
  $('deferred').textContent = fmtMoney(r.deferredGain ?? 0);
  show('post-row', isNew && !r.exempt);
  $('post-label').textContent = r.choice === 'discount' ? 'Gain after the 50% new-build discount'
    : r.startValue != null ? 'Gain from 1 July 2027, indexed' : 'Gain after indexation';
  show('factor-row', isNew && r.choice !== 'discount' && !r.exempt && r.factor != null);
  $('factor').textContent = `×${(r.factor ?? 1).toFixed(3)}`;
  $('post').textContent = fmtMoney(r.choice === 'discount' ? r.netGain : r.postGain ?? 0);
  $('net').textContent = fmtMoney(r.netGain);
  $('tax').textContent = fmtMoney(r.tax);
  $('mintax').textContent = fmtMoney(r.minTax);
  $('rate').textContent = r.gross > 0 ? `${((r.total / r.gross) * 100).toFixed(1)}%` : '–';
  show('old-row', isNew);
  $('old').textContent = fmtMoney(oldRulesTax({ asset, ...dates, ...v, foreign: $('foreign').checked }));

  const notes = [...r.notes];
  if (r.gross < 0) notes.unshift(`A capital loss of ${fmtMoney(-r.gross)} can be carried forward to reduce future capital gains.`);
  else if (r.loss > 0) notes.unshift(`${fmtMoney(r.loss)} of capital loss is left to carry forward.`);
  if (r.lossesUsed > 0) notes.push(`${fmtMoney(r.lossesUsed)} of your carried-forward losses were used.`);
  if (share < 100) notes.push(`These figures are your ${share.toLocaleString('en-AU')}% share: gain and tax. Your co-owner works out theirs the same way, with their own income.`);
  $('note').textContent = notes.join(' ');
  $('projected-note').textContent = r.projected ? `Indexation uses projected CPI at ${v.inflation}% a year, as future figures aren't published yet. ` : '';
}

wireForm($('form'), update);
$('form').addEventListener('change', update); // date pickers and selects
syncFormWithUrl($('form'), update);
addResultActions(document.querySelectorAll('.cols > .card')[1]);

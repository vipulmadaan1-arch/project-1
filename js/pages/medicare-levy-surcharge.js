import { fmtMoney, readNumber, wireForm, blank, syncFormWithUrl, addResultActions } from '../layout.js';
import { medicareLevySurcharge, SPOUSE_EXEMPT, MAX_EXCESS } from '../mls.js';

const $ = (id) => document.getElementById(id);
const show = (id, on) => { $(id).hidden = !on; };
const OUT = ['total', 'income', 'rate', 'threshold', 'base', 'premium-out', 'diff'];
const pct = (r) => `${(r * 100).toLocaleString('en-AU', { maximumFractionDigits: 2 })}%`;

function update() {
  const status = $('status').value;
  const family = status !== 'single';
  const spouse = status === 'couple';
  show('children-field', family);
  show('spouse-field', spouse);
  // A single parent has at least one dependent child.
  if (status === 'parent' && $('children').value.trim() === '0') $('children').value = '1';
  const v = {
    children: family ? readNumber($('children'), { name: 'Dependent children', min: status === 'parent' ? 1 : 0, max: 30, whole: true, example: '2' }) : 0,
    taxable: readNumber($('taxable'), { name: 'Taxable income', unit: 'money', min: 0, max: 1e10 }),
    fringe: readNumber($('fringe'), { name: 'Reportable fringe benefits', unit: 'money', min: 0, max: 1e9, optional: true }),
    investmentLosses: readNumber($('losses'), { name: 'Net investment losses', unit: 'money', min: 0, max: 1e9, optional: true }),
    reportableSuper: readNumber($('rsc'), { name: 'Reportable super contributions', unit: 'money', min: 0, max: 1e9, optional: true }),
    spouseIncome: spouse ? readNumber($('spouse'), { name: 'Spouse’s income', unit: 'money', min: 0, max: 1e10, optional: true }) : 0,
    days: readNumber($('days'), { name: 'Days without cover', unit: 'days', min: 0, max: 366, whole: true, example: '365' }),
    premium: readNumber($('premium'), { name: 'Hospital cover premium', unit: 'money', min: 0, max: 1e7, optional: true }),
  };
  if (Object.values(v).includes(null)) { $('note').textContent = ''; $('estimate-note').textContent = ''; return blank(...OUT.map($)); }
  const r = medicareLevySurcharge({
    own: { taxable: v.taxable, fringe: v.fringe, investmentLosses: v.investmentLosses, reportableSuper: v.reportableSuper },
    family, spouse, spouseIncome: v.spouseIncome, children: v.children, days: Math.min(365, v.days), premium: v.premium,
  });

  $('total').textContent = fmtMoney(r.surcharge);
  $('income-label').textContent = spouse ? 'Combined income for MLS purposes' : 'Income for MLS purposes';
  $('income').textContent = fmtMoney(r.income);
  $('rate').textContent = r.tier ? `${pct(r.rate)} (tier ${r.tier})` : '0% (base tier)';
  $('threshold').textContent = fmtMoney(r.freeLimit);
  $('base').textContent = fmtMoney(r.base);
  $('premium-out').textContent = v.premium ? fmtMoney(v.premium) : '–';
  if (!v.premium) {
    $('diff-label').textContent = 'Cover compared with the surcharge';
    $('diff').textContent = '–';
  } else if (r.difference >= 0) {
    $('diff-label').textContent = 'Cover costs less by';
    $('diff').textContent = fmtMoney(r.difference);
  } else {
    $('diff-label').textContent = 'Cover costs more by';
    $('diff').textContent = fmtMoney(-r.difference);
  }

  const notes = [];
  const excess = MAX_EXCESS[family ? 'family' : 'single'];
  if (r.lowIncome) {
    notes.push(`Your combined income is over the family threshold, but your own income for MLS purposes is ${fmtMoney(SPOUSE_EXEMPT)} or less, so you don’t pay the surcharge. Your spouse may.`);
  } else if (r.tier === 0) {
    notes.push(`No surcharge: your ${spouse ? 'combined ' : ''}income for MLS purposes is at or under ${fmtMoney(r.freeLimit)}.`);
  } else {
    if (v.premium && r.difference > 0) notes.push(`Hospital cover costs ${fmtMoney(r.difference)} less than the surcharge, so it pays for itself on tax alone.`);
    else if (v.premium && r.difference < 0) notes.push(`On tax alone the surcharge is cheaper, by ${fmtMoney(-r.difference)}. Cover may still be worth it for what it pays for, and to avoid a Lifetime Health Cover loading later.`);
    if (r.nextLimit) notes.push(`The next rate starts above ${fmtMoney(r.nextLimit)}.`);
    if (spouse) notes.push('Your spouse pays the surcharge on their own taxable income and fringe benefits at the same rate.');
  }
  if (r.tier > 0) notes.push(`To avoid it, ${family ? 'everyone in your family needs' : 'you need'} hospital cover with an excess of ${fmtMoney(excess)} or less. Extras-only cover doesn’t count.`);
  $('note').textContent = notes.join(' ');
  $('estimate-note').textContent = r.lowIncome || (spouse && r.tier > 0 && r.ownIncome <= SPOUSE_EXEMPT + 1000)
    ? `The ${fmtMoney(SPOUSE_EXEMPT)} spouse exemption is the latest published (2025-26) figure; the 2026-27 amount is an estimate until the ATO updates it. ` : '';
}

wireForm($('form'), update);
$('form').addEventListener('change', update); // the situation select
syncFormWithUrl($('form'), update);
addResultActions(document.querySelectorAll('.cols > .card')[1]);

import { fmtMoney, readNumber, wireForm, blank, syncFormWithUrl, addResultActions } from '../layout.js';
import { salarySacrifice, CONCESSIONAL_CAP, CARRY_FORWARD_BALANCE } from '../super.js';

const $ = (id) => document.getElementById(id);
const OUT = ['total', 'sg', 'sacrificed', 'concessional', 'cap', 'taxcut', 'contrib', 'div293', 'takehome', 'added'];
const signed = (n) => (Math.round(n) < 0 ? `−${fmtMoney(-n)}` : Math.round(n) > 0 ? `+${fmtMoney(n)}` : fmtMoney(0));

function update() {
  const per = Number($('per').value) || 1;
  const v = {
    salary: readNumber($('salary'), { name: 'Yearly salary', unit: 'money', min: 0, max: 1e9 }),
    sacrifice: readNumber($('sacrifice'), { name: 'Salary sacrifice amount', unit: 'money', min: 0, max: 1e9, optional: true }),
    personal: readNumber($('personal'), { name: 'Personal contributions', unit: 'money', min: 0, max: 1e9, optional: true }),
    unusedCap: readNumber($('unused'), { name: 'Unused cap carried forward', unit: 'money', min: 0, max: 1e7, optional: true }),
    otherIncome: readNumber($('other'), { name: 'Other income', unit: 'money', min: 0, max: 1e10, optional: true }),
  };
  if (Object.values(v).includes(null)) { $('note').textContent = ''; $('estimate-note').textContent = ''; return blank(...OUT.map($)); }
  const sacrifice = v.sacrifice * per;
  if (sacrifice > v.salary) {
    $('note').textContent = 'You can’t salary sacrifice more than your salary. Lower the amount or check the “per” setting.';
    $('estimate-note').textContent = '';
    return blank(...OUT.map($));
  }
  const r = salarySacrifice({ ...v, sacrifice });

  $('total').textContent = fmtMoney(Math.max(0, r.taxSaved));
  $('total-label').textContent = r.taxSaved < -0.5 ? 'Extra tax from salary sacrificing, per year' : 'Tax saved by salary sacrificing, per year';
  if (r.taxSaved < -0.5) $('total').textContent = fmtMoney(-r.taxSaved);
  $('sg').textContent = fmtMoney(r.sg);
  $('sacrificed').textContent = fmtMoney(sacrifice);
  $('concessional').textContent = fmtMoney(r.concessional);
  $('cap-label').textContent = v.unusedCap ? 'Concessional cap with carry-forward' : 'Concessional cap';
  $('cap').textContent = fmtMoney(r.cap);
  $('taxcut').textContent = fmtMoney(r.incomeTaxSaved);
  $('contrib').textContent = r.extraContribTax ? `−${fmtMoney(r.extraContribTax)}` : fmtMoney(0);
  $('div293').textContent = r.extraDiv293 > 0.5 ? `−${fmtMoney(r.extraDiv293)}` : fmtMoney(0);
  $('takehome').textContent = signed(r.takeHomeChange);
  $('added').textContent = fmtMoney(Math.max(0, r.superAdded));

  const notes = [];
  if (r.excess > 0) {
    notes.push(`Over the cap: your concessional contributions are ${fmtMoney(r.excess)} more than your ${fmtMoney(r.cap)} cap. The excess is added to your taxable income and taxed at your marginal rate, less a 15% offset for tax the fund already paid, so it saves you little or nothing. Lower your salary sacrifice, or check your carry-forward amount in myGov.`);
  } else if (sacrifice > 0 || v.personal > 0) {
    notes.push(`You have ${fmtMoney(r.remaining)} of cap left this year.`);
  } else {
    notes.push(`Your employer’s 12% uses ${fmtMoney(r.sg)} of the ${fmtMoney(CONCESSIONAL_CAP)} cap, leaving ${fmtMoney(r.remaining)} you could salary sacrifice.`);
  }
  if (sacrifice > 0 && r.marginalRate <= 0.17 && r.excess === 0) {
    notes.push(`At your income, tax on salary is about the same as or less than the 15% contributions tax, so salary sacrificing saves little or costs you.`);
  }
  if (r.div293 > 0.5) {
    notes.push(`Division 293: income plus concessional contributions are over $250,000, so ${fmtMoney(r.div293)} of extra 15% tax applies to your contributions this year${r.extraDiv293 > 0.5 ? `, ${fmtMoney(r.extraDiv293)} of it from the sacrifice` : ''}. The ATO bills you separately; you can pay it from super.`);
  }
  if (per > 1 && sacrifice > 0) {
    const perLabel = { 12: 'month', 26: 'fortnight', 52: 'week' }[per];
    notes.push(`Take-home pay changes by about ${signed(r.takeHomeChange / per)} a ${perLabel}.`);
  }
  if (v.unusedCap) notes.push(`Carry-forward only works if your total super balance was under ${fmtMoney(CARRY_FORWARD_BALANCE)} on 30 June 2026.`);
  $('note').textContent = notes.join(' ');
  $('estimate-note').textContent = r.excess > 0 ? 'The tax on contributions over the cap is an estimate. ' : '';
}

wireForm($('form'), update);
$('form').addEventListener('change', update); // the "per" select
syncFormWithUrl($('form'), update);
addResultActions(document.querySelectorAll('.cols > .card')[1]);

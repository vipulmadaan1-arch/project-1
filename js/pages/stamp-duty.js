import { fmtMoney, readNumber, wireForm, blank, syncFormWithUrl, addResultActions } from '../layout.js';
import { stampDuty } from '../duty.js';

const $ = (id) => document.getElementById(id);
function update() {
  const home = $('home').checked;
  // A disabled option is also unticked, so what's shown matches what's calculated.
  $('fhb').disabled = !home;
  if (!home) $('fhb').checked = false;
  $('newhome').disabled = !home;
  if ($('newhome').disabled) $('newhome').checked = false;
  const value = readNumber($('value'), { name: 'Property value', unit: 'money', min: 0, max: 1e12 });
  const r = value === null ? null : stampDuty({
    state: $('state').value, value, home, firstHome: $('fhb').checked, newHome: $('newhome').checked, foreign: $('foreign').checked,
  });
  if (!r) { $('note').textContent = ''; return blank($('total'), $('duty'), $('saving'), $('surcharge')); }
  $('total-label').textContent = `Total duty payable, ${r.state.code}`;
  $('total').textContent = fmtMoney(r.total);
  $('duty').textContent = fmtMoney(r.duty);
  $('saving').textContent = r.saving ? `−${fmtMoney(r.saving)}` : fmtMoney(0);
  $('surcharge-label').textContent = r.state.foreign ? `Foreign purchaser surcharge (${Math.round(r.state.foreign * 100)}%)` : 'Foreign purchaser surcharge';
  $('surcharge').textContent = fmtMoney(r.surcharge);
  $('note').textContent = [r.note, r.foreignNote].filter(Boolean).join(' ');
  $('estimate-note').textContent = r.estimate ? 'Part of this result uses a formula from independent calculators, not the revenue office. ' : '';
  const src = $('source');
  src.href = r.state.source;
  src.textContent = r.state.office;
}
wireForm($('form'), update);
syncFormWithUrl($('form'), update);
addResultActions(document.querySelectorAll('.cols > .card')[1]);

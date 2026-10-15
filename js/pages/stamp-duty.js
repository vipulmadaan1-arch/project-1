import { fmtMoney, readNumber, wireForm, blank, syncFormWithUrl, addResultActions } from '../layout.js';
import { stampDuty } from '../duty.js';

const $ = (id) => document.getElementById(id);
// State pages (tools/stamp-duty-vic.html etc.) share this module: <form id="form" data-state="VIC">
// fixes the state and leaves out the state select. Pages without it (all states) use the select.
const fixedState = $('form').dataset.state;
// The new home box only matters in some states, so a state page can leave it out.
const newHome = $('newhome');
function update() {
  const home = $('home').checked;
  // A disabled option is also unticked, so what's shown matches what's calculated.
  $('fhb').disabled = !home;
  if (!home) $('fhb').checked = false;
  if (newHome) {
    newHome.disabled = !home;
    if (newHome.disabled) newHome.checked = false;
  }
  const value = readNumber($('value'), { name: 'Property value', unit: 'money', min: 0, max: 1e12 });
  const r = value === null ? null : stampDuty({
    state: fixedState || $('state').value, value, home, firstHome: $('fhb').checked, newHome: !!newHome?.checked, foreign: $('foreign').checked,
  });
  if (!r) { $('note').textContent = ''; $('estimate-note').textContent = ''; return blank($('total'), $('duty'), $('saving'), $('surcharge')); }
  $('total-label').textContent = `Total duty payable, ${r.state.code}`;
  const dp = (n) => (Math.round(n * 100) % 100 ? 2 : 0); // SA duty can have cents
  $('total').textContent = fmtMoney(r.total, dp(r.total));
  $('duty').textContent = fmtMoney(r.duty, dp(r.duty));
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

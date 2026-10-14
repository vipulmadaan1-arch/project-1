import { num } from '../layout.js';
import { UNITS, convert } from '../calc.js';

const $ = (id) => document.getElementById(id);
$('cat').innerHTML = Object.keys(UNITS).map((c) => `<option>${c}</option>`).join('');

function fillUnits() {
  const units = Object.keys(UNITS[$('cat').value]);
  const opts = units.map((u) => `<option>${u}</option>`).join('');
  $('from').innerHTML = opts; $('to').innerHTML = opts;
  $('to').selectedIndex = Math.min(1, units.length - 1);
  update();
}
function update() {
  const v = convert($('cat').value, num($('in')), $('from').value, $('to').value);
  $('out').textContent = Number.isFinite(v) ? v.toLocaleString('en-AU', { maximumSignificantDigits: 8 }) : '–';
}
$('cat').addEventListener('change', fillUnits);
['from', 'to', 'in'].forEach((id) => $(id).addEventListener('input', update));
$('swap').addEventListener('click', () => {
  const f = $('from').value; $('from').value = $('to').value; $('to').value = f; update();
});
fillUnits();

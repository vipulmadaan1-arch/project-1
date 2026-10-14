import { readNumber, setError } from '../layout.js';
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
  const cat = $('cat').value;
  const n = readNumber($('in'), { name: 'Value', example: '2.5' });
  // Nothing is colder than absolute zero (0 K).
  if (n !== null && cat === 'Temperature' && convert(cat, n, $('from').value, 'K') < -1e-9) {
    setError($('in'), `Temperature can’t be below absolute zero (${convert(cat, 0, 'K', $('from').value).toLocaleString('en-AU', { maximumFractionDigits: 2 })} ${$('from').value})`);
    $('out').textContent = '–';
    return;
  }
  const v = n === null ? NaN : convert(cat, n, $('from').value, $('to').value);
  $('out').textContent = Number.isFinite(v)
    ? v.toLocaleString('en-AU', Math.abs(v) >= 1e15 || (v !== 0 && Math.abs(v) < 1e-6) ? { notation: 'scientific', maximumSignificantDigits: 8 } : { maximumSignificantDigits: 8 })
    : '–';
}
$('cat').addEventListener('change', fillUnits);
['from', 'to', 'in'].forEach((id) => $(id).addEventListener('input', update));
$('in').addEventListener('focusout', () => { $('in').dataset.touched = '1'; update(); });
$('swap').addEventListener('click', () => {
  const f = $('from').value; $('from').value = $('to').value; $('to').value = f; update();
});
fillUnits();

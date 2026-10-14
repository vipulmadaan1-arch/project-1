import { readNumber, setError, wireForm, syncFormWithUrl } from '../layout.js';
import { percent } from '../calc.js';

const $ = (id) => document.getElementById(id);
const fmt = (n, suffix = '') => (Number.isFinite(n) ? n.toLocaleString('en-AU', { maximumFractionDigits: 4 }) + suffix : '–');
const read = (id, name, enter) => readNumber($(id), { name, enter, example: '25' });
function update() {
  const a1 = read('a1', 'Percent', 'Enter a percent'), a2 = read('a2', '“Of”', 'Enter a number in “Of”');
  $('r1').textContent = a1 === null || a2 === null ? '–' : fmt(percent.of(a1, a2));

  const b1 = read('b1', 'Value', 'Enter a value'), b2 = read('b2', 'Total', 'Enter a total');
  if (b2 === 0) setError($('b2'), 'Total can’t be 0, because you can’t divide by zero. Enter a different total');
  $('r2').textContent = b1 === null || b2 === null || b2 === 0 ? '–' : fmt(percent.whatPercent(b1, b2), '%');

  const c1 = read('c1', '“From”', 'Enter a number in “From”'), c2 = read('c2', '“To”', 'Enter a number in “To”');
  if (c1 === 0) setError($('c1'), '“From” can’t be 0, because a change from 0 has no percentage. Enter a starting number other than 0');
  const c = c1 === null || c2 === null || c1 === 0 ? NaN : percent.change(c1, c2);
  $('r3').textContent = Number.isFinite(c) ? `${c > 0 ? '+' : ''}${fmt(c, '%')} ${c > 0 ? 'increase' : c < 0 ? 'decrease' : '(no change)'}`.trim() : '–';
}
wireForm($('form'), update);
syncFormWithUrl($('form'), update);

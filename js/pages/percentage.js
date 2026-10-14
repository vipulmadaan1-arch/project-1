import { num, syncFormWithUrl } from '../layout.js';
import { percent } from '../calc.js';

const $ = (id) => document.getElementById(id);
const fmt = (n, suffix = '') => (Number.isFinite(n) ? n.toLocaleString('en-AU', { maximumFractionDigits: 4 }) + suffix : '–');
function update() {
  $('r1').textContent = fmt(percent.of(num($('a1')), num($('a2'))));
  $('r2').textContent = fmt(percent.whatPercent(num($('b1')), num($('b2'))), '%');
  const c = percent.change(num($('c1')), num($('c2')));
  $('r3').textContent = Number.isFinite(c) ? `${c > 0 ? '+' : ''}${fmt(c, '%')} ${c > 0 ? 'increase' : c < 0 ? 'decrease' : ''}` : '–';
}
$('form').addEventListener('input', update);
$('form').addEventListener('submit', (e) => e.preventDefault());
update();
syncFormWithUrl($('form'), update);

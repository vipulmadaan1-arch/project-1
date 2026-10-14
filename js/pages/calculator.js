import '../layout.js';
import { evaluate } from '../calc.js';

const $expr = document.getElementById('expr');
const $out = document.getElementById('out');
let expr = '';
let justEvaluated = false;
const MAX_LEN = 120;

// Up to 10 decimal places (so 0.999999999999999 shows as 1), switching to scientific
// notation for very large or very small numbers instead of a long run of digits or a 0.
function fmt(n) {
  const a = Math.abs(n);
  if (a >= 1e15 || (a > 0 && a < 1e-6)) return n.toLocaleString('en-AU', { notation: 'scientific', maximumSignificantDigits: 12 });
  return n.toLocaleString('en-AU', { maximumFractionDigits: 10, maximumSignificantDigits: 15, roundingPriority: 'lessPrecision' });
}
const errorText = (e) => (e.message === 'Cannot divide by zero' ? 'Cannot ÷ 0' : e.message === 'Number too large' ? 'Too large' : 'Error');

function show() {
  $expr.textContent = expr;
  if (!expr) { $out.textContent = '0'; return; }
  try { $out.textContent = fmt(evaluate(expr)); }
  catch { /* incomplete expression: keep last result */ }
}

const OPS = '+-×÷';
function press(k) {
  if (k === 'C') { expr = ''; justEvaluated = false; return show(); }
  if (k === '⌫') { expr = justEvaluated && /e/.test(expr) ? '' : expr.slice(0, -1); justEvaluated = false; return show(); }
  if (k === '=') {
    try {
      const r = evaluate(expr);
      $expr.textContent = expr + ' =';
      expr = String(r);
      $out.textContent = fmt(r);
      justEvaluated = true;
      addToTape($expr.textContent.replace(/ =$/, ''), r);
    } catch (e) { $out.textContent = errorText(e); }
    return;
  }
  if (justEvaluated && /[0-9.(]/.test(k)) expr = '';
  justEvaluated = false;
  const last = expr.slice(-1);
  if (OPS.includes(k)) {
    // Pressing a second operator replaces the first (5 × ÷ becomes 5 ÷), but − can follow × or ÷ for a negative number.
    if (k === '-' && '×÷'.includes(last) && last) { /* keep: 5 × −3 */ }
    else if (last && OPS.includes(last)) {
      expr = expr.replace(/[+\-×÷]+$/, '');
      if (!expr && k !== '-') return show();
    } else if (!expr && k !== '-') return show();
  }
  if (k === '.' && /\d*\.\d*$/.test(expr.split(/[+\-×÷()%]/).pop())) return; // one decimal point per number
  if (expr.length >= MAX_LEN) return;
  expr += k;
  show();
}

document.getElementById('keys').addEventListener('click', (e) => {
  const k = e.target.closest('button')?.dataset.k;
  if (k) press(k);
});

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const map = { '*': '×', '/': '÷', Enter: '=', '=': '=', Backspace: '⌫', Escape: 'C', Delete: 'C' };
  const k = map[e.key] || (/^[0-9.+\-()%]$/.test(e.key) ? e.key : null);
  if (k) { e.preventDefault(); press(k); }
});

// Tape: recent calculations. Selecting one puts its result back in the display.
const $tape = document.getElementById('tape');
const tape = [];
function addToTape(e, r) {
  if (!e || String(r) === e) return;
  tape.unshift({ e, r });
  tape.length = Math.min(tape.length, 12);
  $tape.replaceChildren(...tape.map((t) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.innerHTML = `<span></span><span></span>`;
    b.children[0].textContent = `${t.e} =`;
    b.children[1].textContent = fmt(t.r);
    b.addEventListener('click', () => { expr = String(t.r); justEvaluated = true; show(); });
    li.append(b);
    return li;
  }));
  document.getElementById('tape-empty').hidden = tape.length > 0;
}

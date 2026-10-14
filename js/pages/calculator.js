import '../layout.js';
import { evaluate } from '../calc.js';

const $expr = document.getElementById('expr');
const $out = document.getElementById('out');
let expr = '';
let justEvaluated = false;

function show() {
  $expr.textContent = expr;
  if (!expr) { $out.textContent = '0'; return; }
  try { $out.textContent = evaluate(expr).toLocaleString('en-AU', { maximumFractionDigits: 10 }); }
  catch { /* incomplete expression: keep last result */ }
}

function press(k) {
  if (k === 'C') { expr = ''; justEvaluated = false; return show(); }
  if (k === '⌫') { expr = expr.slice(0, -1); return show(); }
  if (k === '=') {
    try {
      const r = evaluate(expr);
      $expr.textContent = expr + ' =';
      expr = String(r);
      $out.textContent = r.toLocaleString('en-AU', { maximumFractionDigits: 10 });
      justEvaluated = true;
      addToTape($expr.textContent.replace(/ =$/, ''), r);
    } catch (e) { $out.textContent = e.message === 'Cannot divide by zero' ? 'Cannot ÷ 0' : 'Error'; }
    return;
  }
  if (justEvaluated && /[0-9.(]/.test(k)) expr = '';
  justEvaluated = false;
  expr += k;
  show();
}

document.getElementById('keys').addEventListener('click', (e) => {
  const k = e.target.closest('button')?.dataset.k;
  if (k) press(k);
});

document.addEventListener('keydown', (e) => {
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
    b.children[1].textContent = t.r.toLocaleString('en-AU', { maximumFractionDigits: 10 });
    b.addEventListener('click', () => { expr = String(t.r); justEvaluated = true; show(); });
    li.append(b);
    return li;
  }));
  document.getElementById('tape-empty').hidden = tape.length > 0;
}

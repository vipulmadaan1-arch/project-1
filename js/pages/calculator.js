import { announce, shortcutAllowed, safeGet, safeSet } from '../layout.js';
import { evaluate } from '../calc.js';

const $expr = document.getElementById('expr');
const $out = document.getElementById('out');
let expr = '';
let justEvaluated = false;
let lastAnswer = 0;
const MAX_LEN = 120;

// Basic or scientific keypad, and degrees or radians for trig. Both are remembered on this device.
let angle = safeGet('calcAngle') === 'rad' ? 'rad' : 'deg';
const $angle = document.getElementById('angle');
const $deg = document.getElementById('angle-deg');
const $rad = document.getElementById('angle-rad');
const $sciKeys = document.getElementById('sci-keys');
const $basic = document.getElementById('mode-basic');
const $sci = document.getElementById('mode-sci');
function setMode(sci) {
  $sciKeys.hidden = !sci;
  $angle.hidden = !sci;
  $basic.setAttribute('aria-pressed', String(!sci));
  $sci.setAttribute('aria-pressed', String(sci));
  document.querySelector('.calc').classList.toggle('is-sci', sci);
  safeSet('calcMode', sci ? 'sci' : 'basic');
}
function setAngle(a) {
  angle = a;
  $deg.setAttribute('aria-pressed', String(a === 'deg'));
  $rad.setAttribute('aria-pressed', String(a === 'rad'));
  safeSet('calcAngle', a);
  show();
}
// After a mouse click, let go of focus so a following Enter means "=" rather than pressing the toggle again.
const blurIfClicked = (e) => { if (e.detail > 0) e.currentTarget.blur(); };
$basic.addEventListener('click', (e) => { setMode(false); blurIfClicked(e); });
$sci.addEventListener('click', (e) => { setMode(true); blurIfClicked(e); });
$deg.addEventListener('click', (e) => { setAngle('deg'); blurIfClicked(e); });
$rad.addEventListener('click', (e) => { setAngle('rad'); blurIfClicked(e); });
$sciKeys.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn?.dataset.k) return;
  press(btn.dataset.k);
  if (e.detail > 0) btn.blur();
});

// Up to 10 decimal places (so 0.999999999999999 shows as 1), switching to scientific
// notation for very large or very small numbers instead of a long run of digits or a 0.
function fmt(n) {
  const a = Math.abs(n);
  if (a >= 1e15 || (a > 0 && a < 1e-6)) return n.toLocaleString('en-AU', { notation: 'scientific', maximumSignificantDigits: 12 });
  return n.toLocaleString('en-AU', { maximumFractionDigits: 10, maximumSignificantDigits: 15, roundingPriority: 'lessPrecision' });
}
const errorText = (e) => (e.message === 'Cannot divide by zero' ? 'Cannot ÷ 0' : e.message === 'Number too large' ? 'Too large' : e.message === 'Math error' ? 'Math error' : 'Error');
// The same messages in words, for screen readers.
const errorWords = (e) => (e.message === 'Cannot divide by zero' ? 'Cannot divide by zero' : e.message === 'Number too large' ? 'The answer is too large' : e.message === 'Math error' ? 'Math error' : 'Error');

// The expression in words, read out once keys pause: "12 times open bracket 3 plus 4 close bracket".
const WORDS = [
  [/\^\(-1\)/g, ' to the power of minus 1 '], [/\^2(?!\d)/g, ' squared '], [/\^/g, ' to the power of '],
  [/asin\(/g, ' inverse sine of '], [/acos\(/g, ' inverse cosine of '], [/atan\(/g, ' inverse tangent of '],
  [/sin\(/g, ' sine of '], [/cos\(/g, ' cosine of '], [/tan\(/g, ' tangent of '], [/ln\(/g, ' natural log of '],
  [/log\(/g, ' log of '], [/abs\(/g, ' absolute value of '], [/exp\(/g, ' e to the power of '],
  [/√\(/g, ' square root of '], [/∛\(/g, ' cube root of '], [/π/g, ' pi '], [/ℯ/g, ' e '],
  [/×/g, ' times '], [/÷/g, ' divided by '], [/\+/g, ' plus '], [/-/g, ' minus '], [/%/g, ' percent '], [/!/g, ' factorial '],
  [/\(/g, ' open bracket '], [/\)/g, ' close bracket '],
];
const spoken = (s) => WORDS.reduce((t, [re, w]) => t.replace(re, w), s).replace(/\s+/g, ' ').trim();
const sayExpr = () => announce(expr ? spoken(expr) : 'Cleared', 500);

function show() {
  $expr.textContent = expr;
  if (!expr) { $out.textContent = '0'; return; }
  try { $out.textContent = fmt(evaluate(expr, { angle })); }
  catch { /* incomplete expression: keep last result */ }
}

const OPS = '+-×÷';
function press(k) {
  if (k === 'C') { expr = ''; justEvaluated = false; sayExpr(); return show(); }
  if (k === '⌫') {
    // Delete a whole function name at once ("sin(" rather than "(").
    const fn = expr.match(/(?:asin|acos|atan|sin|cos|tan|ln|log|abs|exp)\($/);
    expr = justEvaluated && /e/.test(expr) ? '' : expr.slice(0, fn ? -fn[0].length : -1);
    justEvaluated = false;
    sayExpr();
    return show();
  }
  if (k === 'ANS') k = String(lastAnswer);
  if (!expr && !justEvaluated && /^[\^!]/.test(k)) return show(); // a power or factorial needs a number first
  if (k === '=') {
    try {
      const r = evaluate(expr, { angle });
      lastAnswer = r;
      $expr.textContent = expr + ' =';
      expr = String(r);
      $out.textContent = fmt(r);
      announce(`Equals ${$out.textContent}`);
      justEvaluated = true;
      addToTape($expr.textContent.replace(/ =$/, ''), r);
    } catch (e) {
      $out.innerHTML = `<span aria-hidden="true">${errorText(e)}</span><span class="visually-hidden">${errorWords(e)}</span>`;
      announce(errorWords(e));
    }
    return;
  }
  // After =, typing a number, bracket, constant or function starts afresh; an operator carries the answer on.
  if (justEvaluated && /^[0-9.(πℯ√∛a-z]/.test(k)) expr = '';
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
  if (k === '.' && /\d*\.\d*$/.test(expr.split(/[+\-×÷()%^!]/).pop())) return; // one decimal point per number
  if (expr.length + k.length > MAX_LEN) return;
  expr += k;
  sayExpr();
  show();
}

document.getElementById('keys').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn?.dataset.k) return;
  press(btn.dataset.k);
  // After a tap or mouse click, let go of focus so typing Enter afterwards means "=",
  // while a keyboard user who tabbed to a key still presses it with Enter.
  if (e.detail > 0) btn.blur();
});

const $layout = document.querySelector('.calc-layout');
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (!shortcutAllowed(e, $layout)) return;
  // Enter and Space on a focused key or tape entry press that button, as usual.
  if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('button')) return;
  if (/^[a-z]$/i.test(e.key)) { e.preventDefault(); openedByName = false; typeLetter(e.key.toLowerCase()); return; }
  const map = { '*': '×', '/': '÷', Enter: '=', '=': '=', Backspace: '⌫', Escape: 'C', Delete: 'C' };
  const k = map[e.key] || (/^[0-9.+\-()%^!]$/.test(e.key) ? e.key : null);
  if (!k) return;
  e.preventDefault();
  if (k === '⌫' || k === 'C') letters = ''; else flushLetters();
  // "sin(" was already entered by the letters, so the "(" the user types next is skipped.
  const skip = k === '(' && openedByName;
  openedByName = false;
  if (!skip) press(k);
});

// Typed function names: letters collect until they spell a name (sin, sqrt, pi…), which is then
// entered like its key. A lone "e" waits one key in case it starts "exp".
const NAMES = { sin: 'sin(', cos: 'cos(', tan: 'tan(', asin: 'asin(', acos: 'acos(', atan: 'atan(', ln: 'ln(', log: 'log(', sqrt: '√(', cbrt: '∛(', abs: 'abs(', exp: 'exp(', pi: 'π', e: 'ℯ', ans: 'ANS' };
let letters = '';
let openedByName = false;
const startsName = (t) => Object.keys(NAMES).some((n) => n.startsWith(t));
function typeLetter(c) {
  const next = letters + c;
  if (startsName(next)) {
    letters = next;
    if (NAMES[next] && !Object.keys(NAMES).some((n) => n !== next && n.startsWith(next))) { letters = ''; enter(NAMES[next]); }
    return;
  }
  flushLetters(); // e.g. "e" then "+" or "es": the "e" was the constant
  if (startsName(c)) typeLetter(c);
}
function enter(k) {
  if (k.endsWith('(') && $sciKeys.hidden) setMode(true); // typing a function opens the scientific keys
  press(k);
  openedByName = k.endsWith('(');
}
function flushLetters() {
  if (NAMES[letters]) enter(NAMES[letters]);
  letters = '';
}

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

setAngle(angle);
setMode(safeGet('calcMode') === 'sci' || location.hash === '#scientific');

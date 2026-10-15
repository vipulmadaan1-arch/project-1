import { readNumber, setError } from '../layout.js';
import { formatDuration } from '../calc.js';

const $ = (id) => document.getElementById(id);
const $d = $('display'), $start = $('start');
let remaining = 300000, endAt = 0, running = false, interval = 0, audioCtx;
const MAX_MS = (99 * 3600 + 59 * 60 + 59) * 1000;

// Reads hours, minutes and seconds. Returns milliseconds, or null if a field can't be used.
// Minutes and seconds over 59 are fine (90 minutes is 1:30:00).
function inputMs() {
  const opts = { min: 0, optional: true, example: '5' };
  const h = readNumber($('h'), { ...opts, name: 'Hours', max: 99 });
  const m = readNumber($('m'), { ...opts, name: 'Minutes' });
  const s = readNumber($('s'), { ...opts, name: 'Seconds' });
  if ([h, m, s].includes(null)) return null;
  const ms = Math.round((h * 3600 + m * 60 + s) * 1000);
  if (ms > MAX_MS) { setError($('h'), 'The timer can run for up to 99 hours, 59 minutes and 59 seconds. Enter a shorter time'); return null; }
  return ms;
}
const baseTitle = document.title;
const show = (ms) => { $d.textContent = formatDuration(Math.ceil(ms / 1000) * 1000, { showMs: false }); document.title = running ? `${$d.textContent} — Timer` : baseTitle; };
const $msg = document.createElement('p');
$msg.className = 'field-error'; $msg.id = 'timer-error'; $msg.hidden = true; $msg.setAttribute('role', 'alert');
$('inputs').after($msg);
// "Time's up" stays on screen until the timer is used again, and is read out straight away (an alert),
// since the flash and the beep alone can be missed.
const $done = document.createElement('p');
$done.className = 'timer-done';
$done.setAttribute('role', 'alert');
$d.after($done);
const clearDone = () => { $done.textContent = ''; };

function beep() {
  try {
    audioCtx = audioCtx || new AudioContext();
    for (let i = 0; i < 6; i++) {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.frequency.value = 880; o.connect(g); g.connect(audioCtx.destination);
      const t = audioCtx.currentTime + i * 0.4;
      g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      o.start(t); o.stop(t + 0.3);
    }
  } catch { /* audio unavailable */ }
}

function stop() { running = false; clearInterval(interval); $start.textContent = 'Start'; }
function tick() {
  remaining = endAt - Date.now();
  if (remaining <= 0) {
    remaining = 0; stop(); show(0);
    $d.classList.remove('flash'); void $d.offsetWidth; $d.classList.add('flash');
    beep();
    $done.textContent = "Time's up";
    return;
  }
  show(remaining);
}
// Shows the time from the fields, or the last good time if a field has an error.
function fromInputs() {
  const ms = inputMs();
  $msg.hidden = true;
  if (ms !== null) remaining = ms;
  show(ms ?? remaining);
  return ms;
}
$start.addEventListener('click', () => {
  clearDone();
  if (running) { stop(); remaining = endAt - Date.now(); return show(remaining); }
  if (inputMs() === null) return; // the field error says what to fix
  if (remaining <= 0) fromInputs();
  if (remaining <= 0) {
    $msg.innerHTML = '<span class="visually-hidden">Error: </span>Set a time of at least 1 second, or choose a preset';
    $msg.hidden = false;
    return;
  }
  $msg.hidden = true;
  audioCtx = audioCtx || (window.AudioContext ? new AudioContext() : null); // unlock audio on user gesture
  endAt = Date.now() + remaining; running = true; $start.textContent = 'Pause';
  interval = setInterval(tick, 200); tick();
});
$('reset').addEventListener('click', () => { stop(); clearDone(); fromInputs(); });
['h', 'm', 's'].forEach((id) => {
  $(id).addEventListener('input', () => { clearDone(); if (!running) fromInputs(); });
  $(id).addEventListener('focusout', () => { if ($(id).value.trim() === '') $(id).value = '0'; if (!running) fromInputs(); });
});
document.querySelectorAll('[data-preset]').forEach((b) => b.addEventListener('click', () => {
  const s = +b.dataset.preset;
  $('h').value = Math.floor(s / 3600); $('m').value = Math.floor((s % 3600) / 60); $('s').value = s % 60;
  stop(); clearDone(); fromInputs();
}));
show(remaining);

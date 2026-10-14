import '../layout.js';
import { formatDuration } from '../calc.js';

const $ = (id) => document.getElementById(id);
const $d = $('display'), $start = $('start');
let remaining = 300000, endAt = 0, running = false, interval = 0, audioCtx;

const inputMs = () => ((+$('h').value || 0) * 3600 + (+$('m').value || 0) * 60 + (+$('s').value || 0)) * 1000;
const show = (ms) => { $d.textContent = formatDuration(Math.ceil(ms / 1000) * 1000, { showMs: false }); document.title = running ? `${$d.textContent} — Timer` : 'Countdown Timer | ToolTiles'; };

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
    return;
  }
  show(remaining);
}
$start.addEventListener('click', () => {
  if (running) { stop(); remaining = endAt - Date.now(); return show(remaining); }
  if (remaining <= 0) remaining = inputMs();
  if (remaining <= 0) return;
  audioCtx = audioCtx || (window.AudioContext ? new AudioContext() : null); // unlock audio on user gesture
  endAt = Date.now() + remaining; running = true; $start.textContent = 'Pause';
  interval = setInterval(tick, 200); tick();
});
$('reset').addEventListener('click', () => { stop(); remaining = inputMs(); show(remaining); });
['h', 'm', 's'].forEach((id) => $(id).addEventListener('input', () => { if (!running) { remaining = inputMs(); show(remaining); } }));
document.querySelectorAll('[data-preset]').forEach((b) => b.addEventListener('click', () => {
  const s = +b.dataset.preset;
  $('h').value = Math.floor(s / 3600); $('m').value = Math.floor((s % 3600) / 60); $('s').value = s % 60;
  stop(); remaining = inputMs(); show(remaining);
}));
show(remaining);

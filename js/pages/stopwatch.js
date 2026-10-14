import { announce, shortcutAllowed } from '../layout.js';
import { formatDuration } from '../calc.js';

const $d = document.getElementById('display');
const $start = document.getElementById('start');
const $lap = document.getElementById('lap');
const $reset = document.getElementById('reset');
const $laps = document.getElementById('laps');

let running = false, startedAt = 0, elapsed = 0, raf = 0, lastLap = 0, lapCount = 0;
const now = () => (running ? elapsed + performance.now() - startedAt : elapsed);

function tick() { $d.textContent = formatDuration(now()); raf = requestAnimationFrame(tick); }

function toggle() {
  if (running) {
    elapsed = now(); running = false; cancelAnimationFrame(raf);
    $start.textContent = 'Start'; $lap.disabled = true;
  } else {
    startedAt = performance.now(); running = true; tick();
    $start.textContent = 'Pause'; $lap.disabled = false; $reset.disabled = false;
  }
}
function lap() {
  if (!running) return;
  const t = now();
  const li = document.createElement('li');
  li.innerHTML = `<span>Lap ${++lapCount}</span><span>${formatDuration(t - lastLap)}</span><span>${formatDuration(t)}</span>`;
  $laps.prepend(li);
  announce(`Lap ${lapCount}, ${formatDuration(t - lastLap)}`);
  lastLap = t;
}
function reset() {
  running = false; cancelAnimationFrame(raf); elapsed = 0; lastLap = 0; lapCount = 0;
  $d.textContent = formatDuration(0); $laps.replaceChildren();
  $start.textContent = 'Start'; $lap.disabled = true; $reset.disabled = true;
}

$start.addEventListener('click', toggle);
$lap.addEventListener('click', lap);
$reset.addEventListener('click', reset);
const $card = $d.closest('.card');
document.addEventListener('keydown', (e) => {
  if (!shortcutAllowed(e, $card)) return;
  if (e.code === 'Space' && !e.target.closest('button')) { e.preventDefault(); toggle(); }
  if (e.key === 'l' || e.key === 'L') lap();
});

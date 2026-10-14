import { TOOLS } from '../tools.js';
import { safeGet, safeSet } from '../layout.js';

const PIN_KEY = 'pinnedTools';
let pinned = [];
try { pinned = JSON.parse(safeGet(PIN_KEY) || '[]'); } catch { pinned = []; }

const $pinned = document.getElementById('pinned');
const $all = document.getElementById('all');
const $search = document.getElementById('search');

function tile(t) {
  const a = document.createElement('a');
  a.className = 'tile';
  a.href = `tools/${t.slug}.html`;
  const isPinned = pinned.includes(t.slug);
  a.innerHTML = `
    <div class="ico" aria-hidden="true">${t.icon}</div>
    <h2>${t.name}</h2>
    <p>${t.desc}</p>
    <span class="tag">${t.cat}</span>
    <button class="pin" type="button" aria-pressed="${isPinned}" aria-label="${isPinned ? 'Unpin' : 'Pin'} ${t.name}" title="${isPinned ? 'Unpin' : 'Pin to top'}">${isPinned ? '★' : '☆'}</button>`;
  a.querySelector('.pin').addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    pinned = isPinned ? pinned.filter((s) => s !== t.slug) : [...pinned, t.slug];
    safeSet(PIN_KEY, JSON.stringify(pinned));
    render();
  });
  return a;
}

function render() {
  const q = $search.value.trim().toLowerCase();
  const match = (t) => !q || `${t.name} ${t.desc} ${t.cat}`.toLowerCase().includes(q);
  const pinnedTools = pinned.map((s) => TOOLS.find((t) => t.slug === s)).filter(Boolean).filter(match);
  const others = TOOLS.filter((t) => !pinned.includes(t.slug)).filter(match);

  $pinned.replaceChildren(...pinnedTools.map(tile));
  $all.replaceChildren(...others.map(tile));
  document.getElementById('pinned-section').hidden = pinnedTools.length === 0;
  document.getElementById('all-title').textContent = pinnedTools.length ? 'More tools' : 'All tools';
  document.getElementById('empty').hidden = pinnedTools.length + others.length > 0;
}

$search.addEventListener('input', render);
render();

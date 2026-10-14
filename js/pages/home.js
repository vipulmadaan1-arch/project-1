import { TOOLS, CATEGORIES } from '../tools.js';
import { safeGet, safeSet } from '../layout.js';
import { icon } from '../icons.js';

const PIN_KEY = 'pinnedTools';
let pinned = [];
try { pinned = JSON.parse(safeGet(PIN_KEY) || '[]'); } catch { pinned = []; }

const $pinned = document.getElementById('pinned');
const $sections = document.getElementById('sections');
const $search = document.getElementById('search');

function tile(t) {
  const a = document.createElement('a');
  a.className = 'tile';
  a.href = `tools/${t.slug}.html`;
  const isPinned = pinned.includes(t.slug);
  a.innerHTML = `
    <div class="ico">${icon(t.slug)}</div>
    <h3>${t.name}</h3>
    <p>${t.desc}</p>
    <div class="tile-foot"><span class="tag">${t.meta}</span>${icon('arrow', { className: 'icon tile-go' })}</div>
    <button class="pin" type="button" aria-pressed="${isPinned}" aria-label="${isPinned ? 'Unpin' : 'Pin'} ${t.name}" title="${isPinned ? 'Unpin' : 'Pin to top'}">${icon('pin')}</button>`;
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
  const match = (t) => !q || `${t.name} ${t.desc} ${t.cat === 'au' ? 'australia australian au' : 'general'}`.toLowerCase().includes(q);
  const pinnedTools = pinned.map((s) => TOOLS.find((t) => t.slug === s)).filter(Boolean).filter(match);
  $pinned.replaceChildren(...pinnedTools.map(tile));
  document.getElementById('pinned-section').hidden = pinnedTools.length === 0;
  document.getElementById('pinned-count').textContent = pinnedTools.length;

  let shown = pinnedTools.length;
  $sections.replaceChildren(...CATEGORIES.map((c) => {
    const tools = TOOLS.filter((t) => t.cat === c.key && !pinned.includes(t.slug)).filter(match);
    shown += tools.length;
    const sec = document.createElement('section');
    sec.className = 'cat-section';
    sec.id = c.key;
    sec.hidden = tools.length === 0;
    sec.innerHTML = `<div class="cat-head"><h2 class="cat-title">${c.title}</h2><span class="cat-count">${tools.length}</span><p class="cat-blurb">${c.blurb}</p></div>`;
    const grid = document.createElement('div');
    grid.className = 'grid';
    grid.append(...tools.map(tile));
    sec.append(grid);
    return sec;
  }));
  document.getElementById('empty').hidden = shown > 0;
}

$search.addEventListener('input', render);
// Press / to jump to search.
document.addEventListener('keydown', (e) => {
  if (e.key === '/' && !e.target.matches('input, textarea, select')) { e.preventDefault(); $search.focus(); }
});
render();

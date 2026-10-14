import { TOOLS, CATEGORIES } from '../tools.js';
import { safeGet, safeSet, announce, shortcutAllowed } from '../layout.js';
import { icon } from '../icons.js';

const PIN_KEY = 'pinnedTools';
let pinned = [];
try {
  const saved = JSON.parse(safeGet(PIN_KEY) || '[]');
  // Keep only real tool slugs, so a damaged value in storage can't break the page.
  if (Array.isArray(saved)) pinned = saved.filter((s) => TOOLS.some((t) => t.slug === s));
} catch { pinned = []; }

const $pinned = document.getElementById('pinned');
const $sections = document.getElementById('sections');
const $search = document.getElementById('search');

// The card is clickable through its title link (stretched over the card in CSS); the pin
// button sits beside the link rather than inside it, so each is its own control.
function tile(t) {
  const el = document.createElement('div');
  el.className = 'tile';
  const isPinned = pinned.includes(t.slug);
  el.innerHTML = `
    <div class="ico">${icon(t.slug)}</div>
    <h3><a class="tile-link" href="tools/${t.slug}.html">${t.name}</a></h3>
    <p>${t.desc}</p>
    <div class="tile-foot"><span class="tag">${t.meta}</span>${icon('arrow', { className: 'icon tile-go' })}</div>
    <button class="pin" type="button" aria-pressed="${isPinned}" aria-label="Pin ${t.name}" title="${isPinned ? 'Unpin' : 'Pin to top'}">${icon('pin')}</button>`;
  el.querySelector('.pin').addEventListener('click', () => {
    pinned = isPinned ? pinned.filter((s) => s !== t.slug) : [...pinned, t.slug];
    safeSet(PIN_KEY, JSON.stringify(pinned));
    render();
    // The tile moves between sections, so keep focus on its pin button.
    document.querySelector(`.tile-link[href="tools/${t.slug}.html"]`)?.closest('.tile').querySelector('.pin').focus();
    announce(isPinned ? `${t.name} unpinned` : `${t.name} pinned to top`);
  });
  return el;
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
  return shown;
}

$search.addEventListener('input', () => {
  const shown = render();
  announce(shown ? `${shown} ${shown === 1 ? 'tool' : 'tools'} found` : 'No tools match that search.', 600);
});
// Press / to jump to search.
document.addEventListener('keydown', (e) => {
  if (e.key === '/' && shortcutAllowed(e)) { e.preventDefault(); $search.focus(); }
});
render();

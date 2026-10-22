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
function syncPin(b, slug) {
  const isPinned = pinned.includes(slug);
  b.setAttribute('aria-pressed', String(isPinned));
  b.title = isPinned ? 'Unpin' : 'Pin to top';
}
function pinButton(t) {
  const b = document.createElement('button');
  b.className = 'pin';
  b.type = 'button';
  b.setAttribute('aria-label', `Pin ${t.name}`);
  b.innerHTML = icon('pin');
  syncPin(b, t.slug);
  b.addEventListener('click', () => {
    const wasPinned = pinned.includes(t.slug);
    pinned = wasPinned ? pinned.filter((s) => s !== t.slug) : [...pinned, t.slug];
    safeSet(PIN_KEY, JSON.stringify(pinned));
    syncPin(b, t.slug);
    place();
    filter();
    // The tile moved between sections (the same element), so its pin button keeps focus.
    b.focus();
    announce(wasPinned ? `${t.name} unpinned` : `${t.name} pinned to top`);
  });
  return b;
}

function tile(t) {
  const el = document.createElement('div');
  el.className = 'tile';
  el.innerHTML = `
    <div class="ico">${icon(t.slug)}</div>
    <h3><a class="tile-link" href="tools/${t.slug}.html">${t.name}</a></h3>
    <p>${t.desc}</p>
    <div class="tile-foot"><span class="tag">${t.meta}</span>${icon('arrow', { className: 'icon tile-go' })}</div>`;
  el.append(pinButton(t));
  return el;
}

// ---------- Search ----------
// Every word typed has to match a word in the tool's name, description, tile label or keywords (js/tools.js),
// so "sa stamp duty" finds the stamp duty calculators. A word matches the start of a word ("mort" while
// typing "mortgage"); words of one or two letters ("sa", "wa") must match whole, unless you're still typing
// them; and words of five letters or more may have one typo ("mortage").
const words = (s) => s.toLowerCase().replace(/['’]/g, '').split(/[^a-z0-9%]+/).filter(Boolean);
const INDEX = new Map(TOOLS.map((t) => [t.slug, words(`${t.name} ${t.desc} ${t.meta} ${t.keywords || ''}`)]));
// Edit distance of at most one, counting a swap of two neighbouring letters as one edit.
function nearlySame(a, b) {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && a[i] === b[i]) i++;
  if (i >= a.length || i >= b.length) return true;
  const rest = (x, y) => a.slice(x) === b.slice(y);
  return rest(i + 1, i + 1) || rest(i + 1, i) || rest(i, i + 1) || (a[i] === b[i + 1] && a[i + 1] === b[i] && rest(i + 2, i + 2));
}
function wordMatches(q, w, typing) {
  if (q.length <= 2 && !typing) return w === q;
  if (w.startsWith(q)) return true;
  return q.length >= 5 && (nearlySame(q, w) || nearlySame(q, w.slice(0, q.length)));
}
function matcher(query) {
  const qs = words(query);
  const typing = !/\s$/.test(query);
  return (t) => qs.every((q, i) => INDEX.get(t.slug).some((w) => wordMatches(q, w, typing && i === qs.length - 1)));
}

// Each tile is built once. Pinning moves a tile between the Pinned grid and its section; searching only
// shows and hides tiles, so typing never rebuilds the page.
const tileFor = new Map();
const grids = new Map();

function ensureSections() {
  for (const c of CATEGORIES) {
    let sec = document.getElementById(c.key);
    if (!sec) {
      sec = document.createElement('section');
      sec.className = 'cat-section';
      sec.id = c.key;
      sec.innerHTML = `<div class="cat-head"><h2 class="cat-title">${c.title}</h2><span class="cat-count"></span><p class="cat-blurb">${c.blurb}</p></div><div class="grid"></div>`;
      $sections.append(sec);
    }
    grids.set(c.key, sec.querySelector('.grid'));
  }
}

function place() {
  for (const s of pinned) { const el = tileFor.get(s); if (el) $pinned.append(el); }
  for (const t of TOOLS) if (!pinned.includes(t.slug)) grids.get(t.cat).append(tileFor.get(t.slug));
}

const countHtml = (n) => `${n}<span class="visually-hidden"> tool${n === 1 ? '' : 's'}</span>`;
// Only touch a count when its number changes.
const setCount = (el, n) => { if (el.dataset.n !== String(n)) { el.dataset.n = n; el.innerHTML = countHtml(n); } };
function filter() {
  const match = matcher($search.value);
  let shown = 0;
  let pinnedShown = 0;
  const perCat = new Map(CATEGORIES.map((c) => [c.key, 0]));
  for (const t of TOOLS) {
    const ok = match(t);
    tileFor.get(t.slug).hidden = !ok;
    if (!ok) continue;
    shown++;
    if (pinned.includes(t.slug)) pinnedShown++; else perCat.set(t.cat, perCat.get(t.cat) + 1);
  }
  document.getElementById('pinned-section').hidden = pinnedShown === 0;
  setCount(document.getElementById('pinned-count'), pinnedShown);
  for (const c of CATEGORIES) {
    const sec = document.getElementById(c.key);
    sec.hidden = perCat.get(c.key) === 0;
    setCount(sec.querySelector('.cat-count'), perCat.get(c.key));
  }
  document.getElementById('empty').hidden = shown > 0;
  return shown;
}

function search() {
  const shown = filter();
  announce(shown ? `${shown} ${shown === 1 ? 'tool' : 'tools'} found` : 'No tools match that search.', 600);
}
$search.addEventListener('input', search);
// No matches: suggested searches fill the box, and Clear empties it. Focus goes back to the box either way.
document.getElementById('empty').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  $search.value = b.dataset.q ?? '';
  search();
  $search.focus();
});
// Press / to jump to search.
document.addEventListener('keydown', (e) => {
  if (e.key === '/' && shortcutAllowed(e)) { e.preventDefault(); $search.focus(); }
});
// The tiles are already in the HTML (written by scripts/seo.mjs): reuse them and add the pin buttons. Any tile
// that's missing is built.
ensureSections();
for (const el of $sections.querySelectorAll('.tile')) {
  const t = TOOLS.find((x) => el.querySelector('.tile-link')?.getAttribute('href') === `tools/${x.slug}.html`);
  if (t && !tileFor.has(t.slug)) { el.append(pinButton(t)); tileFor.set(t.slug, el); }
}
for (const t of TOOLS) if (!tileFor.has(t.slug)) tileFor.set(t.slug, tile(t));
place();
filter();
// The tiles are in their final places now (see .has-pins in style.css).
document.documentElement.classList.remove('has-pins');

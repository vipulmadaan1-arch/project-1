// Stacked column chart in plain SVG: one column per year, two series stacked from a shared baseline.
// Follows the site's chart rules: columns at most 24px wide with a 4px rounded top, a 2px surface gap
// between stacked segments, hairline gridlines, compact y-axis ticks, a legend (never colour alone),
// a hover/keyboard tooltip, and the page's own table as the accessible view of the numbers.
const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}) => {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
};
const compact = (n) => {
  const a = Math.abs(n);
  if (a >= 1e6) return `$${+(n / 1e6).toFixed(a >= 1e7 ? 0 : 1)}M`;
  if (a >= 1e3) return `$${+(n / 1e3).toFixed(a >= 1e4 ? 0 : 1)}K`;
  return `$${Math.round(n)}`;
};
// A round axis maximum just above the data, in up to 5 even steps of 1, 2, 2.5 or 5 × a power of ten.
function niceScale(max) {
  if (!(max > 0)) return { top: 1, step: 0.25 };
  const raw = max / 5;
  const p = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * p).find((s) => s >= raw);
  return { top: Math.ceil(max / step - 1e-9) * step, step };
}
// Column with a rounded top and a square base.
function column(x, y, w, h, r) {
  r = Math.min(r, w / 2, h);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

/**
 * @param {HTMLElement} host  an empty element; the chart fills its width
 * @param {object} data  { labels, series: [{ name, values: number[] }, …], format(n), title, prefix }
 *   labels are the x-axis ticks (e.g. 1, 2, 3); prefix is added to them in the tooltip ("Year ").
 */
export function stackedColumns(host, data) {
  host._chart = data;
  if (!host._observed) {
    host._observed = true;
    let last = 0;
    new ResizeObserver(() => { const w = host.clientWidth; if (w && w !== last) { last = w; render(host); } }).observe(host);
  }
  render(host);
}

function render(host) {
  const { labels, series, format, title, prefix = '' } = host._chart;
  host.replaceChildren();
  const n = labels.length;
  if (!n) return;
  const totals = labels.map((_, i) => series.reduce((s, x) => s + Math.max(0, x.values[i]), 0));

  const legend = document.createElement('ul');
  legend.className = 'chart-legend';
  series.forEach((s, k) => {
    const li = document.createElement('li');
    li.innerHTML = `<span class="chart-key s${k + 1}" aria-hidden="true"></span>`;
    li.append(s.name);
    legend.append(li);
  });

  const W = Math.max(280, host.clientWidth || 600), H = 220;
  const m = { l: 52, r: 8, t: 10, b: 24 };
  const pw = W - m.l - m.r, ph = H - m.t - m.b;
  const { top, step } = niceScale(Math.max(...totals));
  const y = (v) => m.t + ph - (v / top) * ph;
  const band = pw / n;
  const bw = Math.max(2, Math.min(24, band * 0.72));

  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, class: 'chart-svg', role: 'img', tabindex: '0',
    'aria-label': `${title}. ${prefix}${labels[0]} to ${prefix}${labels[n - 1]}, ending at ${format(totals[n - 1])}. Use the left and right arrow keys to read each year; the table below lists every value.` });
  const grid = el('g', { class: 'chart-grid' });
  for (let v = 0; v <= top + 1e-9; v += step) {
    grid.append(el('line', { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v) }));
    const t = el('text', { x: m.l - 8, y: y(v), 'text-anchor': 'end', 'dominant-baseline': 'middle' });
    t.textContent = compact(v);
    grid.append(t);
  }
  svg.append(grid);

  const hl = el('rect', { class: 'chart-hl', y: m.t, height: ph, width: band, x: -999 });
  svg.append(hl);
  const marks = el('g');
  const every = Math.max(1, Math.ceil(28 / band)); // keep axis labels about 28px apart
  labels.forEach((label, i) => {
    const cx = m.l + band * i + band / 2, x = cx - bw / 2;
    let base = 0;
    series.forEach((s, k) => {
      const v = Math.max(0, s.values[i]);
      if (!v) return;
      const y0 = y(base), y1 = y(base + v);
      const gap = base > 0 ? 2 : 0; // surface gap between stacked segments
      const h = y0 - y1 - gap;
      base += v;
      if (h <= 0) return;
      const topSeg = series.slice(k + 1).every((t) => !(t.values[i] > 0));
      marks.append(el('path', { class: `s${k + 1}`, d: topSeg ? column(x, y1, bw, h, 4) : `M${x},${y1}h${bw}v${h}h${-bw}Z` }));
    });
    if (i % every === 0 || i === n - 1) {
      if (i !== n - 1 && n - 1 - i < every) return; // don't crowd the last label
      const t = el('text', { x: cx, y: H - 6, 'text-anchor': 'middle', class: 'chart-x' });
      t.textContent = label;
      marks.append(t);
    }
  });
  svg.append(marks);
  svg.append(el('line', { class: 'chart-base', x1: m.l, x2: W - m.r, y1: y(0), y2: y(0) }));

  const tip = document.createElement('div');
  tip.className = 'chart-tip';
  tip.hidden = true;
  const show = (i) => {
    if (i < 0 || i >= n) return hide();
    hl.setAttribute('x', m.l + band * i);
    tip.innerHTML = `<strong>${prefix}${labels[i]}</strong>${series.map((s, k) => `<span><i class="chart-key s${k + 1}"></i>${s.name}<b>${format(s.values[i])}</b></span>`).join('')}<span class="chart-tip-total">Total<b>${format(totals[i])}</b></span>`;
    tip.hidden = false;
    const px = ((m.l + band * i + band / 2) / W) * host.clientWidth;
    tip.style.left = `${Math.min(Math.max(px, 90), host.clientWidth - 90)}px`;
    host._active = i;
  };
  const hide = () => { tip.hidden = true; hl.setAttribute('x', -999); host._active = undefined; };
  const indexAt = (e) => {
    const r = svg.getBoundingClientRect();
    return Math.floor((((e.clientX - r.left) / r.width) * W - m.l) / band);
  };
  svg.addEventListener('pointermove', (e) => show(indexAt(e)));
  svg.addEventListener('pointerleave', hide);
  svg.addEventListener('blur', hide);
  svg.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Home' && e.key !== 'End') return;
    e.preventDefault();
    const cur = host._active ?? (e.key === 'ArrowLeft' ? n : -1);
    show(e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : Math.min(n - 1, Math.max(0, cur + (e.key === 'ArrowLeft' ? -1 : 1))));
  });

  const plot = document.createElement('div');
  plot.className = 'chart-plot';
  plot.append(svg, tip);
  host.append(legend, plot);
}

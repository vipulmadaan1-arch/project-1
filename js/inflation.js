// Inflation calculator: what an amount in one quarter is worth in another, by the ratio of the ABS CPI.
// Pure functions, no DOM. Data: ABS All groups CPI, weighted average of eight capital cities (js/cpi-data.js).
import { CPI_ROWS } from './cpi-data.js';

export const QUARTER_NAMES = ['Mar', 'Jun', 'Sep', 'Dec'];

const INDEX = new Map();
for (const [year, ...qs] of CPI_ROWS) qs.forEach((v, i) => { if (v != null) INDEX.set(`${year}-${i + 1}`, v); });
const KEYS = [...INDEX.keys()];
const parse = (k) => k.split('-').map(Number);

export const FIRST = (() => { const [year, q] = parse(KEYS[0]); return { year, q }; })();
export const LATEST = (() => { const [year, q] = parse(KEYS.at(-1)); return { year, q }; })();

/** CPI index for a quarter (q = 1 for March ... 4 for December), or null when not published. */
export function cpi(year, q) { return INDEX.get(`${year}-${q}`) ?? null; }

export const quarterLabel = (year, q) => `${QUARTER_NAMES[q - 1]} ${year}`;

/**
 * Converts an amount between quarters. Returns null if either quarter has no CPI figure.
 * annualPct is the compound average yearly rate over the gap (0 when both quarters are the same).
 */
export function inflate({ amount, from, to }) {
  const a = cpi(from.year, from.q), b = cpi(to.year, to.q);
  if (a == null || b == null || !Number.isFinite(amount)) return null;
  const ratio = b / a;
  const quarters = (to.year - from.year) * 4 + (to.q - from.q);
  const years = Math.abs(quarters) / 4;
  // Average yearly rate in the direction of time (earlier to later), whichever way you convert.
  const forward = quarters >= 0 ? ratio : 1 / ratio;
  const annualPct = years > 0 ? (forward ** (1 / years) - 1) * 100 : 0;
  return { value: amount * ratio, ratio, totalPct: (ratio - 1) * 100, annualPct, years, fromCpi: a, toCpi: b };
}

/** Yearly inflation (to each quarter from the same quarter a year earlier), in the later quarter's month,
 * for every full year between the two quarters, oldest first. */
export function yearByYear(from, to) {
  const [s, e] = (from.year * 4 + from.q) <= (to.year * 4 + to.q) ? [from, to] : [to, from];
  const rows = [];
  for (let y = e.year; (y - 1) * 4 + e.q >= s.year * 4 + s.q; y--) {
    const prev = cpi(y - 1, e.q), now = cpi(y, e.q);
    if (prev != null && now != null) rows.unshift({ year: y, q: e.q, pct: (now / prev - 1) * 100 });
  }
  return rows;
}

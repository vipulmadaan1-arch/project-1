import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpi, inflate, yearByYear, FIRST, LATEST, quarterLabel } from '../js/inflation.js';
import { CPI_ROWS } from '../js/cpi-data.js';

test('known ABS index points (Sep 2025 reference base)', () => {
  assert.equal(cpi(2025, 3), 99.73);
  assert.equal(cpi(2026, 2), 102.31);
  assert.equal(cpi(1999, 3), 47.72);
  assert.equal(cpi(1948, 3), 2.59);
});

test('series runs from Sep 1948 to Jun 2026 with no gaps', () => {
  assert.deepEqual(FIRST, { year: 1948, q: 3 });
  assert.deepEqual(LATEST, { year: 2026, q: 2 });
  let count = 0;
  for (let k = FIRST.year * 4 + FIRST.q; k <= LATEST.year * 4 + LATEST.q; k++) {
    const y = Math.floor((k - 1) / 4), q = ((k - 1) % 4) + 1;
    assert.ok(cpi(y, q) > 0, `missing ${quarterLabel(y, q)}`);
    count++;
  }
  assert.equal(count, 312);
  assert.equal(CPI_ROWS.length, 79);
  assert.equal(cpi(2026, 3), null); // not published yet
  assert.equal(cpi(1948, 2), null);
});

test('$100 in Sep 1999 is worth $214.40 in Jun 2026', () => {
  const r = inflate({ amount: 100, from: { year: 1999, q: 3 }, to: { year: 2026, q: 2 } });
  assert.equal(r.value.toFixed(2), '214.40');
  assert.equal(r.totalPct.toFixed(1), '114.4');
  assert.equal(r.years, 26.75);
  assert.equal(r.annualPct.toFixed(2), '2.89');
});

test('converting backwards gives the inverse, with the same average rate', () => {
  const f = inflate({ amount: 100, from: { year: 1999, q: 3 }, to: { year: 2026, q: 2 } });
  const b = inflate({ amount: f.value, from: { year: 2026, q: 2 }, to: { year: 1999, q: 3 } });
  assert.equal(b.value.toFixed(6), '100.000000');
  assert.equal(b.annualPct.toFixed(6), f.annualPct.toFixed(6));
  assert.ok(b.totalPct < 0);
});

test('same quarter is unchanged, and unpublished quarters return null', () => {
  const r = inflate({ amount: 50, from: { year: 2000, q: 1 }, to: { year: 2000, q: 1 } });
  assert.equal(r.value, 50);
  assert.equal(r.annualPct, 0);
  assert.equal(inflate({ amount: 50, from: { year: 2026, q: 3 }, to: { year: 2000, q: 1 } }), null);
});

test('year to Jun 2026 inflation is 3.9%', () => {
  const rows = yearByYear({ year: 2024, q: 2 }, { year: 2026, q: 2 });
  assert.deepEqual(rows.map((r) => [r.year, r.pct.toFixed(1)]), [[2025, '2.1'], [2026, '3.9']]);
});

test('year-by-year rows end at the later quarter and cover only full years', () => {
  const rows = yearByYear({ year: 2023, q: 3 }, { year: 2026, q: 2 });
  assert.deepEqual(rows.map((r) => `${r.year}-${r.q}`), ['2025-2', '2026-2']);
  assert.deepEqual(yearByYear({ year: 2026, q: 2 }, { year: 2023, q: 3 }).length, 2);
  assert.equal(yearByYear({ year: 2026, q: 1 }, { year: 2026, q: 2 }).length, 0);
});

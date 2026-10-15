// Fails once the income year the site calls current has ended (plus a short grace period), so rates can't
// quietly go stale on 1 July. The monthly scheduled run in .github/workflows/pages.yml turns CI red when it does.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CURRENT_YEAR, YEARS, yearEnd } from '../js/rates.js';
import { TAX_YEAR } from '../js/calc.js';

const GRACE_DAYS = 14;
const next = (year) => { const y = Number(year.slice(0, 4)) + 1; return `${y}-${String((y + 1) % 100).padStart(2, '0')}`; };

test('the current income year is in the rates table and calc.js uses it', () => {
  assert.ok(YEARS[CURRENT_YEAR], `js/rates.js has no ${CURRENT_YEAR} entry`);
  assert.equal(TAX_YEAR, CURRENT_YEAR);
});

test('rates are for an income year that hasn\'t ended', () => {
  const deadline = new Date(`${yearEnd(CURRENT_YEAR)}T00:00:00Z`);
  deadline.setUTCDate(deadline.getUTCDate() + GRACE_DAYS);
  // Today in Australia (AEST, UTC+10), so the check doesn't depend on the server's time zone.
  const today = new Date(Date.now() + 10 * 3600000).toISOString().slice(0, 10);
  assert.ok(today <= deadline.toISOString().slice(0, 10),
    `Rates need updating for ${next(CURRENT_YEAR)}: the site still treats ${CURRENT_YEAR} (TAX_YEAR) as current, and it ended on ${yearEnd(CURRENT_YEAR)}. `
    + 'Add the new year to js/rates.js, set CURRENT_YEAR, check every engine and FAQ figure, then update RATES_CHECKED.');
});

test('the rollover check would catch a stale year', () => {
  assert.equal(next('2026-27'), '2027-28');
  assert.equal(yearEnd('2026-27'), '2027-06-30');
});

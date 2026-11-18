// The guides quote figures worked out with the calculators. These checks fail if an engine or rate changes
// and a guide still shows the old number.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mortgage, takeHome } from '../js/calc.js';
import { borrowingPower } from '../js/borrowing.js';
import { taxAndMedicareFor } from '../js/rates.js';
import { capitalGainsTax, oldRulesTax } from '../js/cgt.js';
import { rentalCashflow } from '../js/rental.js';

const money = (n) => `$${Math.round(n).toLocaleString('en-AU')}`;
const has = (file, ...xs) => { const h = readFileSync(`guides/${file}.html`, 'utf8'); for (const x of xs) assert.ok(h.includes(x), `guides/${file}.html should say ${x}`); };

test('rate rise guide', () => {
  for (const p of [400000, 600000, 800000]) {
    const [a, b, c] = [5.45, 6.45, 6.7].map((r) => mortgage({ principal: p, ratePct: r, years: 30 }).repayment);
    has('rate-rise-november-2026', money(a), money(b), money(c), money(c - a), money(c - b));
  }
  const th = (n) => `$${(Math.round(n / 1000) * 1000).toLocaleString('en-AU')}`;
  const one = (r) => borrowingPower({ applicants: [{ income: 100000 }], expenses: 2500, ratePct: r, years: 30 }).maxLoan;
  const two = (r) => borrowingPower({ applicants: [{ income: 100000 }, { income: 80000 }], expenses: 4000, ratePct: r, years: 30 }).maxLoan;
  has('rate-rise-november-2026', th(one(5.45)), th(one(6.7)), th(two(5.45)), th(two(6.7)));
});

test('tax cut guide', () => {
  for (const inc of [45000, 60000, 80000, 100000, 135000, 200000]) {
    has('tax-cut-2026-27', ...['2025-26', '2026-27', '2027-28'].map((y) => money(taxAndMedicareFor(y, inc))));
  }
  has('tax-cut-2026-27', money(takeHome(100000).net), money(takeHome(100000).net / 52));
});

test('capital gains tax guide', () => {
  const cases = [
    { asset: 'shares', price: 50000, proceeds: 100000, bought: '2021-03-01', sold: '2030-03-01', startValue: 80000, income: 90000 },
    { asset: 'shares', price: 60000, proceeds: 100000, bought: '2027-07-01', sold: '2030-07-01', income: 30000 },
    { asset: 'property', price: 600000, buyCosts: 30000, proceeds: 1000000, sellCosts: 20000, bought: '2015-07-01', sold: '2032-07-01', income: 100000 },
    { asset: 'newbuild', price: 700000, proceeds: 900000, bought: '2027-09-01', sold: '2032-09-01', income: 100000 },
  ];
  for (const o of cases) {
    const r = capitalGainsTax(o);
    has('capital-gains-tax-2027', money(r.total), money(oldRulesTax(o)), money(r.netGain));
  }
  has('capital-gains-tax-2027', money(capitalGainsTax(cases[1]).minTax), money(capitalGainsTax(cases[2]).startValue));
});

test('negative gearing guide', () => {
  const base = { weeklyRent: 650, vacancyWeeks: 2, price: 750000, loan: 600000, ratePct: 7, loanType: 'io', termYears: 30, councilRates: 2200, insurance: 1800, pmPct: 7, maintenance: 1500, income: 120000 };
  const g = rentalCashflow({ fyStart: 2027, acquired: '2026-01-01', ...base });
  const c = rentalCashflow({ fyStart: 2027, acquired: '2026-09-01', ...base });
  const nb = rentalCashflow({ fyStart: 2027, acquired: '2026-09-01', ...base, newBuild: true, depreciation: 8000 });
  has('negative-gearing-2027', money(g.rent), money(g.interest), money(-g.net), money(-g.taxEffect), `${money(-g.afterTaxWeekly)} a week`, `${money(-c.afterTaxWeekly)} a week`, money(-nb.taxEffect), `${money(-nb.afterTaxWeekly)} a week`);
});

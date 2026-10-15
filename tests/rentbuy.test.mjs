import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rentVsBuy, RENTBUY_CHECKED } from '../js/rentbuy.js';
import { stampDuty } from '../js/duty.js';
import { repayment } from '../js/calc.js';

const base = {
  price: 800000, deposit: 160000, state: 'NSW', otherUpfront: 3000, ratePct: 6, termYears: 30,
  councilRates: 2000, strata: 0, insurance: 1800, maintenancePct: 1, costInflationPct: 3,
  growthPct: 5, weeklyRent: 650, rentGrowthPct: 4, returnPct: 7, taxDragPct: 15, sellingCostPct: 2.5, years: 10,
};
const near = (a, b, d = 0.5) => assert.ok(Math.abs(a - b) < d, `${a} ≈ ${b}`);

test('checked date is exported', () => assert.equal(RENTBUY_CHECKED, '15 Oct 2026'));

test('upfront costs use the state stamp duty engine and the loan repayment formula', () => {
  const r = rentVsBuy(base);
  assert.equal(r.duty, stampDuty({ state: 'NSW', value: 800000, home: true }).total);
  assert.equal(r.upfront, 160000 + r.duty + 3000);
  assert.equal(r.loan, 640000);
  near(r.repayment, repayment(640000, 6, 30, 12), 1e-6);
  assert.equal(r.rows.length, 10);
});

test('first home buyer exemption lowers duty and the renter starts with less invested', () => {
  const fhb = rentVsBuy({ ...base, firstHome: true });
  assert.equal(fhb.duty, 0); // NSW: homes $800,000 or less pay no duty
  assert.ok(fhb.rent < rentVsBuy(base).rent);
  assert.equal(fhb.upfront, 163000);
});

test('with no growth, no returns, no costs and an all-cash purchase, buying equals renting minus rent paid', () => {
  const r = rentVsBuy({ price: 500000, deposit: 500000, state: 'ACT', home: false, ratePct: 0, weeklyRent: 0, years: 3 });
  // Renter invests the price + duty at 0%; buyer holds a $500,000 home.
  near(r.buy, 500000);
  near(r.rent, 500000 + r.duty);
});

test('break-even is the first year buying is ahead and stays ahead', () => {
  const r = rentVsBuy(base);
  const k = r.rows.findIndex((x) => x.diff >= 0);
  assert.equal(r.breakEven, r.rows[k].year);
  assert.ok(r.rows.slice(k).every((x) => x.diff >= 0));
  // Zero growth and a high investment return: renting stays ahead, no break-even.
  assert.equal(rentVsBuy({ ...base, growthPct: 0, returnPct: 10 }).breakEven, null);
});

test('net wealth ends with the last yearly row; loan is paid off within the term', () => {
  const r = rentVsBuy({ ...base, termYears: 5, years: 6 });
  assert.equal(r.buy, r.rows.at(-1).buy);
  assert.equal(r.rows.at(-1).balance, 0);
  assert.equal(r.rows[5].repayments, 0);
});

test('higher tax drag lowers the renter\'s wealth; selling costs lower the buyer\'s', () => {
  assert.ok(rentVsBuy({ ...base, taxDragPct: 30 }).rent < rentVsBuy({ ...base, taxDragPct: 0 }).rent);
  assert.ok(rentVsBuy({ ...base, sellingCostPct: 5 }).buy < rentVsBuy({ ...base, sellingCostPct: 0 }).buy);
});

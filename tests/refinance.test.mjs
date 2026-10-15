import { test } from 'node:test';
import assert from 'node:assert/strict';
import { refinance, REFINANCE_CHECKED } from '../js/refinance.js';
import { mortgage } from '../js/calc.js';

const near = (a, b, tol = 0.01) => assert.ok(Math.abs(a - b) <= tol, `${a} is not within ${tol} of ${b}`);
const base = { balance: 500000, currentRatePct: 6.5, yearsLeft: 25, newRatePct: 5.9 };

test('checked date is exported', () => assert.equal(REFINANCE_CHECKED, '15 Oct 2026'));

test('repayments and interest match the mortgage calculator for each loan', () => {
  const r = refinance({ ...base, costs: 0 });
  const a = mortgage({ principal: 500000, ratePct: 6.5, years: 25 });
  const b = mortgage({ principal: 500000, ratePct: 5.9, years: 25 });
  near(r.currentRepayment, a.repayment);
  near(r.newRepayment, b.repayment);
  near(r.interestCurrent, a.interest, 0.05);
  near(r.interestNew, b.interest, 0.05);
  near(r.monthlySaving, a.repayment - b.repayment);
  // By hand: 500000 × (0.065/12) / (1 − (1 + 0.065/12)^−300) = $3,376.04
  near(r.currentRepayment, 3376.04);
});

test('net saving = interest saved − costs + cashback, whether costs are paid up front or added to the loan', () => {
  const up = refinance({ ...base, costs: 2000, cashback: 3000 });
  near(up.netSaving, up.interestSaved - 2000 + 3000, 0.05);
  const add = refinance({ ...base, costs: 2000, cashback: 3000, addCosts: true });
  assert.equal(add.newPrincipal, 502000);
  near(add.netSaving, add.interestSaved - 2000 + 3000, 0.05);
  assert.ok(add.netSaving < up.netSaving, 'borrowing the costs means paying interest on them');
});

test('break-even: same rate means costs are never recovered; a cashback bigger than costs pays from day one', () => {
  assert.equal(refinance({ ...base, newRatePct: 6.5, costs: 1000 }).breakEven, null);
  assert.equal(refinance({ ...base, costs: 1000, cashback: 2000 }).breakEven, 0);
  const r = refinance({ ...base, costs: 1000 });
  assert.ok(r.breakEven > 0 && r.breakEven <= Math.ceil(1000 / r.monthlySaving), `break-even ${r.breakEven}`);
});

test('a longer new term lowers repayments but can cost more overall', () => {
  const r = refinance({ ...base, newRatePct: 6.4, newYears: 30, costs: 1000 });
  assert.ok(r.monthlySaving > 0);
  assert.ok(r.netSaving < 0);
  assert.equal(r.breakEven, null);
});

test('keeping the old repayment on the new loan pays it off sooner', () => {
  const r = refinance({ ...base, costs: 0 });
  assert.ok(r.keep.months < 300);
  assert.equal(r.keep.monthsSaved, 300 - r.keep.months);
  assert.ok(r.keep.interestSaved > r.interestSaved);
});

test('0% new rate and yearly table', () => {
  const r = refinance({ ...base, newRatePct: 0, costs: 0 });
  near(r.newRepayment, 500000 / 300);
  near(r.interestNew, 0);
  assert.equal(r.years.length, 25);
  near(r.years.at(-1).currentBalance, 0);
  near(r.years.at(-1).ahead, r.netSaving, 0.05);
});

test('default fee constants: NSW LRS 2026-27 registration fee, discharge fee estimate', async () => {
  const m = await import('../js/refinance.js');
  assert.equal(m.NSW_REGISTRATION_FEE, 182.73);
  assert.equal(m.DISCHARGE_FEE_ESTIMATE, 350);
});

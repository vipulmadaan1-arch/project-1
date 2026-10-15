import { test } from 'node:test';
import assert from 'node:assert/strict';
import { helpPayoff, voluntaryEffect, HELP_INDEXATION_2026, MAX_YEARS } from '../js/hecs.js';
import { helpRepayment } from '../js/calc.js';

const close = (a, b, tol = 0.01) => assert.ok(Math.abs(a - b) <= tol, `${a} ≠ ${b}`);

test('2026 indexation rate is 2.8%', () => assert.equal(HELP_INDEXATION_2026, 2.8));

test('one year: index on 1 June then take off the compulsory repayment', () => {
  const r = helpPayoff({ debt: 30000, income: 90000, payRisePct: 0, indexationPct: 2.8 });
  const y = r.rows[0];
  assert.equal(y.label, '2026-27');
  close(y.indexation, 840);
  close(y.compulsory, helpRepayment(90000)); // (90,000 − 69,528) × 15% = 3,070.80
  close(y.compulsory, 3070.8);
  close(y.balance, 30000 * 1.028 - 3070.8);
});

test('balances reconcile: debt + indexation = total repaid', () => {
  const r = helpPayoff({ debt: 45000, income: 85000, payRisePct: 3, indexationPct: 3, voluntary: 1000 });
  assert.ok(r.repaid);
  close(45000 + r.totalIndexation, r.totalRepaid);
  assert.equal(r.years, r.rows.length);
  assert.equal(r.rows.at(-1).balance, 0);
  // The last compulsory repayment only covers what's left.
  assert.ok(r.rows.at(-1).compulsory <= helpRepayment(r.rows.at(-1).income) + 1e-9);
});

test('income above the top threshold repays 10% of all income', () => {
  const r = helpPayoff({ debt: 100000, income: 200000, indexationPct: 0 });
  close(r.rows[0].compulsory, 20000);
  assert.equal(r.years, 5);
});

test('income below the threshold never repays and the debt grows', () => {
  const r = helpPayoff({ debt: 20000, income: 50000, payRisePct: 0, indexationPct: 2.8 });
  assert.equal(r.repaid, false);
  assert.equal(r.years, null);
  assert.equal(r.rows.length, MAX_YEARS);
  assert.ok(r.remaining > 20000);
});

test('pay rises bring a below-threshold earner into repayments', () => {
  const r = helpPayoff({ debt: 20000, income: 60000, payRisePct: 4, indexationPct: 2.8 });
  assert.equal(r.rows[0].compulsory, 0);
  assert.ok(r.repaid);
});

test('voluntary repayments save time and indexation', () => {
  const e = voluntaryEffect({ debt: 40000, income: 80000, payRisePct: 3, indexationPct: 2.8, voluntary: 3000 });
  assert.ok(e.yearsSaved > 0);
  assert.ok(e.indexationSaved > 0);
  assert.ok(e.plan.totalRepaid < e.base.totalRepaid);
});

test('a voluntary repayment larger than the debt clears it in year one', () => {
  const r = helpPayoff({ debt: 5000, income: 0, voluntary: 10000 });
  assert.equal(r.years, 1);
  assert.equal(r.totalVoluntary, 5000);
  assert.equal(r.totalIndexation, 0);
});

test('zero debt', () => {
  const r = helpPayoff({ debt: 0, income: 100000 });
  assert.equal(r.years, 0);
  assert.equal(r.totalRepaid, 0);
});

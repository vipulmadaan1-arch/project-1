import { test } from 'node:test';
import assert from 'node:assert/strict';
import { termDeposit, taxOnInterest, TERM_DEPOSIT_CHECKED } from '../js/term-deposit.js';

const near = (a, b, tol = 0.01) => assert.ok(Math.abs(a - b) <= tol, `${a} is not within ${tol} of ${b}`);

test('checked date is exported', () => assert.equal(TERM_DEPOSIT_CHECKED, '15 Oct 2026'));

test('at maturity: simple interest', () => {
  // $10,000 at 5% for 12 months = $500; for 6 months = $250.
  near(termDeposit({ amount: 10000, ratePct: 5, months: 12 }).interest, 500);
  near(termDeposit({ amount: 10000, ratePct: 5, months: 6 }).interest, 250);
  near(termDeposit({ amount: 10000, ratePct: 5, months: 6 }).balance, 10250);
});

test('paid out monthly: same total as simple interest, balance unchanged', () => {
  const r = termDeposit({ amount: 10000, ratePct: 5, months: 12, paid: 'monthly', reinvest: false });
  near(r.interest, 500);
  near(r.perPayment, 41.67);
  assert.equal(r.payments, 12);
  assert.equal(r.balance, 10000);
});

test('reinvested: compounds at the payment frequency', () => {
  // 10000 × (1 + 0.05/12)^12 − 10000 = $511.62
  near(termDeposit({ amount: 10000, ratePct: 5, months: 12, paid: 'monthly' }).interest, 511.62);
  // 10000 × (1.0125)^4 − 10000 = $509.45
  near(termDeposit({ amount: 10000, ratePct: 5, months: 12, paid: 'quarterly' }).interest, 509.45);
  // Annually over 2 years: 10000 × 1.05^2 − 10000 = $1,025
  near(termDeposit({ amount: 10000, ratePct: 5, months: 24, paid: 'annually' }).interest, 1025);
});

test('part-period at the end earns simple interest pro rata', () => {
  // 18 months, annually reinvested: 10000 × 1.05 × (1 + 0.05 × 6/12) − 10000 = $762.50
  near(termDeposit({ amount: 10000, ratePct: 5, months: 18, paid: 'annually' }).interest, 762.5);
});

test('0% and tax on interest', () => {
  assert.equal(termDeposit({ amount: 10000, ratePct: 0, months: 12, paid: 'monthly' }).interest, 0);
  // $80,000 other income: 30% tax bracket + 2% Medicare levy = 32%.
  const t = taxOnInterest(500, 80000);
  near(t.tax, 160);
  near(t.afterTax, 340);
  // Under the tax-free threshold: no tax.
  assert.equal(taxOnInterest(500, 10000).tax, 0);
});

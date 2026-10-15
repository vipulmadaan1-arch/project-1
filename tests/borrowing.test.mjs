import { test } from 'node:test';
import assert from 'node:assert/strict';
import { borrowingPower, presentValue, APRA_BUFFER, CARD_RATE, DTI_LIMIT } from '../js/borrowing.js';

const base = { applicants: [{ income: 100000 }], expenses: 2500, ratePct: 6, years: 30 };

test('present value matches the annuity formula', () => {
  // $1,000 a month for 30 years at 9%: 1000 × (1 − 1.0075^−360) / 0.0075 = 124,281.87
  assert.equal(presentValue(1000, 9, 360).toFixed(2), '124281.87');
  assert.equal(presentValue(1000, 0, 360), 360000);
  assert.equal(presentValue(0, 9, 360), 0);
  assert.equal(presentValue(-50, 9, 360), 0);
});

test('APRA buffer is 3 percentage points and DTI limit is 6', () => {
  assert.equal(APRA_BUFFER, 3);
  assert.equal(DTI_LIMIT, 6);
  assert.equal(CARD_RATE, 0.038);
});

test('$100,000 single, $2,500 a month expenses, 6% over 30 years', () => {
  const r = borrowingPower(base);
  // Tax 2026-27: 15% × 26,800 + 30% × 55,000 = 20,520; Medicare 2% = 2,000; net 77,480 a year.
  assert.equal(r.people[0].net, 77480);
  assert.equal(r.netMonthly.toFixed(2), '6456.67');
  assert.equal(r.surplus.toFixed(2), '3956.67');
  assert.equal(r.assessRate, 9);
  assert.equal(r.maxLoan.toFixed(2), presentValue(77480 / 12 - 2500, 9, 360).toFixed(2));
  assert.equal(Math.round(r.maxLoan), 491742);
  // Repayment at the real 6% rate is lower than the assessed (buffered) one.
  assert.equal(Math.round(r.repayment), 2948);
  assert.equal(r.dti.toFixed(2), '4.92');
});

test('buffer is applied: borrowing at 9% assessed is less than at 6%', () => {
  const r = borrowingPower(base);
  const noBuffer = borrowingPower({ ...base, buffer: 0 });
  assert.ok(r.maxLoan < noBuffer.maxLoan);
  assert.equal(noBuffer.maxLoan.toFixed(2), presentValue(r.surplus, 6, 360).toFixed(2));
});

test('credit card limits count at 3.8% a month, and other repayments in full', () => {
  const r = borrowingPower({ ...base, cardLimits: 10000, otherRepayments: 500 });
  assert.equal(r.cardCommitment.toFixed(2), '380.00');
  assert.equal(r.surplus.toFixed(2), (77480 / 12 - 2500 - 380 - 500).toFixed(2));
  assert.equal(r.totalDebt.toFixed(2), (r.maxLoan + 10000).toFixed(2));
});

test('rental income is shaded to 80% and split between two applicants', () => {
  const r = borrowingPower({ applicants: [{ income: 80000 }, { income: 60000 }], otherIncome: 20000, expenses: 4000, ratePct: 6, years: 30 });
  assert.equal(r.people[0].gross, 88000);
  assert.equal(r.people[1].gross, 68000);
  assert.equal(r.grossIncome, 160000); // DTI uses income before shading
});

test('zero or negative surplus means no loan', () => {
  const r = borrowingPower({ ...base, expenses: 6456.67 });
  assert.equal(r.maxLoan, 0);
  assert.equal(r.repayment, 0);
  const worse = borrowingPower({ ...base, expenses: 9000 });
  assert.ok(worse.surplus < 0);
  assert.equal(worse.maxLoan, 0);
});

test('high DTI is flagged at 6 times income or more', () => {
  const r = borrowingPower({ ...base, applicants: [{ income: 100000 }], expenses: 500, ratePct: 4, years: 30 });
  assert.ok(r.dti >= 6);
  assert.equal(r.highDti, true);
  assert.equal(r.dtiCapLoan, 600000);
});

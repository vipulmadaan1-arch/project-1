import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluate, nswTransferDuty, nswDuty, incomeTax, lito, medicareLevy, takeHome,
  mortgage, offsetSavings, compoundInterest, convert, formatDuration,
} from '../js/calc.js';

test('calculator evaluates with precedence, brackets and percent', () => {
  assert.equal(evaluate('2+3×4'), 14);
  assert.equal(evaluate('(2+3)*4'), 20);
  assert.equal(evaluate('10÷4'), 2.5);
  assert.equal(evaluate('-5+2'), -3);
  assert.equal(evaluate('50%*200'), 100);
  assert.equal(evaluate('0.1+0.2'), 0.3);
  assert.throws(() => evaluate('2+'));
  assert.throws(() => evaluate('1/0'));
});

test('NSW duty matches Revenue NSW 2026/27 worked examples', () => {
  assert.equal(nswTransferDuty(1350000), 55537);
  assert.equal(nswTransferDuty(4000000), 203237);
  assert.equal(nswTransferDuty(450000), 14437);
  assert.equal(nswTransferDuty(1000), 20); // minimum
  // bracket boundary continuity
  assert.equal(nswTransferDuty(387000), 11602);
  assert.equal(nswTransferDuty(1290000), 52237);
});

test('NSW first home buyer and foreign surcharge', () => {
  assert.equal(nswDuty(750000, { firstHomeBuyer: true }).duty, 0);
  assert.equal(nswDuty(900000, { firstHomeBuyer: true }).duty, nswTransferDuty(900000));
  const f = nswDuty(1000000, { foreign: true });
  assert.equal(f.surcharge, 90000);
  assert.equal(f.total, f.duty + 90000);
});

test('income tax 2026-27 brackets', () => {
  assert.equal(incomeTax(18200), 0);
  assert.equal(incomeTax(45000), (45000 - 18200) * 0.15);
  assert.equal(Math.round(incomeTax(135000)), Math.round(4020 + 27000));
  assert.equal(lito(30000), 700);
  assert.equal(lito(45000), 325);
  assert.equal(lito(70000), 0);
});

test('Medicare levy matches ATO shade-in example', () => {
  assert.equal(Math.round(medicareLevy(29000) * 100) / 100, 98.9);
  assert.equal(medicareLevy(28000), 0);
  assert.equal(medicareLevy(100000), 2000);
});

test('take-home pay is consistent', () => {
  const r = takeHome(100000);
  assert.equal(Math.round(r.net), Math.round(100000 - r.tax - r.medicare));
  assert.equal(Math.round(r.super), 12000);
  const inc = takeHome(112000, { includesSuper: true });
  assert.equal(Math.round(inc.salary), 100000);
});

test('mortgage repayment known value', () => {
  // $500k, 6%, 30y monthly ≈ $2,997.75
  assert.equal(Math.round(mortgage({ principal: 500000, ratePct: 6, years: 30 }).repayment * 100) / 100, 2997.75);
  assert.equal(mortgage({ principal: 1200, ratePct: 0, years: 1 }).repayment, 100);
});

test('offset saves interest and time', () => {
  const r = offsetSavings({ principal: 500000, ratePct: 6, years: 30, offset: 50000 });
  assert.ok(r.interestSaved > 0);
  assert.ok(r.yearsSaved > 0);
  const none = offsetSavings({ principal: 500000, ratePct: 6, years: 30, offset: 0 });
  assert.equal(Math.round(none.interestSaved), 0);
});

test('compound interest annual matches formula', () => {
  const r = compoundInterest({ principal: 10000, ratePct: 5, years: 10, compoundsPerYear: 1, contribution: 0 });
  assert.equal(Math.round(r.balance * 100) / 100, Math.round(10000 * 1.05 ** 10 * 100) / 100);
  assert.equal(r.yearly.length, 10);
});

test('unit conversion', () => {
  assert.equal(convert('Length', 1, 'km', 'm'), 1000);
  assert.equal(convert('Temperature', 100, '°C', '°F'), 212);
  assert.ok(Math.abs(convert('Mass', 1, 'lb', 'kg') - 0.45359237) < 1e-12);
});

test('duration formatting', () => {
  assert.equal(formatDuration(61230), '01:01.23');
  assert.equal(formatDuration(3723000, { showMs: false }), '01:02:03');
});

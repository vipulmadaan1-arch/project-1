import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluate, nswTransferDuty, nswDuty, incomeTax, lito, medicareLevy, takeHome,
  mortgage, offsetSavings, compoundInterest, convert, formatDuration,
  gst, percent, rentalYield, daysBetween, businessDays, ymdBetween, addDays,
  nswFhbConcessionDuty, helpRepayment,
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
  // concession: full duty at $1m boundary behaviour, 0 at $800k, and the third-party worked saving at $850k
  assert.equal(nswTransferDuty(800000), 30187);
  assert.equal(nswTransferDuty(850000) - nswFhbConcessionDuty(850000), 22640);
  assert.equal(nswFhbConcessionDuty(800000), 0);
  assert.equal(nswDuty(900000, { firstHomeBuyer: true }).duty, nswFhbConcessionDuty(900000));
  assert.equal(nswDuty(1000000, { firstHomeBuyer: true }).duty, nswTransferDuty(1000000));
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

test('super is capped at the maximum contribution base', () => {
  assert.equal(Math.round(takeHome(400000).super), Math.round(270830 * 0.12));
  const pkg = takeHome(300000 + 270830 * 0.12, { includesSuper: true });
  assert.equal(Math.round(pkg.salary), 300000);
});

test('GST add and remove', () => {
  assert.equal(Math.round(gst(100, 'add').inclusive * 100) / 100, 110);
  const r = gst(110, 'remove');
  assert.equal(Math.round(r.gst * 100) / 100, 10);
  assert.equal(Math.round(r.exclusive * 100) / 100, 100);
});

test('percentages', () => {
  assert.equal(percent.of(15, 200), 30);
  assert.equal(percent.whatPercent(30, 120), 25);
  assert.equal(percent.change(80, 100), 25);
  assert.equal(percent.change(100, 80), -20);
  assert.ok(Number.isNaN(percent.change(0, 5)));
});

test('rental yield', () => {
  const r = rentalYield({ price: 520000, weeklyRent: 500, annualCosts: 6000 });
  assert.equal(Math.round(r.gross * 100) / 100, 5);
  assert.equal(Math.round(r.net * 100) / 100, Math.round(((26000 - 6000) / 520000) * 10000) / 100);
});

test('dates', () => {
  assert.equal(daysBetween('2026-01-01', '2026-12-31'), 364);
  assert.equal(daysBetween('2026-01-01', '2026-12-31', { inclusive: true }), 365);
  assert.equal(daysBetween('2026-04-04', '2026-04-05'), 1); // DST change in Australia
  assert.equal(businessDays('2026-10-12', '2026-10-18'), 5); // Mon–Sun
  assert.deepEqual(ymdBetween('1990-05-20', '2026-10-14'), { years: 36, months: 4, days: 24 });
  assert.deepEqual(ymdBetween('2026-01-31', '2026-03-01'), { years: 0, months: 1, days: 1 });
  assert.equal(addDays('2026-12-25', 10), '2027-01-04');
});

test('HELP repayments match ATO 2026-27 worked examples', () => {
  assert.equal(helpRepayment(69528), 0);
  assert.equal(Math.round(helpRepayment(86380) * 100) / 100, 2527.8);     // Christina
  assert.equal(Math.round(helpRepayment(137064) * 100) / 100, 10276.99);  // Barry
  assert.equal(helpRepayment(254780), 25478);                             // Priya
  // bands join up (no cliff) at the top threshold
  assert.ok(Math.abs(helpRepayment(186050) - helpRepayment(186051)) < 1);
  const r = takeHome(100000, { help: true });
  assert.equal(Math.round(r.help), Math.round((100000 - 69528) * 0.15));
  assert.equal(Math.round(r.net), Math.round(100000 - r.tax - r.medicare - r.help));
});

test('business days can exclude NSW public holidays', () => {
  // Week of Christmas 2026: Mon 21 – Mon 28 Dec. Weekdays 21,22,23,24,25,28 = 6; minus 25 and 28 = 4.
  assert.equal(businessDays('2026-12-21', '2026-12-28'), 6);
  assert.equal(businessDays('2026-12-21', '2026-12-28', { excludeHolidays: true }), 4);
  // Easter 2027: Good Friday 26 Mar, Easter Monday 29 Mar
  assert.equal(businessDays('2027-03-22', '2027-04-02', { excludeHolidays: true }), 8);
});

test('calculator handles implicit multiplication, exponents, tiny results and bad input', () => {
  assert.equal(evaluate('2(3)'), 6);
  assert.equal(evaluate('(2)(3)'), 6);
  assert.equal(evaluate('(1+1)3'), 6);
  assert.equal(evaluate('1e+21+1'), 1e21); // a large result carried into the next sum
  assert.equal(evaluate('2e-7*2'), 4e-7);
  assert.equal(evaluate('0.000000001*0.000000001'), 1e-18); // was rounded to 0
  assert.equal(evaluate('1/3'), 0.333333333333333);
  assert.ok(Object.is(evaluate('-0'), 0)); // no "-0"
  assert.throws(() => evaluate('.'), /Invalid/); // was reported as divide by zero
  assert.throws(() => evaluate('1e+'), /Invalid/);
  assert.throws(() => evaluate('5*/3'), /Invalid/);
  assert.throws(() => evaluate('1/(3-3)'), /divide by zero/);
  assert.throws(() => evaluate('0/0'), /divide by zero/);
  assert.throws(() => evaluate('1e300*1e300'), /too large/);
});

test('date helpers work for years before 100', () => {
  assert.deepEqual(ymdBetween('0001-01-01', '9999-12-31'), { years: 9998, months: 11, days: 30 });
  assert.equal(daysBetween('0001-01-01', '0002-01-01'), 365);
  assert.equal(addDays('0050-12-31', 1), '0051-01-01');
});

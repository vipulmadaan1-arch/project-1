import { test } from 'node:test';
import assert from 'node:assert/strict';
import { taxRefund, basicTax, medicareLevyFor, mlsFor, helpFor, REFUND_CHECKED, YEARS } from '../js/refund.js';

const near = (a, b, d = 0.01) => assert.ok(Math.abs(a - b) < d, `${a} ≈ ${b}`);

test('checked date is exported', () => assert.equal(REFUND_CHECKED, '15 Oct 2026'));

test('ATO resident rates: tax at $45,000 is $4,288 (2025-26) and $4,020 (2026-27); $135,000 is $31,288 / $31,020', () => {
  near(basicTax(45000, '2025-26'), 4288);
  near(basicTax(45000, '2026-27'), 4020);
  near(basicTax(135000, '2025-26'), 31288);
  near(basicTax(135000, '2026-27'), 31020);
  near(basicTax(190000, '2025-26'), 51638);
  near(basicTax(18200, '2025-26'), 0);
});

test('ATO Medicare levy example: Angie, $29,000 taxable income in 2025-26, pays $98.90', () => {
  near(medicareLevyFor(29000, '2025-26'), 98.9);
  assert.equal(medicareLevyFor(28011, '2025-26'), 0);
  near(medicareLevyFor(35013, '2025-26'), 700.2);
  near(medicareLevyFor(80000, '2025-26'), 1600);
});

test('MLS tiers differ by year (ATO): $105,000 is tier 1 in 2025-26 but base tier in 2026-27', () => {
  assert.equal(mlsFor(101000, '2025-26').tier, 0);
  assert.equal(mlsFor(101001, '2025-26').tier, 1);
  assert.equal(mlsFor(105000, '2025-26').tier, 1);
  assert.equal(mlsFor(105000, '2026-27').tier, 0);
  assert.equal(mlsFor(160000, '2025-26').rate, 0.015);
  near(mlsFor(117000, '2026-27').amount, 1170); // ATO 2026-27 example (Tom): $117,000 × 1%
});

test('HELP repayments follow the ATO marginal tables for each year', () => {
  assert.equal(helpFor(67000, '2025-26'), 0);
  near(helpFor(86380, '2026-27'), 2527.80); // ATO example 1 (Christina)
  near(helpFor(137064, '2026-27'), 10276.99); // ATO example 2 (Barry)
  near(helpFor(254780, '2026-27'), 25478); // ATO example 3 (Priya)
  near(helpFor(125000, '2025-26'), 8700);
  near(helpFor(130000, '2025-26'), 8700 + 5000 * 0.17);
  near(helpFor(180000, '2025-26'), 18000);
});

test('2025-26: $85,000 salary, $500 interest, $18,500 withheld gives a $352 refund', () => {
  const r = taxRefund({ year: '2025-26', salary: 85000, interest: 500, withheld: 18500 });
  assert.equal(r.taxable, 85500);
  near(r.incomeTax, 16438);
  near(r.medicare, 1710);
  near(r.refund, 352);
  assert.equal(r.standard, 0);
});

test('2026-27: the $1,000 standard deduction applies unless work deductions are larger', () => {
  const a = taxRefund({ year: '2026-27', salary: 85000, withheld: 18000, workDeductions: 400 });
  assert.equal(a.useStandard, true);
  assert.equal(a.workClaim, 1000);
  assert.equal(a.taxable, 84000);
  const b = taxRefund({ year: '2026-27', salary: 85000, withheld: 18000, workDeductions: 2500 });
  assert.equal(b.useStandard, false);
  assert.equal(b.taxable, 82500);
  // The standard deduction can't exceed labour income.
  assert.equal(taxRefund({ year: '2026-27', salary: 600 }).standard, 600);
  assert.equal(YEARS['2025-26'].standard, 0);
});

test('LITO is non-refundable but franking credits are refunded', () => {
  const r = taxRefund({ year: '2025-26', salary: 15000, dividends: 7000, franking: 3000, withheld: 0 });
  assert.equal(r.taxable, 25000);
  near(r.gross, 1088);
  near(r.lito, 700);
  near(r.incomeTax, 388);
  assert.equal(r.medicare, 0);
  near(r.refund, 3000 - 388);
});

test('no private hospital cover adds the MLS; HELP is added when ticked; owing shows as a negative refund', () => {
  const base = taxRefund({ year: '2025-26', salary: 120000, withheld: 30000 });
  const noCover = taxRefund({ year: '2025-26', salary: 120000, withheld: 30000, privateCover: false });
  near(base.refund - noCover.refund, 120000 * 0.0125);
  const withHelp = taxRefund({ year: '2025-26', salary: 120000, withheld: 30000, help: true });
  near(base.refund - withHelp.refund, (120000 - 67000) * 0.15);
  assert.ok(taxRefund({ year: '2025-26', salary: 120000, withheld: 0 }).refund < 0);
});

test('zero income gives zero tax and refunds all withholding; deductions cannot push taxable income below 0', () => {
  const r = taxRefund({ year: '2026-27', salary: 0, withheld: 500, otherDeductions: 1000 });
  assert.equal(r.taxable, 0);
  assert.equal(r.refund, 500);
  assert.throws(() => taxRefund({ year: '2019-20' }));
});

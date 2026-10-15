import { test } from 'node:test';
import assert from 'node:assert/strict';
import { capitalGainsTax, oldRulesTax, apportionedValue, minimumTax, indexationFactor, heldTwelveMonths, basicTax } from '../js/cgt.js';

const base = { asset: 'shares', price: 100000, proceeds: 200000, bought: '2020-01-15', income: 90000 };

test('Treasury draft apportioning example: $520,000 sold for $1.5m, 6,574 days, 4,017 before 1 July 2027', () => {
  assert.equal(apportionedValue({ price: 520000, proceeds: 1500000, bought: '2016-07-01', sold: '2034-06-30' }).toFixed(2), '993429.55');
});

test('minimum tax matches the Budget explainer (gain taxed at 14% pays an extra 16%)', () => {
  assert.equal(minimumTax(30000, 10000, 2027), 1600);
  assert.equal(minimumTax(250000, 10000, 2027), 0); // already taxed above 30%
});

test('tax rates by year: 16% to 2025-26, 15% in 2026-27, 14% from 2027-28', () => {
  assert.equal(basicTax(45000, 2025), 4288);
  assert.equal(basicTax(45000, 2026), 4020);
  assert.equal(Math.round(basicTax(45000, 2027)), 3752);
});

test('before 1 July 2027: 50% discount after 12 months', () => {
  const r = capitalGainsTax({ ...base, sold: '2026-11-01' });
  assert.equal(r.rules, 'current');
  assert.equal(r.netGain, 50000);
  assert.equal(r.minTax, 0);
  assert.equal(capitalGainsTax({ ...base, bought: '2026-01-15', sold: '2026-11-01' }).netGain, 100000);
});

test('12-month rule needs the sale after the first anniversary', () => {
  assert.equal(heldTwelveMonths('2026-01-15', '2027-01-15'), false);
  assert.equal(heldTwelveMonths('2026-01-15', '2027-01-16'), true);
});

test('indexation factor rounds to 3 decimal places and uses CPI quarters', () => {
  assert.equal(indexationFactor('2027-07-01', '2027-09-30', 0.025).factor, 1);
  assert.equal(indexationFactor('2027-07-01', '2028-07-01', 0).factor, 1);
});

test('held across 1 July 2027: deferred gain keeps the discount, the rest is indexed and minimum-taxed', () => {
  const r = capitalGainsTax({ ...base, sold: '2030-08-01', startValue: 150000, income: 0, inflation: 0 });
  assert.equal(r.deferredGain, 50000);
  assert.equal(r.postGain, 50000); // no inflation, so indexation adds nothing
  assert.equal(r.netGain, 75000);
  assert.equal(r.minTax, 3200); // 30% of $50,000 less the $11,800 basic tax the post-2027 gain adds
});

test('indexation never creates a loss', () => {
  const r = capitalGainsTax({ ...base, bought: '2028-01-01', proceeds: 101000, sold: '2034-01-01', inflation: 0.03 });
  assert.equal(r.netGain, 0);
  assert.equal(r.loss, 0);
});

test('a post-2027 loss reduces the deferred gain first', () => {
  const r = capitalGainsTax({ ...base, proceeds: 130000, sold: '2030-08-01', startValue: 150000 });
  assert.equal(r.deferredGain, 30000);
  assert.equal(r.postGain, 0);
});

test('income support recipients and foreign residents skip the minimum tax', () => {
  const o = { ...base, bought: '2028-01-01', sold: '2033-01-01', income: 20000 };
  assert.ok(capitalGainsTax(o).minTax > 0);
  assert.equal(capitalGainsTax({ ...o, support: true }).minTax, 0);
  const f = capitalGainsTax({ ...o, foreign: true });
  assert.equal(f.minTax, 0);
  assert.equal(f.netGain, 100000); // no discount, no indexation
});

test('new builds take whichever of the discount or indexation costs less', () => {
  const r = capitalGainsTax({ ...base, asset: 'newbuild', bought: '2028-01-01', sold: '2033-01-01', income: 20000 });
  assert.equal(r.choice, 'discount');
  assert.equal(r.minTax, 0);
});

test('main residence is exempt; old-rules comparison', () => {
  assert.equal(capitalGainsTax({ ...base, asset: 'home', sold: '2030-01-01' }).total, 0);
  assert.equal(oldRulesTax({ ...base, sold: '2026-11-01' }), capitalGainsTax({ ...base, sold: '2026-11-01' }).tax);
});

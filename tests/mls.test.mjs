import { test } from 'node:test';
import assert from 'node:assert/strict';
import { medicareLevySurcharge, mlsIncome, thresholds, tierFor, MLS_CHECKED, SPOUSE_EXEMPT } from '../js/mls.js';

test('ATO 2026-27 worked example: Tom, $90,000 taxable income + $27,000 fringe benefits pays $1,170', () => {
  const r = medicareLevySurcharge({ own: { taxable: 90000, fringe: 27000 } });
  assert.equal(r.income, 117000);
  assert.equal(r.tier, 1);
  assert.equal(r.rate, 0.01);
  assert.equal(r.surcharge, 1170);
});

test('income for MLS purposes adds fringe benefits, net investment losses and reportable super', () => {
  assert.equal(mlsIncome({ taxable: 80000, fringe: 5000, investmentLosses: 12000, reportableSuper: 10000 }), 107000);
});

test('surcharge is charged on taxable income + fringe benefits only, not losses or super', () => {
  const r = medicareLevySurcharge({ own: { taxable: 100000, investmentLosses: 10000, reportableSuper: 15000 } });
  assert.equal(r.income, 125000);
  assert.equal(r.tier, 2);
  assert.equal(r.surcharge, 1250); // 1.25% of $100,000
});

test('single thresholds are "or less": $105,000 pays nothing, $105,001 pays 1%', () => {
  assert.equal(medicareLevySurcharge({ own: { taxable: 105000 } }).surcharge, 0);
  assert.equal(medicareLevySurcharge({ own: { taxable: 105001 } }).surcharge, 1050.01);
  assert.equal(tierFor(123000), 1);
  assert.equal(tierFor(123001), 2);
  assert.equal(tierFor(164000), 2);
  assert.equal(tierFor(164001), 3);
  assert.equal(medicareLevySurcharge({ own: { taxable: 200000 } }).surcharge, 3000);
});

test('family thresholds rise $1,500 for each dependent child after the first', () => {
  assert.deepEqual(thresholds(true, 0), [210000, 246000, 328000]);
  assert.deepEqual(thresholds(true, 1), [210000, 246000, 328000]);
  assert.deepEqual(thresholds(true, 3), [213000, 249000, 331000]);
  assert.equal(tierFor(212000, true, 3), 0);
  assert.equal(tierFor(213001, true, 3), 1);
});

test('couples: the rate uses combined income, each pays on their own income', () => {
  const r = medicareLevySurcharge({ own: { taxable: 150000 }, family: true, spouse: true, spouseIncome: 100000 });
  assert.equal(r.income, 250000);
  assert.equal(r.tier, 2);
  assert.equal(r.surcharge, 1875); // 1.25% of $150,000
  assert.equal(medicareLevySurcharge({ own: { taxable: 150000 }, family: true, spouse: true, spouseIncome: 50000 }).surcharge, 0);
});

test('a spouse with own income for MLS purposes at or below the exemption amount pays no MLS', () => {
  const r = medicareLevySurcharge({ own: { taxable: SPOUSE_EXEMPT }, family: true, spouse: true, spouseIncome: 290000 });
  assert.equal(r.tier, 2);
  assert.equal(r.lowIncome, true);
  assert.equal(r.surcharge, 0);
  assert.ok(medicareLevySurcharge({ own: { taxable: SPOUSE_EXEMPT + 1 }, family: true, spouse: true, spouseIncome: 290000 }).surcharge > 0);
});

test('single parents use the family threshold', () => {
  assert.equal(medicareLevySurcharge({ own: { taxable: 150000 }, family: true, children: 1 }).surcharge, 0);
});

test('part-year without cover is pro-rated by days', () => {
  assert.equal(medicareLevySurcharge({ own: { taxable: 90000, fringe: 27000 }, days: 73 }).surcharge, 234);
});

test('compares the surcharge with a hospital cover premium', () => {
  const r = medicareLevySurcharge({ own: { taxable: 180000 }, premium: 1500 });
  assert.equal(r.surcharge, 2700);
  assert.equal(r.difference, 1200);
});

test('checked date is exported', () => assert.equal(MLS_CHECKED, '15 Oct 2026'));

test('spouse exemption is the ATO 2025-26 figure, $28,011 (M2 Medicare levy surcharge 2026)', () => {
  assert.equal(SPOUSE_EXEMPT, 28011);
  // $28,000 own income with a high-earning spouse: no surcharge (it was charged under the old $27,222 figure).
  assert.equal(medicareLevySurcharge({ own: { taxable: 28000 }, family: true, spouse: true, spouseIncome: 250000 }).surcharge, 0);
});

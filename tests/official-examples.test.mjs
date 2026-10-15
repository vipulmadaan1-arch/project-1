// Figures published by the official sources, checked against our engines (fetched 15 October 2026).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stampDuty } from '../js/duty.js';
import { incomeTax, helpRepayment } from '../js/calc.js';
import { medicareLevySurcharge } from '../js/mls.js';

test('VIC non-home duty matches SRO worked examples (sro.vic.gov.au, fixtures and duty)', () => {
  // $2,870 + 6% × ($500,000 − $130,000) = $25,070; over $960,000 to $2 million is 5.5% of the whole value.
  assert.equal(stampDuty({ state: 'VIC', value: 500000, home: false }).total, 25070);
  assert.equal(stampDuty({ state: 'VIC', value: 2000000, home: false }).total, 110000);
});

test('NSW transfer duty hits Revenue NSW 2026-27 threshold amounts (revenue.nsw.gov.au)', () => {
  const nsw = (v) => stampDuty({ state: 'NSW', value: v, home: false }).total;
  assert.equal(Math.round(nsw(38000)), 525);
  assert.equal(nsw(500000), 16687); // $11,602 + $4.50 × 1,130
  assert.equal(Math.round(nsw(387000)), 11602);
  assert.equal(Math.round(nsw(1290000)), 52237);
  assert.equal(Math.round(nsw(3870000)), 194137); // premium threshold
});

test('2026-27 resident income tax hits ATO bracket amounts (ato.gov.au)', () => {
  assert.equal(Math.round(incomeTax(45000)), 4020);
  assert.equal(Math.round(incomeTax(135000)), 31020);
  assert.equal(Math.round(incomeTax(190000)), 51370);
});

test('2026-27 study loan repayments match the ATO worked examples (ato.gov.au, repayment thresholds)', () => {
  assert.equal(helpRepayment(86380).toFixed(2), '2527.80'); // Christina
  assert.equal(helpRepayment(137064).toFixed(2), '10276.99'); // Barry
  assert.equal(helpRepayment(254780).toFixed(2), '25478.00'); // Priya
});

test('2026-27 Medicare levy surcharge matches the ATO example (Tom, $117,000 single, 1%)', () => {
  assert.equal(medicareLevySurcharge({ own: { taxable: 117000 } }).surcharge, 1170);
});

test('SA duty matches RevenueSA rates and worked examples (revenuesa.sa.gov.au)', () => {
  const sa = (v) => stampDuty({ state: 'SA', value: v, home: false }).total;
  assert.equal(sa(235000), 8317.5); // self-determined document guide example
  assert.equal(sa(150000), 4830);
  assert.equal(sa(300000), 11330);
  assert.equal(sa(500000), 21330);
});

test('TAS duty hits SRO Tasmania threshold amounts (sro.tas.gov.au)', () => {
  const tas = (v) => stampDuty({ state: 'TAS', value: v, home: false }).total;
  assert.equal(tas(3000), 50);
  assert.equal(tas(25000), 435);
  assert.equal(tas(75000), 1560);
  assert.equal(tas(200000), 5935);
  assert.equal(tas(375000), 12935);
  assert.equal(tas(725000), 27810);
});

test('NT duty follows the Territory Revenue Office formula (treasury.nt.gov.au, I-GEN-001)', () => {
  // Under $525,000: D = 0.06571441 × V² + 15V, V = value / 1,000. $525,000 to under $3 million: 4.95%.
  const nt = (v) => stampDuty({ state: 'NT', value: v, home: false }).total;
  const formula = (v) => 0.06571441 * (v / 1000) ** 2 + 15 * (v / 1000);
  for (const v of [300000, 500000]) assert.ok(Math.abs(nt(v) - formula(v)) < 0.5);
  assert.equal(nt(600000), 29700);
  assert.equal(nt(2000000), 99000);
});

test('ACT owner-occupier duty matches ACT Revenue Office rates (revenue.act.gov.au)', () => {
  // Up to $260,000: $0.28 per $100 or part. Over $1,455,000: a flat $4.54 per $100 of the whole value.
  const act = (v) => stampDuty({ state: 'ACT', value: v, home: true }).total;
  assert.equal(act(260000), 728);
  assert.equal(act(1500000), 68100);
});

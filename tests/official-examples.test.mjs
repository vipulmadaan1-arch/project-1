// Figures published by the official sources, checked against our engines (fetched 15 October 2026).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stampDuty } from '../js/duty.js';
import { incomeTax } from '../js/calc.js';

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

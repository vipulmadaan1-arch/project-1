import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lmi } from '../js/lmi.js';
import { upfrontCosts, registrationFees, UPFRONT_CHECKED } from '../js/upfront.js';

test('checked date is set', () => assert.equal(UPFRONT_CHECKED, '15 Oct 2026'));

test('registration fees 2026-27', () => {
  assert.deepEqual([registrationFees('NSW', 800000).transfer, registrationFees('NSW', 800000).mortgage], [182.73, 182.73]);
  assert.equal(registrationFees('QLD', 180000).transfer, 248.04);
  assert.equal(registrationFees('QLD', 180001).transfer, 294.6);
  assert.equal(registrationFees('QLD', 650000).transfer, 248.04 + 46.56 * 47);
  // Land Services SA table: $5,078 at $500,000; $10,328 at $1,000,000; $458 at $60,000.
  assert.equal(registrationFees('SA', 500000).transfer, 5078);
  assert.equal(registrationFees('SA', 1000000).transfer, 10328);
  assert.equal(registrationFees('SA', 60000).transfer, 458);
  assert.equal(registrationFees('SA', 45000).transfer, 353);
  // WA: OzCalc's capture of Landgate's calculator, $355.10 at $650,000.
  assert.equal(registrationFees('WA', 650000).transfer, 355.1);
  assert.equal(registrationFees('WA', 650000).estimate, true);
  // VIC estimate reproduces Delora's $1,742.30 at $700,000.
  assert.equal(registrationFees('VIC', 700000).transfer, 1742.3);
  assert.equal(registrationFees('VIC', 5000000).transfer, 3614.3);
  assert.equal(registrationFees('TAS', 500000).transfer, 256.76);
  assert.equal(registrationFees('ACT', 500000).mortgage, 184);
  assert.equal(registrationFees('NT', 500000).missing, true);
  assert.equal(registrationFees('NSW', 500000, { borrowing: false }).mortgage, 0);
});

test('upfront costs add up', () => {
  const r = upfrontCosts({ state: 'NSW', price: 750000, deposit: 75000, legal: 1800, inspection: 600, loanFee: 400 });
  const sum = r.items.reduce((s, i) => s + i.amount, 0);
  assert.equal(r.costs, Math.round(sum * 100) / 100);
  assert.equal(r.cash, Math.round((75000 + sum) * 100) / 100);
  assert.equal(r.lmiCost, lmi({ state: 'NSW', value: 750000, loan: 675000 }).total);
});

test('LMI added to the loan is not cash, and the scheme removes it when eligible', () => {
  const a = upfrontCosts({ state: 'VIC', price: 600000, deposit: 60000, firstHome: true, lmiToLoan: true });
  assert.equal(a.lmiCash, 0);
  assert.ok(a.lmiCost > 0);
  assert.equal(a.loanWithLmi, 540000 + a.lmiCost);
  const b = upfrontCosts({ state: 'VIC', price: 600000, deposit: 30000, firstHome: true, scheme: true });
  assert.equal(b.schemeUsed, true);
  assert.equal(b.lmiCost, 0);
  const c = upfrontCosts({ state: 'VIC', price: 600000, deposit: 30000, firstHome: false, scheme: true });
  assert.equal(c.schemeUsed, false);
});

test('bad input gives null', () => {
  assert.equal(upfrontCosts({ state: 'NSW', price: 500000, deposit: 600000 }), null);
  assert.equal(upfrontCosts({ state: 'NSW', price: 0, deposit: 0 }), null);
});

test('cash buyer: no loan, no mortgage fee, no LMI', () => {
  const r = upfrontCosts({ state: 'TAS', price: 500000, deposit: 500000, loanFee: 0 });
  assert.equal(r.rego.mortgage, 0);
  assert.equal(r.lmiCost, 0);
});

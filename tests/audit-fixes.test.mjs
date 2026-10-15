import { test } from 'node:test';
import assert from 'node:assert/strict';
import { refinance } from '../js/refinance.js';
import { termDeposit } from '../js/term-deposit.js';
import { upfrontCosts } from '../js/upfront.js';

test('refinance: no "keep paying" result when the new loan needs a higher repayment', () => {
  const r = refinance({ balance: 500000, currentRatePct: 6.4, yearsLeft: 25, newRatePct: 5.9, newYears: 10 });
  assert.ok(r.newRepayment > r.currentRepayment);
  assert.equal(r.keep, null);
});

test('refinance FAQ: 5.9% over a fresh 30 years repays $2,965.68 a month', () => {
  const r = refinance({ balance: 500000, currentRatePct: 6.4, yearsLeft: 25, newRatePct: 5.9, newYears: 30 });
  assert.equal(r.newRepayment.toFixed(2), '2965.68');
});

test('term deposit: a term shorter than one payment period pays only the interest earned', () => {
  const r = termDeposit({ amount: 10000, ratePct: 4.5, months: 5, paid: 'annually', reinvest: false });
  assert.equal(r.perPayment, 187.5);
  assert.equal(termDeposit({ amount: 10000, ratePct: 4.5, months: 12, paid: 'monthly', reinvest: false }).perPayment, 37.5);
});

test('upfront costs: no loan application fee for a cash buyer', () => {
  const r = upfrontCosts({ state: 'NSW', price: 750000, deposit: 750000 });
  assert.equal(r.items.find((i) => i.key === 'loanFee').amount, 0);
});

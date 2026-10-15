import { test } from 'node:test';
import assert from 'node:assert/strict';
import { balanceTransfer, transferPayoff, BALANCE_TRANSFER_CHECKED } from '../js/balance-transfer.js';
import { cardPayoff } from '../js/loans.js';

const near = (a, b, tol = 0.01) => assert.ok(Math.abs(a - b) <= tol, `${a} is not within ${tol} of ${b}`);

test('checked date is exported', () => assert.equal(BALANCE_TRANSFER_CHECKED, '15 Oct 2026'));

test('fee, 0% intro, then revert rate', () => {
  const r = balanceTransfer({ balance: 5000, currentRatePct: 20, feePct: 2, introRatePct: 0, introMonths: 12, revertRatePct: 21, payment: 300 });
  near(r.fee, 100);
  // 12 × $300 off $5,100 at 0% leaves $1,500.
  near(r.move.leftAtIntroEnd, 1500);
  assert.equal(r.move.months, 18);
  near(r.move.cost, r.move.interest + 100);
  near(r.stay.interest, cardPayoff({ balance: 5000, ratePct: 20, payment: 300 }).interest);
  near(r.saving, r.stay.cost - r.move.cost);
  near(r.clearInIntro, 425); // $5,100 ÷ 12
});

test('cleared inside the intro period: only the fee', () => {
  const r = balanceTransfer({ balance: 3000, currentRatePct: 20, feePct: 1, introRatePct: 0, introMonths: 12, revertRatePct: 21, payment: 500 });
  assert.equal(r.move.interest, 0);
  near(r.move.cost, 30);
  assert.equal(r.move.leftAtIntroEnd, 0);
});

test('same rates and no fee: identical to staying', () => {
  const r = balanceTransfer({ balance: 5000, currentRatePct: 20, feePct: 0, introRatePct: 20, introMonths: 6, revertRatePct: 20, payment: 200 });
  near(r.saving, 0);
});

test('repayment below revert-rate interest never clears', () => {
  const r = transferPayoff({ balance: 10000, introRatePct: 0, introMonths: 6, revertRatePct: 22, payment: 100 });
  assert.equal(r.paysOff, false);
  near(r.leftAtIntroEnd, 9400);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  balloonRepayment, trueRate, personalLoan, cardPayoff, cardPaymentFor, cardMinimumOnly,
  periodRate, savingsBalance, savingsTime, savingsDeposit, periodsUntil, describeMonths,
} from '../js/loans.js';

const near = (a, b, tol = 0.01) => assert.ok(Math.abs(a - b) <= tol, `${a} is not within ${tol} of ${b}`);

// ---------- Personal and car loans ----------
test('repayment matches the standard amortisation formula', () => {
  // $20,000 at 10% p.a. over 5 years, monthly: 20000 × (0.1/12) / (1 − (1 + 0.1/12)^−60) = $424.94
  near(balloonRepayment(20000, 10, 60, 12), 424.94);
  near(personalLoan({ amount: 20000, ratePct: 10, months: 60 }).repayment, 424.94);
});

test('0% interest splits the loan evenly, less any balloon', () => {
  assert.equal(balloonRepayment(12000, 0, 12, 12), 1000);
  assert.equal(balloonRepayment(12000, 0, 12, 12, 2400), 800);
  const r = personalLoan({ amount: 12000, ratePct: 0, months: 12 });
  assert.equal(r.interest, 0);
  assert.equal(r.trueRate, 0);
});

test('balloon: repayments leave exactly the balloon owing', () => {
  // $30,000 at 8% over 5 years with a $9,000 balloon. By hand: i = 0.08/12, (1+i)^60 = 1.489846,
  // (30000 − 9000/1.489846) × i / (1 − 1/1.489846) = $485.80
  const r = personalLoan({ amount: 30000, ratePct: 8, months: 60, balloon: 9000 });
  near(r.repayment, 485.80);
  let bal = 30000;
  for (let k = 0; k < 60; k++) bal = bal * (1 + 0.08 / 12) - r.repayment;
  near(bal, 9000);
  near(r.interest, 485.80 * 60 + 9000 - 30000, 0.5);
  // A balloon lowers repayments but costs more interest than the same loan without one.
  const plain = personalLoan({ amount: 30000, ratePct: 8, months: 60 });
  assert.ok(r.repayment < plain.repayment);
  assert.ok(r.interest > plain.interest);
});

test('fees: totals, repayment with fees and true cost rate', () => {
  const r = personalLoan({ amount: 30000, ratePct: 8, months: 60, upfrontFee: 250, financeFee: true, monthlyFee: 10 });
  assert.equal(r.principal, 30250);
  assert.equal(r.fees, 250 + 10 * 60);
  near(r.repaymentWithFees - r.repayment, 10);
  near(r.totalCost, r.interest + r.fees);
  near(r.totalPaid, 30000 + r.totalCost);
  assert.ok(r.trueRate > 8.9 && r.trueRate < 9.2, `true rate ${r.trueRate}`);
  // With no fees the true rate is just the interest rate.
  near(personalLoan({ amount: 30000, ratePct: 8, months: 60, balloon: 5000 }).trueRate, 8, 1e-6);
  // Paying the fee out of pocket: you borrow less but still pay the fee, so the true rate is above 8%.
  const out = personalLoan({ amount: 30000, ratePct: 8, months: 60, upfrontFee: 250, financeFee: false });
  assert.equal(out.principal, 30000);
  assert.ok(out.trueRate > 8.3);
});

test('weekly and fortnightly repayments, and very short terms', () => {
  const w = personalLoan({ amount: 10000, ratePct: 10, months: 12, frequency: 'weekly' });
  assert.equal(w.periods, 52);
  near(w.repayment, balloonRepayment(10000, 10, 52, 52));
  const one = personalLoan({ amount: 10000, ratePct: 12, months: 1 });
  assert.equal(one.periods, 1);
  near(one.repayment, 10100); // one month's interest at 1%
  assert.equal(personalLoan({ amount: 10000, ratePct: 12, months: 1, frequency: 'fortnightly' }).periods, 2);
  assert.ok(Number.isNaN(trueRate(0, 100, 12, 12)));
});

// ---------- Credit cards ----------
test('card payoff with a fixed payment', () => {
  // 0%: $1,200 at $100 a month is 12 months.
  assert.deepEqual(
    { months: cardPayoff({ balance: 1200, ratePct: 0, payment: 100 }).months, interest: cardPayoff({ balance: 1200, ratePct: 0, payment: 100 }).interest },
    { months: 12, interest: 0 });
  // 12% p.a. is 1% a month: $1,000 → $10 interest, cleared by one $1,010 payment.
  const one = cardPayoff({ balance: 1000, ratePct: 12, payment: 1010 });
  assert.equal(one.months, 1);
  near(one.interest, 10);
  // $5,000 at 20% paying $200: the last payment is smaller, so the total is less than 33 × $200.
  const r = cardPayoff({ balance: 5000, ratePct: 20, payment: 200 });
  assert.equal(r.months, 33);
  assert.ok(r.totalPaid < 33 * 200 && r.totalPaid > 32 * 200);
  near(r.totalPaid, 5000 + r.interest);
});

test('card payment that does not cover interest never pays off', () => {
  const r = cardPayoff({ balance: 6000, ratePct: 20, payment: 100 }); // interest is $100 a month
  assert.equal(r.paysOff, false);
  assert.equal(r.reason, 'interest');
  near(r.firstInterest, 100);
  assert.equal(cardPayoff({ balance: 6000, ratePct: 20, payment: 50 }).paysOff, false);
  // Just above the interest: pays off, slowly. −ln(1 − 100/101) / ln(1 + 0.2/12) = 279.2, so 280 months.
  assert.equal(cardPayoff({ balance: 6000, ratePct: 20, payment: 101 }).months, 280);
  const tooLong = cardPayoff({ balance: 6000, ratePct: 20, payment: 100.0000001 });
  assert.equal(tooLong.paysOff, false); // more than 100 years
  assert.equal(tooLong.reason, 'too-long');
  assert.equal(cardPayoff({ balance: 0, ratePct: 20, payment: 100 }).months, 0);
});

test('payment needed to clear a card in a set time', () => {
  near(cardPaymentFor({ balance: 1200, ratePct: 0, months: 12 }).payment, 100);
  const r = cardPaymentFor({ balance: 5000, ratePct: 20, months: 24 });
  near(r.payment, 254.48); // 5000 × (0.2/12) / (1 − (1 + 0.2/12)^−24)
  assert.equal(r.months, 24);
});

test('minimum repayments only', () => {
  // 0%: 2% of $1,000 is $20, under the $25 floor, so $25 a month for 40 months.
  const z = cardMinimumOnly({ balance: 1000, ratePct: 0, minPct: 2, minFloor: 25 });
  assert.equal(z.months, 40);
  assert.equal(z.interest, 0);
  assert.equal(z.firstPayment, 25);
  // $5,000 at 20%, 2%/$25: first payment is 2% of $5,083.33; takes decades.
  const r = cardMinimumOnly({ balance: 5000, ratePct: 20, minPct: 2, minFloor: 25 });
  near(r.firstPayment, 101.67);
  assert.ok(r.paysOff && r.months > 360, `months ${r.months}`);
  assert.ok(r.interest > cardPayoff({ balance: 5000, ratePct: 20, payment: 200 }).interest * 5);
  // Minimum below the monthly interest rate never clears the card.
  const never = cardMinimumOnly({ balance: 5000, ratePct: 30, minPct: 2, minFloor: 25 });
  assert.equal(never.paysOff, false);
  // Small balance: floor larger than balance pays it off in one go.
  assert.equal(cardMinimumOnly({ balance: 20, ratePct: 20 }).months, 1);
});

// ---------- Savings goals ----------
test('period rate converts compounding to the deposit frequency', () => {
  near(periodRate(12, 12, 12), 0.01, 1e-12);
  near(periodRate(5, 1, 12), Math.pow(1.05, 1 / 12) - 1, 1e-12);
  assert.equal(periodRate(0, 365, 52), 0);
});

test('savings at 0% interest', () => {
  const r = savingsTime({ target: 10000, start: 1000, ratePct: 0, deposit: 100, depositsPerYear: 12 });
  assert.equal(r.periods, 90);
  assert.equal(r.interest, 0);
  assert.equal(savingsTime({ target: 10000, start: 1000, ratePct: 0, deposit: 0 }).reached, false);
  assert.equal(savingsDeposit({ target: 10000, start: 1000, ratePct: 0, periods: 90 }).deposit, 100);
});

test('savings with interest: deposits at the start of each period', () => {
  // $1,000 at the start of each month for 12 months at 12% compounded monthly:
  // 1000 × 1.01 × (1.01^12 − 1) / 0.01 = $12,809.33
  near(savingsBalance({ start: 0, deposit: 1000, g: 0.01, n: 12 }), 12809.33);
  near(savingsDeposit({ target: 12809.33, start: 0, ratePct: 12, compoundsPerYear: 12, depositsPerYear: 12, periods: 12 }).deposit, 1000);
  const t = savingsTime({ target: 12809.32, start: 0, ratePct: 12, compoundsPerYear: 12, deposit: 1000, depositsPerYear: 12 });
  assert.equal(t.periods, 12);
  // One dollar more needs one more month.
  assert.equal(savingsTime({ target: 12810.33, start: 0, ratePct: 12, deposit: 1000 }).periods, 13);
  // Interest alone can get there.
  const grow = savingsTime({ target: 1100, start: 1000, ratePct: 12, deposit: 0 });
  assert.equal(grow.periods, 10); // 1.01^10 = 1.1046
  assert.equal(savingsTime({ target: 1000, start: 0, ratePct: 5, deposit: 0 }).reached, false);
});

test('savings goal already met, or met by interest on the starting balance', () => {
  assert.equal(savingsTime({ target: 5000, start: 5000, ratePct: 5, deposit: 100 }).periods, 0);
  const d = savingsDeposit({ target: 1050, start: 1000, ratePct: 12, periods: 12 });
  assert.equal(d.deposit, 0);
  assert.ok(d.startEnough);
});

test('periods between dates', () => {
  assert.equal(periodsUntil('2026-10-15', '2027-10-15', 12), 12);
  assert.equal(periodsUntil('2026-10-15', '2027-10-14', 12), 11);
  assert.equal(periodsUntil('2026-01-31', '2026-02-28', 12), 0);
  assert.equal(periodsUntil('2026-10-15', '2026-10-29', 52), 2);
  assert.equal(periodsUntil('2026-10-15', '2026-10-29', 26), 1);
  assert.equal(periodsUntil('2026-10-15', '2026-10-01', 12), 0);
});

test('describeMonths', () => {
  assert.equal(describeMonths(27), '2 years 3 months');
  assert.equal(describeMonths(12), '1 year');
  assert.equal(describeMonths(1), '1 month');
  assert.equal(describeMonths(0), '0 months');
});

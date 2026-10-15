import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rentalCashflow, isGrandfathered, loanYear, basicTax, totalTax, fyLabel } from '../js/rental.js';
import { incomeTax } from '../js/calc.js';

// $650 a week, 2 weeks vacant, $600,000 interest-only at 6.2%, $120,000 salary, bought after Budget night.
const base = {
  fyStart: 2027, weeklyRent: 650, vacancyWeeks: 2, price: 750000, loan: 600000, ratePct: 6.2, loanType: 'io',
  councilRates: 2200, insurance: 1800, pmPct: 7, maintenance: 1500, income: 120000, acquired: '2026-09-01',
};
const near = (a, b, msg) => assert.ok(Math.abs(a - b) < 0.01, `${msg ?? ''} ${a} ≠ ${b}`);

test('tax rates: 2026-27 reuses calc.js (15%), 2027-28 on uses 14%', () => {
  assert.equal(basicTax(90000, 2026), incomeTax(90000));
  assert.equal(basicTax(45000, 2026), 4020);
  near(basicTax(45000, 2027), 3752);
  // $120,000: 26,800 × 14% + 75,000 × 30% = 26,252, plus 2% Medicare 2,400
  near(totalTax(120000, 2027), 28652);
  assert.equal(fyLabel(2027), '2027-28');
});

test('cashflow by hand: interest-only', () => {
  const r = rentalCashflow(base);
  assert.equal(r.rent, 32500); // 650 × 50
  near(r.management, 2275);
  near(r.interest, 37200);
  assert.equal(r.principal, 0);
  near(r.preTax, -12475); // 32,500 − 37,200 − 2,200 − 1,800 − 2,275 − 1,500
  near(r.net, -12475);
  near(r.grossYield, 650 * 52 / 750000 * 100);
});

test('2027-28, bought after Budget night: loss is quarantined and carried forward', () => {
  const r = rentalCashflow(base);
  assert.equal(r.limited, true);
  assert.equal(r.taxEffect, 0);
  near(r.carriedOut, 12475);
  near(r.afterTax, -12475);
  // Without the limit the loss saves tax at 30% + 2%: 28,652 − tax on 107,525 (24,660) = 3,992
  near(r.full.taxEffect, -3992);
  near(r.full.afterTax, -8483);
});

test('2026-27: no limit yet, even for a post-Budget purchase', () => {
  const r = rentalCashflow({ ...base, fyStart: 2026 });
  assert.equal(r.limited, false);
  assert.ok(r.taxEffect < 0);
  // 2026-27 rates: 120,000 → 4,020 + 22,500 = 26,520 + 2,400; 107,525 → 4,020 + 18,757.5 + 2,150.5
  near(r.taxEffect, (4020 + 18757.5 + 2150.5) - (26520 + 2400));
});

test('grandfathering edge: 7.30 pm AEST on 12 May 2026, contract date counts', () => {
  assert.equal(isGrandfathered('2026-05-11'), true);
  assert.equal(isGrandfathered('2026-05-12', true), true);
  assert.equal(isGrandfathered('2026-05-12', false), false);
  assert.equal(isGrandfathered('2026-05-13', true), false); // the time box only matters on the day
  assert.equal(isGrandfathered(''), false);
  const r = rentalCashflow({ ...base, acquired: '2026-05-12', beforeBudgetTime: true });
  assert.equal(r.grandfathered, true);
  assert.equal(r.limited, false);
  near(r.taxEffect, -3992);
  assert.equal(rentalCashflow({ ...base, acquired: '2026-05-12' }).limited, true);
});

test('new build keeps negative gearing', () => {
  const r = rentalCashflow({ ...base, newBuild: true, depreciation: 8000 });
  assert.equal(r.limited, false);
  near(r.net, -20475);
  // 28,652 − tax on 99,525 (3,752 + 16,357.5 + 1,990.5 = 22,100) = 6,552 back
  near(r.taxEffect, -6552);
  near(r.afterTax, -12475 + 6552);
});

test('principal and interest: principal is cash out but not deductible', () => {
  const l = loanYear({ loan: 600000, ratePct: 6.2, type: 'pi', termYears: 30 });
  // Monthly repayment on $600,000 at 6.2% over 30 years is $3,674.82.
  near(l.repayments / 12, 3674.82, 'monthly');
  assert.ok(l.interest < 37200 && l.interest > 36800);
  near(l.interest + l.principal, l.repayments);
  const io = rentalCashflow(base), pi = rentalCashflow({ ...base, loanType: 'pi' });
  near(pi.preTax, io.preTax - (l.repayments - 37200));
  near(pi.net, 32500 - l.interest - 7775);
  assert.ok(pi.preTax < io.preTax && pi.net > io.net);
});

test('carried-forward losses absorb later rental profit, but never salary', () => {
  // Henrietta example in s26-155(1): $72,000 income, $20,000 deductions, $33,000 carried in → all used.
  const h = rentalCashflow({ fyStart: 2030, weeklyRent: 72000 / 52, loan: 0, otherCosts: 20000, income: 0, acquired: '2028-07-01', carriedForward: 33000 });
  near(h.carriedUsed, 33000);
  near(h.carriedOut, 0);
  near(h.taxableRental, 19000);
  // 2029-30 in the example: $52,000 income, $70,000 deductions, $15,000 carried in → $33,000 carried out.
  const y2 = rentalCashflow({ fyStart: 2029, weeklyRent: 1000, loan: 0, otherCosts: 70000, income: 0, acquired: '2028-07-01', carriedForward: 15000 });
  near(y2.carriedOut, 33000);
  near(y2.taxableRental, 0);
});

test('positively geared property is taxed normally under either rule', () => {
  const r = rentalCashflow({ ...base, loan: 200000 });
  assert.ok(r.net > 0);
  near(r.taxEffect, r.full.taxEffect);
});

test('rejects impossible vacancy', () => {
  assert.equal(rentalCashflow({ ...base, vacancyWeeks: 53 }), null);
});

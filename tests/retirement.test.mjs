import { test } from 'node:test';
import assert from 'node:assert/strict';
import { project, drawdown, incomeToAge, retirementAgeUsed, retirementPlan, ASFA, ASIC_DEFLATORS, DRAWDOWN_END_AGE, PENSION_AGE, PRESERVATION_AGE, CONCESSIONAL_CAP, SUPER_GUARANTEE, RETIREMENT_CHECKED } from '../js/retirement.js';

const near = (a, b, tol = 0.01, msg = '') => assert.ok(Math.abs(a - b) < tol, `${msg} expected ${b}, got ${a}`);

test('official constants', () => {
  assert.equal(PENSION_AGE, 67);
  assert.equal(PRESERVATION_AGE, 60);
  assert.equal(SUPER_GUARANTEE, 0.12);
  assert.equal(CONCESSIONAL_CAP, 32500);
  assert.equal(RETIREMENT_CHECKED, '15 Oct 2026');
  assert.deepEqual(ASFA.single, { comfortable: 56166, modest: 36548, modestRenting: 51418, lumpComfortable: 630000, lumpModest: 110000 });
  assert.equal(ASFA.couple.comfortable, 78998);
  assert.equal(ASFA.couple.lumpComfortable, 730000);
});

test('one year, no growth: $100,000 salary puts $10,200 in after 15% contributions tax', () => {
  const r = project({ age: 40, retireAge: 41, salary: 100000, returnPct: 0, earningsTaxPct: 0, wageGrowthPct: 0, inflationPct: 0 });
  assert.equal(r.rows.length, 1);
  near(r.rows[0].sg, 12000);
  near(r.contributionsTax, 1800);
  near(r.balance, 10200);
});

test('mid-year contributions earn half a year: $100,000 at 10% with no tax or fees', () => {
  const r = project({ age: 40, retireAge: 41, balance: 100000, salary: 100000, returnPct: 10, earningsTaxPct: 0, wageGrowthPct: 0, inflationPct: 0 });
  near(r.balance, 100000 + 10200 + (100000 + 5100) * 0.1);
});

test('earnings tax and fees come off earnings', () => {
  const r = project({ age: 40, retireAge: 41, balance: 100000, returnPct: 10, earningsTaxPct: 7, feePct: 1, feeDollar: 100, wageGrowthPct: 0, inflationPct: 0 });
  near(r.balance, 100000 + 10000 * 0.93 - 1000 - 100);
  near(r.fees, 1100);
});

test('salary sacrifice is cut back to the $32,500 concessional cap', () => {
  const r = project({ age: 40, retireAge: 41, salary: 200000, sacrifice: 20000, returnPct: 0, earningsTaxPct: 0, wageGrowthPct: 0, inflationPct: 0 });
  near(r.rows[0].sg, 24000);
  near(r.rows[0].sacrifice, 8500);
  near(r.sacrificeCut, 11500);
  assert.equal(r.cappedYears, 1);
  near(r.balance, 32500 * 0.85);
});

test('super guarantee stops at the maximum contribution base', () => {
  const r = project({ age: 40, retireAge: 41, salary: 400000, returnPct: 0, earningsTaxPct: 0, wageGrowthPct: 0, inflationPct: 0 });
  near(r.rows[0].sg, 32499.6);
});

test('ASIC defaults: 3.7% wage inflation while working, 2.5% CPI in retirement, 67 to 92', () => {
  // ASIC (Superannuation Calculators and Retirement Estimates) Instrument 2022/603, RG 276.141-143 and 276.188.
  assert.deepEqual(ASIC_DEFLATORS, { accumulation: 3.7, retirement: 2.5 });
  assert.equal(DRAWDOWN_END_AGE, 92);
});

test("today's dollars: deflated by 3.7% wage inflation by default, and contributions + earnings add up to the balance", () => {
  const r = project({ age: 30, retireAge: 67, balance: 50000, salary: 90000, feePct: 0.11, feeDollar: 59 });
  assert.equal(r.rows.length, 37);
  assert.equal(r.rows.at(-1).age, 67);
  near(r.balanceReal, r.balance / 1.037 ** 37, 0.01);
  for (const row of r.rows) near(row.paidInReal + row.earningsReal, row.balanceReal, 1e-6);
  assert.ok(r.balanceReal > 600000 && r.balanceReal < 700000, `got ${r.balanceReal}`);
  // The user can change the rate: at 2.5% the same balance is worth more.
  const cpi = project({ age: 30, retireAge: 67, balance: 50000, salary: 90000, feePct: 0.11, feeDollar: 59, deflatorPct: 2.5 });
  near(cpi.balance, r.balance, 1e-6);
  near(cpi.balanceReal, r.balance / 1.025 ** 37, 0.01);
});

test('income to 92: a constant real income that uses up the balance exactly', () => {
  // Zero real return: $500,000 over 25 years is $20,000 a year.
  near(incomeToAge({ balance: 500000, startAge: 67, returnPct: 2.5, inflationPct: 2.5 }).income, 20000, 1e-4);
  // With a real return, drawing that income for 25 years leaves nothing.
  const s = incomeToAge({ balance: 600000, startAge: 67, returnPct: 6.5, feePct: 0.11, inflationPct: 2.5 });
  assert.equal(s.years, 25);
  const d = drawdown({ balance: 600000, income: s.income, startAge: 67, returnPct: 6.5, feePct: 0.11, inflationPct: 2.5 });
  near(d.years, 25, 1e-6);
  // At least five years, even for someone retiring at 90.
  assert.equal(incomeToAge({ balance: 100000, startAge: 90 }).years, 5);
  assert.equal(incomeToAge({ balance: 0 }).income, 0);
});

test('retirement age used: preservation age floor and next birthday at 67 or older (RG 276.141, 276.148)', () => {
  assert.deepEqual(retirementAgeUsed(35, 67), { age: 67, reason: '' });
  assert.deepEqual(retirementAgeUsed(35, 55), { age: 60, reason: 'preservation' });
  assert.deepEqual(retirementAgeUsed(70, 67), { age: 71, reason: 'next-birthday' });
  assert.equal(retirementAgeUsed(50, 45), null);
});

test('retirement plan: the dollar fee follows the money from wage- to price-deflated dollars', () => {
  const v = { age: 35, retireAge: 67, balance: 80000, salary: 90000, feeDollar: 59, income: 50000 };
  const p = retirementPlan(v);
  const fee = 59 * (1.025 / 1.037) ** 32;
  near(p.draw.years, drawdown({ balance: p.balanceReal, income: 50000, feeDollar: fee }).years, 1e-9);
  near(p.stream.income, incomeToAge({ balance: p.balanceReal, feeDollar: fee }).income, 1e-6);
});

test('no years when already at retirement age', () => {
  const r = project({ age: 67, retireAge: 67, balance: 300000, salary: 0 });
  assert.equal(r.rows.length, 0);
  assert.equal(r.balanceReal, 300000);
});

test('drawdown at zero real return lasts balance ÷ income years', () => {
  const d = drawdown({ balance: 500000, income: 50000, returnPct: 2.5, inflationPct: 2.5 });
  near(d.years, 10, 1e-9);
  assert.equal(d.runsOutAge, 77);
  assert.equal(d.lastsForever, false);
});

test('drawdown lasts forever when real earnings cover the income', () => {
  const d = drawdown({ balance: 1000000, income: 20000, returnPct: 6.5, inflationPct: 2.5 });
  assert.equal(d.lastsForever, true);
});

test('drawdown with partial last year and zero income', () => {
  const d = drawdown({ balance: 125000, income: 50000, returnPct: 0, inflationPct: 0 });
  near(d.years, 2.5, 1e-9);
  assert.equal(drawdown({ balance: 1, income: 0 }).lastsForever, true);
});

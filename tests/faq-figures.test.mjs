// Every worked figure in a tool page's explainer and FAQ (written by scripts/content.py) is recomputed here
// from the engine, so a rate change that moves a result fails the tests until the text is updated too.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { takeHome, mortgage, mortgageSchedule, offsetSavings, SUPER_MAX_BASE, SUPER_GUARANTEE, HELP } from '../js/calc.js';
import { grossUp } from '../js/grossup.js';
import { taxRefund } from '../js/refund.js';
import { medicareLevySurcharge, SPOUSE_EXEMPT } from '../js/mls.js';
import { capitalGainsTax } from '../js/cgt.js';
import { salarySacrifice, CONCESSIONAL_CAP } from '../js/super.js';
import { project, drawdown } from '../js/retirement.js';
import { workDeductions, YEARS as WD_YEARS } from '../js/deductions.js';
import { rentalCashflow } from '../js/rental.js';
import { borrowingPower } from '../js/borrowing.js';
import { lmi } from '../js/lmi.js';
import { upfrontCosts } from '../js/upfront.js';

const money = (n) => n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 });
const cents = (n) => n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const page = (slug) => readFileSync(`tools/${slug}.html`, 'utf8').match(/<!-- content:start -->[\s\S]*?<!-- content:end -->/)[0];
const has = (slug, ...figures) => {
  const html = page(slug);
  for (const f of figures) assert.ok(html.includes(f), `tools/${slug}.html should say ${f} (recomputed from the engine); update scripts/content.py`);
};

test('take-home pay: FAQ and table figures', () => {
  const a = takeHome(100000);
  has('take-home-pay', money(a.tax + a.medicare), money(a.tax), money(a.medicare), money(a.net), money(a.net / 52), money(a.super));
  const b = takeHome(80000);
  has('take-home-pay', money(b.net), cents(b.net / 52), cents(b.net / 26), money(b.tax), money(b.medicare));
  for (const s of [50000, 70000, 90000, 120000, 150000]) {
    const r = takeHome(s);
    has('take-home-pay', money(r.tax), money(r.medicare), money(r.net));
  }
  // The standard deduction at the 30% rate plus Medicare.
  has('take-home-pay', money(takeHome(90000).net - takeHome(90000, { standardDeduction: false }).net), money(SUPER_MAX_BASE));
  has('take-home-pay', money(HELP.threshold), money(HELP.band2), money(HELP.top));
});

test('tax refund: FAQ figures', () => {
  const y25 = taxRefund({ year: '2025-26', salary: 85000 });
  const y26 = taxRefund({ year: '2026-27', salary: 85000 });
  has('tax-refund', money(y25.incomeTax + y25.medicare), money(y25.incomeTax), money(y25.medicare));
  has('tax-refund', money(y26.incomeTax + y26.medicare), money(y26.incomeTax), money(y26.medicare), money(y25.liability - y26.liability));
  has('tax-refund', money(taxRefund({ year: '2026-27', salary: 85000, otherDeductions: -1000 }).liability - y26.liability));
  has('tax-refund', money(taxRefund({ year: '2025-26', salary: 110000, privateCover: false }).mls.amount));
  has('tax-refund', money(taxRefund({ year: '2026-27', salary: 110000, privateCover: false }).mls.amount));
  has('tax-refund', money(taxRefund({ year: '2025-26', salary: 85000, help: true }).help));
  has('tax-refund', cents(taxRefund({ year: '2026-27', salary: 85000, help: true }).help));
  const low = taxRefund({ year: '2025-26', salary: 30000, withheld: 1500 });
  has('tax-refund', money(low.gross), money(low.incomeTax), cents(low.medicare), cents(low.refund));
});

test('HECS/HELP: repayment thresholds in the FAQ and table', () => {
  has('hecs-help', money(HELP.threshold), money(HELP.band2), money(HELP.top), money(HELP.band2Base));
});

test('Medicare levy surcharge: FAQ figures', () => {
  has('medicare-levy-surcharge', money(medicareLevySurcharge({ own: { taxable: 130000 } }).surcharge), money(SPOUSE_EXEMPT));
});

test('capital gains tax: $100,000 profit FAQ', () => {
  const before = capitalGainsTax({ asset: 'shares', price: 100000, proceeds: 200000, bought: '2025-03-01', sold: '2027-03-01', income: 90000 });
  const after = capitalGainsTax({ asset: 'shares', price: 100000, proceeds: 200000, bought: '2027-07-01', sold: '2029-07-01', income: 90000 });
  has('capital-gains-tax', money(before.total), money(before.netGain), money(after.total), money(after.netGain), `factor ${after.factor}`);
  assert.equal(after.minTax, 0); // "the 30% minimum tax adds nothing at this income"
});

test('super: salary sacrifice example and caps', () => {
  const r = salarySacrifice({ salary: 100000, sacrifice: 10000 });
  has('super', money(r.incomeTaxSaved), money(r.extraContribTax), money(-r.takeHomeChange), money(r.superAdded), money(CONCESSIONAL_CAP), money(SUPER_MAX_BASE), cents(SUPER_MAX_BASE * SUPER_GUARANTEE));
});

test('retirement: defaults (age 35 to 67, $80,000 balance, $90,000 salary)', () => {
  const v = { age: 35, retireAge: 67, balance: 80000, salary: 90000, sgRate: 0.12, returnPct: 6.5, earningsTaxPct: 7, feePct: 0.11, feeDollar: 59, wageGrowthPct: 3.7, inflationPct: 2.5 };
  const p = project(v);
  const draw = (balance) => drawdown({ balance, income: 56166, startAge: 67, returnPct: 6.5, feePct: 0.11, feeDollar: 59, inflationPct: 2.5 });
  has('retirement', money(p.balanceReal), money(p.balance), `about ${Math.floor(draw(p.balanceReal).years)} years`, `about ${Math.floor(draw(630000).years)} years`);
  has('retirement', money(project({ ...v, sacrifice: 5000 }).balanceReal - p.balanceReal), money(p.balanceReal - project({ ...v, feePct: 0.61 }).balanceReal));
});

test('gross-up: FAQ figures', () => {
  has('gross-up', money(grossUp(52000).gross), money(grossUp(52000, { help: true }).gross));
  has('gross-up', money(grossUp(100000).gross), money(grossUp(100000, { help: true }).gross));
  has('gross-up', money(grossUp(80000).gross), money(grossUp(80000, { help: true }).gross), money(grossUp(80000, { includesSuper: true }).gross));
  const at90 = takeHome(90000).net;
  has('gross-up', money(grossUp(at90 + 1000).gross - grossUp(at90).gross));
});

test('work deductions: rates and the standard deduction', () => {
  has('work-deductions', `${Math.round(WD_YEARS['2025-26'].wfhRate * 100)} cents for each hour`, `${Math.round(WD_YEARS['2026-27'].carRate * 100)} cents per kilometre`, money(WD_YEARS['2026-27'].standard));
  // Below the standard deduction, itemising adds nothing: 1,000 hours at 70c is $700.
  const r = workDeductions({ year: '2026-27', wfhHours: 1000, taxableIncome: 90000 });
  assert.ok(r.extra < 0);
});

test('rental cashflow: FAQ figures', () => {
  const base = { weeklyRent: 650, vacancyWeeks: 2, price: 750000, loan: 600000, ratePct: 6.2, loanType: 'io', termYears: 30, councilRates: 2200, insurance: 1800, pmPct: 7, maintenance: 1500, income: 120000 };
  const old = rentalCashflow({ fyStart: 2027, acquired: '2026-01-01', ...base });
  const caught = rentalCashflow({ fyStart: 2027, acquired: '2026-09-01', ...base });
  const thisYear = rentalCashflow({ fyStart: 2026, acquired: '2026-09-01', ...base });
  const pi = rentalCashflow({ fyStart: 2027, acquired: '2026-09-01', ...base, loanType: 'pi' });
  const nb = rentalCashflow({ fyStart: 2027, acquired: '2026-09-01', ...base, newBuild: true, depreciation: 8000 });
  has('rental-cashflow', money(-old.net), money(-old.taxEffect), money(-old.afterTaxWeekly), money(-caught.afterTaxWeekly), money(-thisYear.taxEffect));
  assert.equal(caught.taxEffect, 0);
  has('rental-cashflow', money(pi.interest), money(pi.principal), money(caught.afterTaxWeekly - pi.afterTaxWeekly), money(-pi.net));
  has('rental-cashflow', money(-nb.net), money(-nb.taxEffect), money(-nb.afterTaxWeekly));
});

test('mortgage: FAQ and repayment table figures', () => {
  const m = (ratePct, frequency = 'monthly', principal = 600000) => mortgage({ principal, ratePct, years: 30, frequency });
  has('mortgage', money(m(6).repayment), cents(m(6, 'fortnightly').repayment), cents(m(6, 'weekly').repayment), money(m(5.5).repayment), money(m(6.5).repayment));
  has('mortgage', money(m(6).interest), money(m(6).total), money(m(5.5).interest), money(m(6.5).interest));
  const y1 = mortgageSchedule({ principal: 600000, ratePct: 6, years: 30 })[0];
  has('mortgage', money(y1.interest), money(y1.interest + y1.principal));
  const off = offsetSavings({ principal: 600000, ratePct: 6, years: 30, offset: 50000 });
  has('mortgage', money(off.interestSaved), `${Math.floor(off.periodsSaved / 12)} years ${off.periodsSaved % 12} months`);
  for (const p of [400000, 500000, 750000, 1000000]) for (const r of [5.5, 6, 6.5]) has('mortgage', money(m(r, 'monthly', p).repayment));
});

test('borrowing power: FAQ figures', () => {
  const bp = (o) => borrowingPower({ applicants: [{ income: 100000 }], expenses: 2500, ratePct: 6, years: 30, ...o });
  // The FAQ gives loan sizes in whole thousands, rounded down ("about $491,000").
  const thousands = (n) => money(Math.floor(n / 1000) * 1000);
  const b = bp({});
  has('borrowing-power', thousands(b.maxLoan), money(b.repayment), `${b.dti.toFixed(1)} times income`);
  const card = bp({ cardLimits: 10000 });
  has('borrowing-power', money(card.cardCommitment), thousands(card.maxLoan), thousands(b.maxLoan - card.maxLoan));
  has('borrowing-power', thousands(bp({ buffer: 0 }).maxLoan), thousands(bp({ otherIncome: 20000 }).maxLoan));
  const couple = borrowingPower({ applicants: [{ income: 100000 }, { income: 80000 }], expenses: 4000, ratePct: 6, years: 30 });
  has('borrowing-power', thousands(couple.maxLoan), money(couple.repayment), `ratio of ${couple.dti.toFixed(1)}`);
});

test('LMI: $600,000 home FAQ figures', () => {
  for (const state of ['NSW', 'VIC']) for (const dep of [0.1, 0.05, 0.15]) has('lmi', money(lmi({ state, value: 600000, loan: 600000 * (1 - dep) }).total));
});

test('upfront costs: FAQ figures', () => {
  const nsw = upfrontCosts({ state: 'NSW', price: 750000, deposit: 75000 });
  has('upfront-costs', money(nsw.cash), money(nsw.costs), money(nsw.duty.duty), money(nsw.rego.transfer + nsw.rego.mortgage), money(nsw.lmiCost));
  has('upfront-costs', money(upfrontCosts({ state: 'NSW', price: 750000, deposit: 37500, firstHome: true, scheme: true }).cash));
  const qld = upfrontCosts({ state: 'QLD', price: 650000, deposit: 65000 });
  has('upfront-costs', money(qld.costs), cents(qld.rego.mortgage), money(qld.rego.transfer));
});

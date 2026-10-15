// Every worked figure in a tool page's explainer and FAQ (written by scripts/content.py) is recomputed here
// from the engine, so a rate change that moves a result fails the tests until the text is updated too.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { takeHome, mortgage, mortgageSchedule, offsetSavings, extraRepayments, interestOnlyRepayment, compoundInterest, rentalYield, gst, SUPER_MAX_BASE, SUPER_GUARANTEE, HELP } from '../js/calc.js';
import { stampDuty, STATES } from '../js/duty.js';
import { grossUp } from '../js/grossup.js';
import { taxRefund } from '../js/refund.js';
import { medicareLevySurcharge, SPOUSE_EXEMPT } from '../js/mls.js';
import { capitalGainsTax } from '../js/cgt.js';
import { salarySacrifice, CONCESSIONAL_CAP } from '../js/super.js';
import { project, drawdown, retirementPlan } from '../js/retirement.js';
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

test('retirement: defaults (age 35 to 67, $80,000 balance, $90,000 salary, ASIC deflators)', () => {
  const v = { age: 35, retireAge: 67, balance: 80000, salary: 90000, sgRate: 0.12, returnPct: 6.5, earningsTaxPct: 7, feePct: 0.11, feeDollar: 59, wageGrowthPct: 3.7, deflatorPct: 3.7, inflationPct: 2.5 };
  const p = retirementPlan({ ...v, income: 56166 });
  const draw = (balance) => drawdown({ balance, income: 56166, startAge: 67, returnPct: 6.5, feePct: 0.11, feeDollar: 59, inflationPct: 2.5 });
  has('retirement', money(p.balanceReal), money(p.balance), `about ${Math.floor(p.draw.years)} years, to age ${Math.floor(p.draw.runsOutAge)}`, `about ${Math.floor(draw(630000).years)} years`, `about ${money(p.stream.income)} a year`);
  has('retirement', money(project({ ...v, deflatorPct: 2.5 }).balanceReal));
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

test('mortgage: total interest table, extra repayments and interest-only', () => {
  const m = (principal, ratePct, years = 30) => mortgage({ principal, ratePct, years });
  for (const p of [500000, 600000, 750000]) for (const r of [5.5, 6, 6.5]) has('mortgage', money(m(p, r).interest));
  has('mortgage', money(m(600000, 6).repayment - m(600000, 5.5).repayment), money(m(600000, 6).interest - m(600000, 5.5).interest));
  const yrs = (x) => `${Math.floor(x.periodsSaved / 12)} years ${x.periodsSaved % 12} month`;
  for (const extra of [100, 200, 500]) {
    const x = extraRepayments({ principal: 600000, ratePct: 6, years: 30, extra });
    has('mortgage', money(x.interestSaved), yrs(x));
  }
  const io = interestOnlyRepayment(600000, 6);
  const rest = m(600000, 6, 25);
  const ioInterest = io * 60 + rest.interest;
  has('mortgage', money(io), money(rest.repayment), money(ioInterest), money(ioInterest - m(600000, 6).interest));
});

test('offset: FAQ figures', () => {
  const o = (principal, offset) => offsetSavings({ principal, ratePct: 6, years: 30, offset });
  const yrs = (x) => `${Math.floor(x.periodsSaved / 12)} year${Math.floor(x.periodsSaved / 12) === 1 ? '' : 's'} ${x.periodsSaved % 12} month`;
  for (const [p, off] of [[600000, 50000], [600000, 100000], [600000, 20000], [500000, 50000]]) has('offset', money(o(p, off).interestSaved), yrs(o(p, off)));
  has('offset', money(o(600000, 0).repayment), money(o(500000, 0).repayment));
});

test('rental yield: worked examples', () => {
  const a = rentalYield({ price: 550000, weeklyRent: 520, annualCosts: 7500, vacancyWeeks: 2 });
  const b = rentalYield({ price: 750000, weeklyRent: 650, annualCosts: 9000, vacancyWeeks: 2 });
  has('rental-yield', `${a.gross.toFixed(2)}%`, `${a.net.toFixed(2)}%`, money(a.netIncome), money(a.annualRent), money(520 * 52));
  has('rental-yield', `${b.gross.toFixed(2)}%`, `${b.net.toFixed(2)}%`, money(b.netIncome));
});

test('compound interest: worked example and frequencies', () => {
  const ci = (o) => compoundInterest({ principal: 10000, ratePct: 5, years: 10, ...o });
  has('compound-interest', money(ci({}).balance), money(ci({}).interest), money(ci({ compoundsPerYear: 1 }).balance), money(ci({ compoundsPerYear: 365 }).balance));
  const w = ci({ contribution: 200 });
  has('compound-interest', money(w.balance), money(w.contributed), money(w.interest));
  for (const years of [20, 30]) {
    const l = compoundInterest({ principal: 0, ratePct: 5, years, contribution: 200 });
    has('compound-interest', money(l.balance), money(l.contributed));
  }
  has('compound-interest', money(compoundInterest({ principal: 0, ratePct: 5, years: 30, contribution: 200 }).interest));
});

test('GST: FAQ and table figures', () => {
  const r = gst(100, 'remove');
  has('gst', cents(r.gst), cents(r.exclusive), money(gst(1000).inclusive), cents(gst(1000, 'remove').gst), cents(gst(1000, 'remove').exclusive));
  for (const v of [50, 99, 1000, 5500]) has('gst', cents(gst(v).gst), cents(gst(v).inclusive), cents(gst(v, 'remove').gst), cents(gst(v, 'remove').exclusive));
});

const duty = (state, value, o = {}) => stampDuty({ state, value, home: false, ...o });
test('stamp duty hub: $750,000 in each state table, each state linked to its page', () => {
  const html = page('stamp-duty');
  for (const s of STATES) {
    const c = s.code;
    const cells = [duty(c, 750000), duty(c, 750000, { home: true }), duty(c, 750000, { home: true, firstHome: true }), duty(c, 750000, { home: true, firstHome: true, newHome: true })].map((r) => `<td>${money(r.duty)}</td>`).join('');
    const row = new RegExp(`<tr><td><a href="stamp-duty-${c.toLowerCase()}\\.html">[^<]+</a></td>${cells.replace(/\$/g, '\\$')}</tr>`);
    assert.match(html, row, `${c} row of the $750,000 table should be ${cells}`);
  }
});

test('SA, TAS, ACT and NT stamp duty pages: worked examples and FAQ figures', () => {
  const pages = {
    SA: [duty('SA', 600000).duty, duty('SA', 600000, { foreign: true }).total, duty('SA', 600000, { foreign: true }).surcharge, duty('SA', 500000).duty, duty('SA', 750000).duty],
    TAS: [duty('TAS', 800000).duty, duty('TAS', 800000, { foreign: true }).total, duty('TAS', 800000, { foreign: true }).surcharge, duty('TAS', 600000).duty, duty('TAS', 600000, { home: true, firstHome: true }).duty, duty('TAS', 600000, { foreign: true }).total, duty('TAS', 600000, { foreign: true }).surcharge, duty('TAS', 500000).duty],
    ACT: [duty('ACT', 750000, { home: true }).duty, duty('ACT', 750000).duty, duty('ACT', 750000, { foreign: true }).total, duty('ACT', 600000, { home: true }).duty, duty('ACT', 600000).duty, duty('ACT', 600000).duty - duty('ACT', 600000, { home: true }).duty, duty('ACT', 1000000, { home: true }).duty, duty('ACT', 1000000).duty],
    NT: [duty('NT', 500000).duty, duty('NT', 750000).duty, duty('NT', 750000, { foreign: true }).total],
  };
  for (const [code, figures] of Object.entries(pages)) {
    const slug = `stamp-duty-${code.toLowerCase()}`;
    assert.match(readFileSync(`tools/${slug}.html`, 'utf8'), new RegExp(`<form class="card" id="form" data-state="${code}">`));
    has(slug, ...figures.map(money));
  }
  // Concessions the pages describe as $0.
  assert.equal(duty('SA', 600000, { home: true, firstHome: true, newHome: true }).duty, 0);
  assert.equal(duty('SA', 600000, { home: true, firstHome: true }).duty, duty('SA', 600000).duty);
  assert.equal(duty('ACT', 750000, { home: true, firstHome: true }).duty, 0);
  assert.equal(duty('NT', 500000, { home: true, newHome: true }).duty, 0);
  assert.equal(duty('NT', 500000, { home: true, firstHome: true }).duty, duty('NT', 500000).duty);
  // Rate table base amounts are the duty at each threshold.
  for (const [code, slug, values] of [['SA', 'stamp-duty-sa', [30000, 50000, 100000, 200000, 250000, 300000, 500000]], ['TAS', 'stamp-duty-tas', [25000, 75000, 200000, 375000, 725000]]]) {
    has(slug, ...values.map((v) => money(duty(code, v).duty)));
  }
  has('stamp-duty-act', ...[260000, 300000, 500000, 750000, 1000000].map((v) => money(duty('ACT', v, { home: true }).duty)), ...[200000, 300000, 500000, 750000, 1000000].map((v) => money(duty('ACT', v).duty)));
});

test('about page: the 2026-27 changes match the rates the calculators use', async () => {
  const { YEARS } = await import('../js/rates.js');
  const html = readFileSync('about.html', 'utf8');
  const [now, last] = [YEARS['2026-27'], YEARS['2025-26']];
  const says = (...xs) => { for (const x of xs) assert.ok(html.includes(x), `about.html should say ${x}`); };
  says(`from ${Math.round(last.brackets[1][1] * 100)}% to ${Math.round(now.brackets[1][1] * 100)}%`, money(now.brackets[0][0] + 1), money(now.brackets[1][0]));
  says(money(now.standard), `from ${money(last.help.threshold)} to ${money(now.help.threshold)}`, money(now.mls.single[0]), money(last.mls.single[0]), money(now.mls.family[0]));
  says(money(now.super.concessionalCap), money(now.super.maxBase));
  assert.equal(stampDuty({ state: 'ACT', value: 2000000, home: true, firstHome: true }).duty, 0);
  assert.equal(stampDuty({ state: 'WA', value: 600000, home: true, firstHome: true }).duty, 0);
});

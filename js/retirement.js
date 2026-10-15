// Super projection to retirement and how long it lasts, for an employee. Pure functions, no DOM.
// Super guarantee rate and maximum contribution base come from calc.js; the concessional cap and the 15%
// contributions tax from super.js, so every super page uses the same figures.
import { SUPER_GUARANTEE, SUPER_MAX_BASE } from './calc.js';
import { CONCESSIONAL_CAP, CONTRIBUTIONS_TAX } from './super.js';

export const RETIREMENT_CHECKED = '15 Oct 2026';
export { SUPER_GUARANTEE, SUPER_MAX_BASE, CONCESSIONAL_CAP, CONTRIBUTIONS_TAX };

// Age Pension age is 67. Services Australia "Age Pension", page last updated 21 Nov 2025 (verified 15 Oct 2026):
// https://www.servicesaustralia.gov.au/age-pension
export const PENSION_AGE = 67;
export const PENSION_URL = 'https://www.servicesaustralia.gov.au/age-pension';
// Preservation age is 60 for anyone born after 30 June 1964 (55 to 59 for earlier birth dates, all of whom are now
// over 60). Super can be taken once you reach it and retire, or at 65 even if still working.
// ATO "Conditions of release", last updated 13 Oct 2025 (verified 15 Oct 2026):
// https://www.ato.gov.au/tax-and-super-professionals/for-superannuation-professionals/apra-regulated-funds/paying-benefits/releasing-benefits/conditions-of-release
export const PRESERVATION_AGE = 60;
export const PRESERVATION_URL = 'https://www.ato.gov.au/tax-and-super-professionals/for-superannuation-professionals/apra-regulated-funds/paying-benefits/releasing-benefits/conditions-of-release';

// Moneysmart Superannuation calculator default assumptions, page last updated 2 July 2026 (verified 15 Oct 2026):
// https://moneysmart.gov.au/how-super-works/superannuation-calculator
//   CPI inflation 2.5% a year, plus a further 1.2% a year for rising living standards (so wages grow 3.7%);
//   administration fees $59 a year plus 0.11% of the balance; Balanced option return 6.1% a year after
//   investment fees and tax. Moneysmart deflates by both (3.7%), so its "today's dollars" figure is lower than
//   one deflated by CPI alone, as this calculator does by default.
export const MONEYSMART_URL = 'https://moneysmart.gov.au/how-super-works/superannuation-calculator';
export const MONEYSMART = { inflation: 2.5, livingStandards: 1.2, wageGrowth: 3.7, adminFeeDollar: 59, adminFeePct: 0.11, balancedNetReturn: 6.1 };
// Tax on fund earnings before retirement: an ESTIMATE. Super funds pay up to 15% on earnings, but franking
// credits and discounted capital gains bring the effective rate down. 7% is the figure Moneysmart's calculator
// used to default to (from the Retirement Income Review), as described by SuperGuide; it isn't published as an
// official current rate, so the page labels it an assumption.
export const EARNINGS_TAX_ASSUMED = 7;
// Default return before earnings tax, after investment fees. 6.5% × (1 − 7%) ≈ 6.05%, close to Moneysmart's
// Balanced 6.1% after tax (derived here, so an estimate).
export const DEFAULT_RETURN = 6.5;

// Today's dollars, as ASIC requires of super calculators. ASIC (Superannuation Calculators and Retirement Estimates)
// Instrument 2022/603 and Regulatory Guide 276 (RG 276.188, Table 4): "By default, future dollars must be converted
// to today's dollars using the inflation rates in ASIC Instrument 2022/603, which are 3.7% p.a. while the user is in
// the accumulation phase and 2.5% p.a. while the user is in the retirement phase (i.e. the drawdown period)."
// 3.7% (nominal wage inflation, 2023 Intergenerational Report) applies from 1 January 2025; 2.5% is the midpoint of
// the RBA's CPI target. The user can change both (RG 276.196). Sources, verified 15 Oct 2026:
//   https://download.asic.gov.au/media/tlbldlxj/rg276-published-13-september-2024-20260402.pdf
//   https://www.asic.gov.au/about-asic/news-centre/news-items/asic-updates-superannuation-forecasts-relief-instrument
// The instrument is scheduled to be repealed on 1 July 2027 (ASIC says it will review the relief settings before
// then): recheck these defaults, the 67 retirement age and the age-92 drawdown period against its replacement.
// Record keeping (RG 276.48-49): a provider must keep a functional copy of the calculator for seven years from when
// it was last available, able to reproduce each actual use. This site's git history keeps every version of this
// engine and the page, and every result is reproducible from the inputs (which Copy link saves in the address).
export const ASIC_URL = 'https://download.asic.gov.au/media/tlbldlxj/rg276-published-13-september-2024-20260402.pdf';
export const ASIC_DEFLATORS = { accumulation: 3.7, retirement: 2.5 };
// RG 276.141-143: default retirement age 67 (or the next birthday for anyone 67 or older); an annual income stream
// is by default drawn from retirement until age 92 (or five years, if later).
export const DRAWDOWN_END_AGE = 92;

// ASFA Retirement Standard, June quarter 2026, homeowners aged 65 to 84, as published by ASIC Moneysmart
// ("ASFA Retirement Standard" glossary, last updated 16 Sep 2026, verified 15 Oct 2026). Lump sums at 67 assume
// a part Age Pension and that the savings are drawn down to nothing.
export const ASFA_DATE = 'June quarter 2026';
export const ASFA_URL = 'https://moneysmart.gov.au/glossary/asfa-retirement-standard';
export const ASFA_SOURCE_URL = 'https://www.superannuation.asn.au/resources/retirement-standard';
export const ASFA = {
  single: { comfortable: 56166, modest: 36548, modestRenting: 51418, lumpComfortable: 630000, lumpModest: 110000 },
  couple: { comfortable: 78998, modest: 52690, modestRenting: 69376, lumpComfortable: 730000, lumpModest: 120000 },
};

// Year-by-year projection to retirement.
// age, retireAge: whole years. balance: super today. salary: yearly salary before super and salary sacrifice.
// sgRate: employer rate as a fraction (default 12%). sacrifice: extra concessional contributions a year in
// today's dollars, grown with wages and cut back so the total stays within the concessional cap.
// returnPct: yearly return after investment fees, before earnings tax. earningsTaxPct: effective tax on earnings.
// feePct and feeDollar: admin fees as % of balance and $ a year (today's dollars, indexed to CPI inflation).
// deflatorPct: the rate future dollars are divided by to show today's dollars while working (ASIC default 3.7% wage
// inflation). inflationPct: consumer price inflation (ASIC default 2.5%), used to index the dollar fee.
// Cap and maximum contribution base are indexed to wage growth each year (smoothly; in law they rise in steps).
// Contributions and fees are assumed to happen mid-year on average, as Moneysmart assumes.
export function project({ age, retireAge, balance = 0, salary = 0, sgRate = SUPER_GUARANTEE, sacrifice = 0, returnPct = DEFAULT_RETURN,
  earningsTaxPct = EARNINGS_TAX_ASSUMED, feePct = 0, feeDollar = 0, wageGrowthPct = MONEYSMART.wageGrowth, inflationPct = ASIC_DEFLATORS.retirement,
  deflatorPct = ASIC_DEFLATORS.accumulation }) {
  const g = wageGrowthPct / 100, inf = inflationPct / 100, defl = deflatorPct / 100, r = returnPct / 100, t = earningsTaxPct / 100, f = feePct / 100;
  const rows = [];
  let bal = Math.max(0, balance);
  let paidInReal = bal; // starting balance plus each year's net contributions, in today's dollars
  let totals = { contributions: 0, contributionsTax: 0, earnings: 0, earningsTax: 0, fees: 0, sacrificeCut: 0 };
  let cappedYears = 0;
  for (let y = 0; y < retireAge - age; y++) {
    const w = (1 + g) ** y;
    const pay = salary * w;
    const sg = Math.min(pay, SUPER_MAX_BASE * w) * sgRate;
    const room = Math.max(0, CONCESSIONAL_CAP * w - sg);
    const wanted = sacrifice * w;
    const sac = Math.min(wanted, room);
    if (wanted - sac > 0.005) { cappedYears++; totals.sacrificeCut += wanted - sac; }
    const gross = sg + sac;
    const tax = gross * CONTRIBUTIONS_TAX;
    const net = gross - tax;
    const base = bal + net / 2;
    const earn = base * r;
    const eTax = Math.max(0, earn) * t;
    const fees = Math.max(0, base) * f + feeDollar * (1 + inf) ** y;
    bal = Math.max(0, bal + net + earn - eTax - fees);
    const deflator = (1 + defl) ** (y + 1);
    paidInReal += net / deflator;
    totals = { ...totals, contributions: totals.contributions + net, contributionsTax: totals.contributionsTax + tax, earnings: totals.earnings + earn - eTax, earningsTax: totals.earningsTax + eTax, fees: totals.fees + fees };
    const real = bal / deflator;
    rows.push({ age: age + y + 1, salary: pay, sg, sacrifice: sac, contributionsTax: tax, earnings: earn - eTax, fees, balance: bal, balanceReal: real, paidInReal, earningsReal: real - paidInReal });
  }
  const last = rows[rows.length - 1];
  return {
    rows,
    balance: last ? last.balance : bal,
    balanceReal: last ? last.balanceReal : bal,
    paidInReal: last ? last.paidInReal : bal,
    earningsReal: last ? last.earningsReal : 0,
    ...totals,
    cappedYears,
  };
}

// How long a balance lasts drawing a set income, in today's dollars (deflated by CPI during retirement, as ASIC requires). Income is taken at the start of each year.
// In retirement we assume no tax on earnings (a retirement-phase account-based pension; an assumption, and it
// only holds up to the transfer balance cap). Fees continue. Returns years (fractional) and the age it runs out;
// lastsForever is true when it is still going at maxAge.
export function drawdown({ balance, income, startAge = PENSION_AGE, returnPct = DEFAULT_RETURN, feePct = 0, feeDollar = 0, inflationPct = ASIC_DEFLATORS.retirement, maxAge = 110 }) {
  const real = (1 + (returnPct - feePct) / 100) / (1 + inflationPct / 100) - 1;
  let bal = Math.max(0, balance);
  let years = 0;
  if (!(income > 0)) return { years: Infinity, runsOutAge: Infinity, lastsForever: true, realReturn: real * 100 };
  while (years < maxAge - startAge) {
    if (bal < income) { years += bal / income; bal = 0; break; }
    bal -= income;
    bal = Math.max(0, bal * (1 + real) - feeDollar);
    years++;
    if (bal <= 0) break;
  }
  const lastsForever = bal > 0;
  return { years, runsOutAge: startAge + years, lastsForever, realReturn: real * 100, left: bal };
}

// The constant income (today's dollars, before any Age Pension) that draws a balance down to nothing by endAge,
// taken at the start of each year: the "annual income stream" of RG 276.151-157, by default from retirement to 92
// (at least five years). Same return, fee and inflation assumptions as drawdown(); found by bisection.
export function incomeToAge({ balance, startAge = PENSION_AGE, endAge = DRAWDOWN_END_AGE, returnPct = DEFAULT_RETURN, feePct = 0, feeDollar = 0, inflationPct = ASIC_DEFLATORS.retirement }) {
  const years = Math.max(5, endAge - startAge);
  if (!(balance > 0)) return { income: 0, years, endAge: startAge + years };
  const real = (1 + (returnPct - feePct) / 100) / (1 + inflationPct / 100) - 1;
  const left = (income) => {
    let bal = balance;
    for (let y = 0; y < years; y++) { bal -= income; if (bal < 0) return bal; bal = Math.max(0, bal * (1 + real) - feeDollar); }
    return bal;
  };
  let lo = 0, hi = balance;
  for (let i = 0; i < 100; i++) { const mid = (lo + hi) / 2; if (left(mid) >= 0) lo = mid; else hi = mid; }
  return { income: lo, years, endAge: startAge + years };
}

// The retirement age used in the projection (RG 276.141 and 276.148): a retirement age below the preservation age
// is replaced by the preservation age (super can't be taken earlier), and anyone already 67 or older with no later
// age entered is assumed to retire on their next birthday. Returns null when the entry can't be used.
export function retirementAgeUsed(age, retireAge) {
  if (retireAge <= age) return age >= PENSION_AGE ? { age: age + 1, reason: 'next-birthday' } : null;
  if (retireAge < PRESERVATION_AGE) return { age: Math.max(PRESERVATION_AGE, age + 1), reason: 'preservation' };
  return { age: retireAge, reason: '' };
}

// Everything the page shows, from one set of inputs: the projection to retirement, how long a chosen income lasts and
// the income that lasts to endAge. The dollar fee in retirement is carried into the retirement-phase today's dollars
// (it grew at CPI while the balance was deflated by wage inflation).
export function retirementPlan({ income = 0, endAge = DRAWDOWN_END_AGE, ...v }) {
  const p = project(v);
  const years = v.retireAge - v.age;
  const infl = v.inflationPct ?? ASIC_DEFLATORS.retirement, defl = v.deflatorPct ?? ASIC_DEFLATORS.accumulation;
  const feeDollar = (v.feeDollar || 0) * ((1 + infl / 100) / (1 + defl / 100)) ** years;
  const common = { balance: p.balanceReal, startAge: v.retireAge, returnPct: v.returnPct ?? DEFAULT_RETURN, feePct: v.feePct || 0, feeDollar, inflationPct: infl };
  return { ...p, draw: drawdown({ ...common, income }), stream: incomeToAge({ ...common, endAge }) };
}

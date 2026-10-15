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
// feePct and feeDollar: admin fees as % of balance and $ a year (today's dollars, indexed to inflation).
// Cap and maximum contribution base are indexed to wage growth each year (smoothly; in law they rise in steps).
// Contributions and fees are assumed to happen mid-year on average, as Moneysmart assumes.
export function project({ age, retireAge, balance = 0, salary = 0, sgRate = SUPER_GUARANTEE, sacrifice = 0, returnPct = DEFAULT_RETURN,
  earningsTaxPct = EARNINGS_TAX_ASSUMED, feePct = 0, feeDollar = 0, wageGrowthPct = MONEYSMART.wageGrowth, inflationPct = MONEYSMART.inflation }) {
  const g = wageGrowthPct / 100, inf = inflationPct / 100, r = returnPct / 100, t = earningsTaxPct / 100, f = feePct / 100;
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
    const deflator = (1 + inf) ** (y + 1);
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

// How long a balance lasts drawing a set income, in today's dollars. Income is taken at the start of each year.
// In retirement we assume no tax on earnings (a retirement-phase account-based pension; an assumption, and it
// only holds up to the transfer balance cap). Fees continue. Returns years (fractional) and the age it runs out;
// lastsForever is true when it is still going at maxAge.
export function drawdown({ balance, income, startAge = PENSION_AGE, returnPct = DEFAULT_RETURN, feePct = 0, feeDollar = 0, inflationPct = MONEYSMART.inflation, maxAge = 110 }) {
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

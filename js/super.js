// Super contributions and salary sacrifice for an employee, 2026-27. Pure functions, no DOM.
// Income tax, LITO, Medicare levy, the super guarantee rate, the maximum contribution base and the concessional
// cap come from js/rates.js (2026-27).
import { taxAndMedicareFor, superFor } from './rates.js';

export const SUPER_CHECKED = '15 Oct 2026';
export const SUPER_YEAR = '2026-27';
const RATES = superFor(SUPER_YEAR);

// Concessional contributions cap: $32,500 from 1 July 2026 (indexed to AWOTE; was $30,000 in 2024-25 and 2025-26).
// ATO "Contributions caps", last updated 11 Sep 2026 (verified 15 Oct 2026).
export const CONCESSIONAL_CAP = RATES.concessionalCap; // $32,500
export const CAP_SOURCE = 'https://www.ato.gov.au/tax-rates-and-codes/key-superannuation-rates-and-thresholds/contributions-caps';
// Super guarantee 12% and the 2026-27 maximum contribution base of $270,830 a year (annual from 1 July 2026 under
// Payday Super; quarterly before then). ATO "Super guarantee", last updated 17 Apr 2026 (verified 15 Oct 2026):
// https://www.ato.gov.au/tax-rates-and-codes/key-superannuation-rates-and-thresholds/super-guarantee
// Both live in js/rates.js; 12% × $270,830 = $32,499.60, just under the cap.
export const SUPER_GUARANTEE = RATES.sg;
export const SUPER_MAX_BASE = RATES.maxBase;
// Carry-forward of unused cap amounts needs a total super balance under $500,000 on 30 June of the previous year;
// unused amounts last 5 years. ATO "Contributions caps" (verified). The available amount is shown in myGov.
export const CARRY_FORWARD_BALANCE = 500000;
// Tax on concessional contributions in the fund.
export const CONTRIBUTIONS_TAX = 0.15;
// Division 293: an extra 15% on the lesser of "low tax" contributions and the amount by which Division 293 income
// plus those contributions exceed $250,000. Division 293 income is income for MLS purposes without reportable super
// contributions. Low tax contributions are concessional contributions less any excess over the cap.
// ATO "Division 293 tax on concessional contributions by high-income earners", last updated 24 Aug 2026 (verified):
// https://www.ato.gov.au/individuals-and-families/super-for-individuals-and-families/super/growing-and-keeping-track-of-your-super/caps-limits-and-tax-on-super-contributions/division-293-tax-on-concessional-contributions-by-high-income-earners
export const DIV293 = { threshold: 250000, rate: 0.15 };
// Excess concessional contributions are included in taxable income and taxed at marginal rates (ATO "Contributions
// caps", verified). The 15% non-refundable offset for contributions tax already paid in the fund is from the law
// (ITAA 1997 s291-15) and was not re-checked on ato.gov.au on 15 Oct 2026, so results with an excess are an estimate.
export const EXCESS_OFFSET = 0.15;

// Income tax after LITO, plus the Medicare levy (no Medicare levy surcharge, HELP or other offsets).
export const personalTax = (taxable) => taxAndMedicareFor(SUPER_YEAR, taxable);

// Division 293 tax. income: Division 293 income; contributions: low tax contributions.
export function division293(income, contributions) {
  const over = income + contributions - DIV293.threshold;
  return over > 0 && contributions > 0 ? Math.min(contributions, over) * DIV293.rate : 0;
}

// Employer super guarantee on salary (qualifying earnings), capped at the maximum contribution base.
// Salary-sacrificed amounts still count as qualifying earnings, so sacrificing doesn't reduce the guarantee.
export const superGuarantee = (salary) => Math.min(Math.max(0, salary), SUPER_MAX_BASE) * SUPER_GUARANTEE;

// One year, one scenario. salary: yearly salary before any salary sacrifice, excluding super.
// sacrifice: salary sacrificed into super. personal: personal contributions you'll claim a deduction for.
// unusedCap: carried-forward unused cap amounts available (from myGov). otherIncome: Division 293 income other than
// salary (reportable fringe benefits, net investment losses, other taxable income).
// Anything that isn't a number gives null.
export function scenario({ salary, sacrifice = 0, personal = 0, unusedCap = 0, otherIncome = 0 }) {
  if (![salary, sacrifice, personal, unusedCap, otherIncome].every(Number.isFinite)) return null;
  const sg = superGuarantee(salary);
  const concessional = sg + sacrifice + personal;
  const cap = CONCESSIONAL_CAP + Math.max(0, unusedCap);
  const excess = Math.max(0, concessional - cap);
  const taxable = Math.max(0, salary - sacrifice - personal) + excess;
  const tax = Math.max(0, personalTax(taxable) - excess * EXCESS_OFFSET);
  const contributionsTax = concessional * CONTRIBUTIONS_TAX;
  const lowTax = concessional - excess;
  const div293 = division293(taxable - excess + Math.max(0, otherIncome), lowTax);
  const takeHome = salary - sacrifice - personal - tax;
  return { sg, concessional, cap, excess, taxable, tax, contributionsTax, div293, lowTax, takeHome, remaining: Math.max(0, cap - concessional) };
}

// Compares salary sacrificing with not salary sacrificing.
export function salarySacrifice(o) {
  const withS = scenario(o);
  const without = scenario({ ...o, sacrifice: 0 });
  if (!withS || !without) return null;
  const sacrifice = o.sacrifice || 0;
  const incomeTaxSaved = without.tax - withS.tax;
  const extraContribTax = withS.contributionsTax - without.contributionsTax;
  const extraDiv293 = withS.div293 - without.div293;
  return {
    ...withS,
    without,
    incomeTaxSaved,
    extraContribTax,
    extraDiv293,
    // Overall tax saved: less income tax and Medicare levy, minus the extra 15% (and any Division 293) on the sacrifice.
    taxSaved: incomeTaxSaved - extraContribTax - extraDiv293,
    takeHomeChange: withS.takeHome - without.takeHome,
    // What the sacrifice adds to super after contributions tax (Division 293 tax shown separately; it can be paid
    // from your own money or released from super).
    superAdded: sacrifice - extraContribTax,
    marginalRate: marginal(withS.taxable),
  };
}

// Marginal rate including the 2% Medicare levy, at a taxable income.
export function marginal(taxable) {
  const d = personalTax(taxable + 100) - personalTax(taxable);
  return Math.round(d) / 100;
}

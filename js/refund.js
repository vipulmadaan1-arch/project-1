// Tax refund estimate for an Australian resident individual, 2025-26 and 2026-27. Pure functions, no DOM.
// Refund = tax withheld − (income tax after LITO + Medicare levy + Medicare levy surcharge + HELP repayment
// − franking credits). A negative result is an amount you owe.
import { YEARS as RATES, SOURCES as RATE_SOURCES, MLS_RATES, taxFor, litoFor, medicareFor, mlsFor as mlsRate, helpFor as helpRate } from './rates.js';

export const REFUND_CHECKED = '15 Oct 2026';

export const SOURCES = {
  rates: RATE_SOURCES.brackets,
  medicare: RATE_SOURCES.medicare,
  mls: RATE_SOURCES.mls,
  help: RATE_SOURCES.help,
  standard: RATE_SOURCES.standard,
  lito: RATE_SOURCES.lito,
};

// Income years this estimator offers. Every rate comes from js/rates.js, which records each figure's ATO source:
//   brackets  16% second bracket in 2025-26, 15% in 2026-27.
//   standard  standard deduction for work-related expenses: none in 2025-26; up to $1,000 from 2026-27.
//   medicare  single low-income thresholds. 2025-26: $28,011 / $35,013. 2026-27: not published yet, so the
//             2025-26 figures are used as an ESTIMATE (medicare.estimate) and the page says so.
//   mls       Medicare levy surcharge single tiers. 2025-26: $101,000 / $118,000 / $158,000.
//             2026-27: $105,000 / $123,000 / $164,000. Rates 1%, 1.25%, 1.5%.
//   help      study and training loan compulsory repayments (marginal).
// LITO is unchanged for both years.
// The shape below (fyStart, standard, medicare, mls, help) is kept for the page and tests.
const yearView = (label) => {
  const r = RATES[label];
  return {
    fyStart: Number(label.slice(0, 4)), standard: r.standard,
    medicare: { lower: r.medicare.lower, upper: r.medicare.upper, estimate: r.medicare.estimate },
    mls: r.mls.single,
    help: { threshold: r.help.threshold, band2: r.help.band2, band2Base: r.help.band2Base, top: r.help.top },
  };
};
export const YEARS = { '2025-26': yearView('2025-26'), '2026-27': yearView('2026-27') };
export { MLS_RATES };
export const DEFAULT_YEAR = '2025-26';

const yearOf = (year) => {
  const y = YEARS[year];
  if (!y) throw new Error(`Unknown income year ${year}`);
  return y;
};

export function basicTax(taxable, year = DEFAULT_YEAR) {
  yearOf(year);
  return taxFor(year, taxable);
}

// Medicare levy: nil at or below the lower threshold, 10c per $1 over it up to the upper threshold, then 2%.
export function medicareLevyFor(taxable, year = DEFAULT_YEAR) {
  yearOf(year);
  return medicareFor(year, taxable);
}

// Medicare levy surcharge for a single person with no private hospital cover for the full year.
// The thresholds are "or less", so the limit itself is in the lower tier.
export function mlsFor(incomeForMls, year = DEFAULT_YEAR) {
  yearOf(year);
  return mlsRate(year, incomeForMls);
}

export function helpFor(repaymentIncome, year = DEFAULT_YEAR) {
  yearOf(year);
  return helpRate(year, repaymentIncome);
}

/**
 * o.salary: gross salary and wages. o.withheld: PAYG tax withheld (income statement).
 * o.interest, o.dividends (cash received), o.franking (franking credits; grossed up into income and refundable).
 * o.workDeductions, o.otherDeductions. o.privateCover: appropriate private hospital cover all year.
 * o.help: has a HELP/study loan debt. Simplified: single, full-year resident, no fringe benefits,
 * investment losses or reportable super, so income for MLS and HELP repayment income = taxable income.
 */
export function taxRefund({ year = DEFAULT_YEAR, salary = 0, withheld = 0, interest = 0, dividends = 0, franking = 0,
  workDeductions = 0, otherDeductions = 0, privateCover = true, help = false } = {}) {
  const y = yearOf(year);
  if (![salary, withheld, interest, dividends, franking, workDeductions, otherDeductions].every(Number.isFinite)) return null;
  const income = salary + interest + dividends + franking;
  // From 2026-27 the standard deduction (lower of $1,000 and labour income) applies unless the work-related
  // expenses you claim are larger; claiming them replaces it.
  const standard = y.standard ? Math.min(y.standard, Math.max(0, salary)) : 0;
  const useStandard = standard > workDeductions;
  const workClaim = useStandard ? standard : workDeductions;
  const deductions = workClaim + otherDeductions;
  // Taxable income is rounded down to whole dollars on a return.
  const taxable = Math.max(0, Math.floor(income - deductions));
  const gross = basicTax(taxable, year);
  const offset = Math.min(gross, litoFor(taxable)); // non-refundable
  const incomeTax = gross - offset;
  const medicare = medicareLevyFor(taxable, year);
  const mls = privateCover ? { tier: 0, rate: 0, amount: 0 } : mlsFor(taxable, year);
  const helpAmt = help ? helpFor(taxable, year) : 0;
  const liability = incomeTax + medicare + mls.amount + helpAmt - franking; // franking credits are refundable
  const refund = withheld - liability;
  return {
    year, income, standard, useStandard, workClaim, deductions, taxable, gross, lito: offset, incomeTax,
    medicare, mls, help: helpAmt, franking, liability, withheld, refund,
    medicareEstimate: y.medicare.estimate,
  };
}

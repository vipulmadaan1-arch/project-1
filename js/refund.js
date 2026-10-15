// Tax refund estimate for an Australian resident individual, 2025-26 and 2026-27. Pure functions, no DOM.
// Refund = tax withheld − (income tax after LITO + Medicare levy + Medicare levy surcharge + HELP repayment
// − franking credits). A negative result is an amount you owe.
import { lito, MEDICARE, STANDARD_DEDUCTION } from './calc.js';
import { bracketsFor } from './cgt.js';

export const REFUND_CHECKED = '15 Oct 2026';

export const SOURCES = {
  rates: 'https://www.ato.gov.au/tax-rates-and-codes/tax-rates-australian-residents',
  medicare: 'https://www.ato.gov.au/individuals-and-families/medicare-and-private-health-insurance/medicare-levy/medicare-levy-reduction/medicare-levy-reduction-for-low-income-earners',
  mls: 'https://www.ato.gov.au/individuals-and-families/medicare-and-private-health-insurance/medicare-levy-surcharge/medicare-levy-surcharge-income-thresholds-and-rates',
  help: 'https://www.ato.gov.au/tax-rates-and-codes/study-and-training-loan-minimum-repayment-income-and-rates',
  standard: 'https://www.ato.gov.au/individuals-and-families/income-deductions-offsets-and-records/deductions-you-can-claim/work-related-deductions/standard-deduction-for-work-related-expenses',
  lito: 'https://www.ato.gov.au/individuals-and-families/income-deductions-offsets-and-records/tax-offsets/low-income-tax-offset',
};

// Income years.
//   fyStart   first calendar year of the income year, for bracketsFor() in cgt.js: 16% second bracket to
//             2025-26, 15% in 2026-27 (Treasury Laws Amendment (Cost of Living Tax Cuts) Act 2024 and later
//             amendment). ATO "Tax rates – Australian resident" (last updated 13 Aug 2026), verified 15 Oct 2026:
//             2025-26 $4,288 at $45,000; 2026-27 $4,020 at $45,000.
//   standard  standard deduction for work-related expenses: none in 2025-26; up to $1,000 from 2026-27
//             (ATO "Standard deduction for work-related expenses", updated 14 Sep 2026; calc.js STANDARD_DEDUCTION).
//   medicare  single low-income thresholds. 2025-26: $28,011 / $35,013, ATO "Medicare levy reduction for
//             low-income earners" (last updated 30 June 2026), verified 15 Oct 2026. 2026-27: the ATO hasn't
//             published thresholds yet, so the 2025-26 figures (calc.js MEDICARE) are used as an ESTIMATE.
//   mls       Medicare levy surcharge single tiers, ATO "Medicare levy surcharge income, thresholds and rates"
//             (last updated 22 June 2026), verified 15 Oct 2026. 2025-26: $101,000 / $118,000 / $158,000.
//             2026-27: $105,000 / $123,000 / $164,000. Rates 1%, 1.25%, 1.5%.
//   help      study and training loan compulsory repayments (marginal), ATO "Study and training loan minimum
//             repayment income and rates" (last updated 13 Oct 2026), verified 15 Oct 2026.
//             2025-26: nil to $67,000; 15c per $1 over $67,000 to $125,000; $8,700 + 17c per $1 over $125,000
//             to $179,285; 10% of repayment income from $179,286.
//             2026-27: nil to $69,528; 15c to $129,717; $9,028 + 17c to $186,050; 10% from $186,051.
// LITO: up to $700, less 5c per $1 over $37,500, less 1.5c per $1 over $45,000 (calc.js lito()); unchanged
// for both years. ATO "Low income tax offset" (last updated 8 June 2026), verified 15 Oct 2026.
export const YEARS = {
  '2025-26': {
    fyStart: 2025, standard: 0, medicare: { lower: 28011, upper: 35013, estimate: false },
    mls: [101000, 118000, 158000],
    help: { threshold: 67000, band2: 125000, band2Base: 8700, top: 179285 },
  },
  '2026-27': {
    fyStart: 2026, standard: STANDARD_DEDUCTION, medicare: { lower: MEDICARE.lower, upper: MEDICARE.upper, estimate: true },
    mls: [105000, 123000, 164000],
    help: { threshold: 69528, band2: 129717, band2Base: 9028, top: 186050 },
  },
};
export const MLS_RATES = [0, 0.01, 0.0125, 0.015];
export const DEFAULT_YEAR = '2025-26';

const yearOf = (year) => {
  const y = YEARS[year];
  if (!y) throw new Error(`Unknown income year ${year}`);
  return y;
};

export function basicTax(taxable, year = DEFAULT_YEAR) {
  let tax = 0, prev = 0;
  for (const [upTo, rate] of bracketsFor(yearOf(year).fyStart)) {
    if (taxable > prev) tax += (Math.min(taxable, upTo) - prev) * rate;
    prev = upTo;
  }
  return tax;
}

// Medicare levy: nil at or below the lower threshold, 10c per $1 over it up to the upper threshold, then 2%.
export function medicareLevyFor(taxable, year = DEFAULT_YEAR) {
  const { lower, upper } = yearOf(year).medicare;
  if (taxable <= lower) return 0;
  if (taxable <= upper) return (taxable - lower) * 0.10;
  return taxable * 0.02;
}

// Medicare levy surcharge for a single person with no private hospital cover for the full year.
// The thresholds are "or less", so the limit itself is in the lower tier.
export function mlsFor(incomeForMls, year = DEFAULT_YEAR) {
  const tier = yearOf(year).mls.filter((limit) => incomeForMls > limit).length;
  return { tier, rate: MLS_RATES[tier], amount: incomeForMls * MLS_RATES[tier] };
}

export function helpFor(repaymentIncome, year = DEFAULT_YEAR) {
  const h = yearOf(year).help;
  const x = repaymentIncome;
  if (x <= h.threshold) return 0;
  if (x <= h.band2) return (x - h.threshold) * 0.15;
  if (x <= h.top) return h.band2Base + (x - h.band2) * 0.17;
  return x * 0.10;
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
  const offset = Math.min(gross, lito(taxable)); // non-refundable
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

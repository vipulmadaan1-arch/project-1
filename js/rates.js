// ATO rates for individuals, by income year: the one place they're kept. Pure data and small functions, no DOM.
// Every engine that needs a tax bracket, Medicare levy threshold, study loan band, surcharge tier, super rate or
// the low income tax offset imports it from here, so a new income year is a change to this file only
// (tests/rollover.test.mjs fails once CURRENT_YEAR has ended, as a reminder).
//
// Each year lists only figures the site uses. A figure the ATO hasn't published yet is carried forward from the
// latest published year and marked `estimate: true`; the pages that use it say so.

// The income year the site treats as "this year" (take-home pay, super, HECS/HELP, term deposits).
export const CURRENT_YEAR = '2026-27';

export const SOURCES = {
  // ATO "Tax rates – Australian resident" (last updated 13 Aug 2026), checked 15 Oct 2026.
  brackets: 'https://www.ato.gov.au/tax-rates-and-codes/tax-rates-australian-residents',
  // ATO "Medicare levy reduction for low-income earners" (last updated 30 June 2026), checked 15 Oct 2026: 2025-26.
  medicare: 'https://www.ato.gov.au/individuals-and-families/medicare-and-private-health-insurance/medicare-levy/medicare-levy-reduction/medicare-levy-reduction-for-low-income-earners',
  // ATO "M1 Medicare levy reduction or exemption 2025" (published 27 May 2025), checked 15 Oct 2026: 2024-25.
  medicare2025: 'https://www.ato.gov.au/forms-and-instructions/individual-tax-return-2025-instructions/medicare-levy-questions-m1-m2-individual-tax-return-2025/m1-medicare-levy-reduction-or-exemption-2025',
  // ATO "Medicare levy surcharge income, thresholds and rates" (last updated 22 June 2026), checked 15 Oct 2026.
  mls: 'https://www.ato.gov.au/individuals-and-families/medicare-and-private-health-insurance/medicare-levy-surcharge/medicare-levy-surcharge-income-thresholds-and-rates',
  // ATO "Study and training loan minimum repayment income and rates" (last updated 13 Oct 2026), checked 15 Oct 2026.
  help: 'https://www.ato.gov.au/tax-rates-and-codes/study-and-training-loan-minimum-repayment-income-and-rates',
  // ATO "Standard deduction for work-related expenses" (last updated 14 Sep 2026), checked 15 Oct 2026.
  standard: 'https://www.ato.gov.au/individuals-and-families/income-deductions-offsets-and-records/deductions-you-can-claim/work-related-deductions/standard-deduction-for-work-related-expenses',
  // ATO "Low income tax offset" (last updated 8 June 2026), checked 15 Oct 2026.
  lito: 'https://www.ato.gov.au/individuals-and-families/income-deductions-offsets-and-records/tax-offsets/low-income-tax-offset',
  // ATO "Super guarantee" (last updated 17 Apr 2026), checked 15 Oct 2026.
  sg: 'https://www.ato.gov.au/tax-rates-and-codes/key-superannuation-rates-and-thresholds/super-guarantee',
  // ATO "Contributions caps" (last updated 11 Sep 2026), checked 15 Oct 2026.
  caps: 'https://www.ato.gov.au/tax-rates-and-codes/key-superannuation-rates-and-thresholds/contributions-caps',
};

// Resident rates: [taxable income up to, rate on the part of income in this bracket]. Only the second bracket
// has changed across these years: 16% to 2025-26, 15% in 2026-27, 14% from 2027-28 (Treasury Laws Amendment
// (Cost of Living Tax Cuts) Act 2024 and the later amendment, legislated). ATO checks: $4,288 tax at $45,000 in
// 2025-26 and $4,020 in 2026-27.
const brackets = (second) => [[18200, 0], [45000, second], [135000, 0.30], [190000, 0.37], [Infinity, 0.45]];

// Medicare levy: 2%, nil at or below the single lower threshold, 10c per $1 over it up to the upper threshold.
const medicare = (lower, upper, estimate = false) => ({ rate: 0.02, lower, upper, shadeIn: 0.10, estimate });

// Study and training loan compulsory repayments (marginal system from 2025-26): nil to `threshold`, 15c per $1
// over it to `band2`, then `band2Base` + 17c per $1 over `band2` to `top`, then 10% of all repayment income.
const help = (threshold, band2, band2Base, top) => ({ threshold, band2, band2Base, top, rate1: 0.15, rate2: 0.17, topRate: 0.10 });

// Low income tax offset: up to $700, less 5c per $1 over $37,500, then less 1.5c per $1 over $45,000 (from $325).
// Unchanged for every year below (ATO "Low income tax offset", SOURCES.lito).
export const LITO = { max: 700, lower: 37500, taper1: 0.05, mid: 45000, midAmount: 325, taper2: 0.015 };

// Medicare levy surcharge rates by tier (base, 1, 2, 3). Same in every year below (SOURCES.mls).
export const MLS_RATES = [0, 0.01, 0.0125, 0.015];

export const YEARS = {
  '2024-25': {
    brackets: brackets(0.16),
    medicare: medicare(27222, 34027), // SOURCES.medicare2025, table 1 "All other taxpayers"
    standard: 0,
  },
  '2025-26': {
    brackets: brackets(0.16),
    medicare: medicare(28011, 35013), // SOURCES.medicare
    standard: 0, // the standard deduction starts in 2026-27
    mls: { single: [101000, 118000, 158000], family: [202000, 236000, 316000] }, // SOURCES.mls (verified 17 Oct 2026)
    help: help(67000, 125000, 8700, 179285), // SOURCES.help, 2025-26 table
  },
  '2026-27': {
    brackets: brackets(0.15),
    // ESTIMATE: the ATO hadn't published 2026-27 thresholds as at 15 Oct 2026, so 2025-26's are carried forward.
    medicare: medicare(28011, 35013, true),
    standard: 1000, // lower of $1,000 and labour income, SOURCES.standard
    mls: { single: [105000, 123000, 164000], family: [210000, 246000, 328000] }, // SOURCES.mls
    help: help(69528, 129717, 9028, 186050), // SOURCES.help, 2026-27 table
    // 12% super guarantee on earnings up to the maximum contribution base, annual from 1 July 2026 under Payday
    // Super (SOURCES.sg). Concessional contributions cap $32,500 from 1 July 2026 (SOURCES.caps; $30,000 before).
    super: { sg: 0.12, maxBase: 270830, concessionalCap: 32500 },
  },
  '2027-28': {
    brackets: brackets(0.14), // legislated 14% second bracket from 1 July 2027 (SOURCES.brackets)
    medicare: medicare(28011, 35013, true), // ESTIMATE, carried forward from 2025-26
  },
};

export function ratesFor(year) {
  const y = YEARS[year];
  if (!y) throw new Error(`No ATO rates for income year ${year} in js/rates.js`);
  return y;
}
const part = (year, key) => {
  const v = ratesFor(year)[key];
  if (!v) throw new Error(`js/rates.js has no ${key} figures for ${year}`);
  return v;
};

// Income tax on taxable income at resident rates, before offsets and the Medicare levy.
export function taxFor(year, income) {
  let tax = 0, prev = 0;
  for (const [upTo, rate] of ratesFor(year).brackets) {
    if (income > prev) tax += (Math.min(income, upTo) - prev) * rate;
    prev = upTo;
  }
  return tax;
}

// Low income tax offset (the same in every year in the table).
export function litoFor(income) {
  if (income <= LITO.lower) return LITO.max;
  if (income <= LITO.mid) return LITO.max - (income - LITO.lower) * LITO.taper1;
  return Math.max(0, LITO.midAmount - (income - LITO.mid) * LITO.taper2);
}

export function medicareFor(year, income) {
  const m = ratesFor(year).medicare;
  if (income <= m.lower) return 0;
  if (income <= m.upper) return (income - m.lower) * m.shadeIn;
  return income * m.rate;
}

// Income tax after LITO (non-refundable, so never below nil), plus the Medicare levy.
export const taxAndMedicareFor = (year, income) => Math.max(0, taxFor(year, income) - litoFor(income)) + medicareFor(year, income);

export function helpFor(year, repaymentIncome) {
  const h = part(year, 'help');
  const x = repaymentIncome;
  if (x <= h.threshold) return 0;
  if (x <= h.band2) return (x - h.threshold) * h.rate1;
  if (x <= h.top) return h.band2Base + (x - h.band2) * h.rate2;
  return x * h.topRate;
}

// Surcharge tier limits for a single person or a family. Each limit is "or less", so it's in the lower tier.
export const mlsTiersFor = (year, family = false) => part(year, 'mls')[family ? 'family' : 'single'];
export function mlsFor(year, incomeForMls, family = false) {
  const tier = mlsTiersFor(year, family).filter((limit) => incomeForMls > limit).length;
  return { tier, rate: MLS_RATES[tier], amount: incomeForMls * MLS_RATES[tier] };
}

export const superFor = (year) => part(year, 'super');

// The last day of an income year ('2026-27' → '2027-06-30').
export const yearEnd = (year) => `${Number(year.slice(0, 4)) + 1}-06-30`;

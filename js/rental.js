// Rental property cashflow and negative gearing for an individual owner. Pure functions, no DOM.
//
// Law: Income Tax Assessment Act 1997 s26-155 and s26-160, inserted by Schedule 2 of the Treasury Laws
// Amendment (Tax Reform No. 1) Act 2026 (No. 49 of 2026, assented 26 June 2026). Source:
// https://www.legislation.gov.au/C2026A00049/asmade/text (Authorised Version C2026A00049).
// Schedule 2 item 5: applies to the 2027-28 income year and later years.
//
// The rules this file implements (verified against the Act text unless marked otherwise):
// 1. s26-155(1): if your deductions for using or holding residential dwellings as residential
//    accommodation exceed your assessable income from them for the year, the excess is not deductible.
//    It becomes a "quarantined amount" that can reduce residential capital gains (s102-5 method statement,
//    steps 3 and 4), and whatever is left is treated as a residential deduction for the next income year
//    (so it can absorb future rental profit). It never reduces salary, wages or business income.
// 2. The limit is worked out across all your quarantined dwellings together, not property by property:
//    s26-155(1) compares your total residential deductions with your total residential income.
// 3. s26-155(2)(a) and (3): a dwelling you last acquired before 7.30 pm by legal time in the ACT (AEST) on
//    12 May 2026 is outside the limit. For a purchase under a contract, the time you entered into the
//    contract counts, even if settlement was later.
// 4. s26-155(2)(b) and s26-160(3)-(4): a "new residential dwelling" is outside the limit. The Act leaves the
//    definition to a Minister's legislative instrument, which had not been made by 15 Oct 2026 (UNCERTAIN).
//    The Budget 2026-27 tax explainer (https://budget.gov.au/content/factsheets/download/
//    tax-explainers-negative-gearing-capital-gains-tax.pdf) says a new build is built on vacant land, or
//    replaces demolished housing with more dwellings, and hasn't been sold before (unless the builder owned
//    it and it was occupied for no more than 12 months). We take the owner's word on the "new build" box.
// 5. s26-155(6)(a): net income from your exempt (grandfathered or new-build) dwellings also reduces the
//    excess. This calculator models one property, plus an optional quarantined amount carried forward.
//
// Tax rates, LITO and the Medicare levy come from js/rates.js: the 2026-27 table (15% second bracket) for 2026-27,
// and the 2027-28 table (14%, Treasury Laws Amendment (Cost of Living Tax Cuts) legislation) for 2027-28 and later
// years (no later rates are legislated, so 2028-29 onwards reuse 2027-28's). Medicare thresholds are the latest the ATO has published (2025-26),
// carried forward as an estimate.
// The Working Australians tax offset (Schedule 3 of the same Act) isn't modelled.
import { repayment } from './calc.js';
import { taxFor, taxAndMedicareFor } from './rates.js';

export const RENTAL_CHECKED = '15 Oct 2026';
export const LIMIT_START_FY = 2027; // the 2027-28 income year (Schedule 2 item 5)
export const GRANDFATHER_DATE = '2026-05-12'; // before 7.30 pm AEST on this day (s26-155(2)(a))

// The js/rates.js income year whose rates apply in a year starting 1 July fyStart (2026 → 2026-27).
export const ratesYear = (fyStart) => (fyStart <= 2026 ? '2026-27' : '2027-28');

/** Basic income tax for a resident. fyStart 2026 means the 2026-27 income year. */
export function basicTax(income, fyStart) {
  return taxFor(ratesYear(fyStart), income);
}

/** Income tax after the low income tax offset, plus the Medicare levy. */
export function totalTax(income, fyStart) {
  return taxAndMedicareFor(ratesYear(fyStart), Math.max(0, income));
}

export const fyLabel = (fyStart) => `${fyStart}-${String((fyStart + 1) % 100).padStart(2, '0')}`;

/**
 * Is a dwelling grandfathered (acquired before 7.30 pm AEST on 12 May 2026)?
 * @param {string} acquired contract date, 'YYYY-MM-DD'
 * @param {boolean} beforeBudgetTime on 12 May 2026 itself: was the contract signed before 7.30 pm AEST?
 */
export function isGrandfathered(acquired, beforeBudgetTime = false) {
  if (!acquired) return false;
  if (acquired < GRANDFATHER_DATE) return true;
  if (acquired === GRANDFATHER_DATE) return !!beforeBudgetTime;
  return false;
}

/**
 * Loan costs for the year. Interest-only: interest = loan × rate. Principal and interest: monthly repayments
 * over the term, and this is the first 12 months of the loan (interest falls as the balance is paid down).
 */
export function loanYear({ loan, ratePct, type = 'io', termYears = 30 }) {
  if (!(loan > 0)) return { interest: 0, principal: 0, repayments: 0 };
  if (type !== 'pi') { const interest = loan * ratePct / 100; return { interest, principal: 0, repayments: interest }; }
  const pmt = repayment(loan, ratePct, termYears, 12);
  const i = ratePct / 100 / 12;
  let bal = loan, interest = 0;
  for (let m = 0; m < 12 && bal > 0; m++) { const int = bal * i; interest += int; bal -= pmt - int; }
  const repayments = pmt * Math.min(12, Math.round(termYears * 12));
  return { interest, principal: repayments - interest, repayments };
}

/**
 * @param {object} o
 * @param {number} o.fyStart income year (2027 = 2027-28)
 * @param {number} o.weeklyRent, o.vacancyWeeks
 * @param {number} o.price purchase price (for yield and loan-to-value only)
 * @param {number} o.loan, o.ratePct; o.loanType 'io' | 'pi'; o.termYears (P&I only)
 * @param {number} o.councilRates, o.strata, o.insurance, o.maintenance, o.landTax, o.otherCosts (a year)
 * @param {number} o.pmPct property management fee, % of rent collected
 * @param {number} o.depreciation (non-cash deduction, a year)
 * @param {number} o.income owner's other taxable income
 * @param {string} o.acquired contract date; o.beforeBudgetTime; o.newBuild
 * @param {number} [o.carriedForward] quarantined amount carried forward from earlier years
 */
export function rentalCashflow(o) {
  const { fyStart, weeklyRent = 0, vacancyWeeks = 0, price = 0, loan = 0, ratePct = 0, loanType = 'io', termYears = 30,
    councilRates = 0, strata = 0, insurance = 0, pmPct = 0, maintenance = 0, landTax = 0, otherCosts = 0,
    depreciation = 0, income = 0, acquired, beforeBudgetTime = false, newBuild = false, carriedForward = 0 } = o;
  if (!(vacancyWeeks >= 0 && vacancyWeeks <= 52)) return null;

  const rent = weeklyRent * (52 - vacancyWeeks);
  const management = rent * pmPct / 100;
  const ln = loanYear({ loan, ratePct, type: loanType, termYears });
  const holding = councilRates + strata + insurance + management + maintenance + landTax + otherCosts;
  const cashOut = ln.repayments + holding; // principal is cash out but not deductible
  const preTax = rent - cashOut;
  const deductions = ln.interest + holding + depreciation;
  const net = rent - deductions; // net rental income (+) or loss (−) for tax

  const grandfathered = isGrandfathered(acquired, beforeBudgetTime);
  const yearCovered = fyStart >= LIMIT_START_FY;
  const exempt = grandfathered || newBuild;
  const limited = yearCovered && !exempt;

  const baseTax = totalTax(income, fyStart);
  // Negative gearing allowed: the whole loss (or profit) goes against other income.
  const settle = (taxableRental) => {
    const tax = totalTax(income + taxableRental, fyStart) - baseTax;
    return { taxableRental, taxEffect: tax, afterTax: preTax - tax, afterTaxWeekly: (preTax - tax) / 52 };
  };
  const full = { ...settle(net), quarantined: 0, carriedOut: 0, carriedUsed: 0 };
  // Limit applied (s26-155(1)): residential deductions, including amounts carried in, can't exceed
  // residential income. The excess is carried forward (after any residential capital gains, not modelled).
  const withCarry = deductions + carriedForward;
  const excess = Math.max(0, withCarry - rent);
  const deductible = withCarry - excess;
  const carriedUsed = Math.min(carriedForward, Math.max(0, rent - deductions));
  const quarantinedThisYear = Math.max(0, -net);
  const capped = { ...settle(rent - deductible), quarantined: quarantinedThisYear, carriedOut: excess, carriedUsed };
  // Carried-forward amounts only exist under the limit, but grandfathered and new-build dwellings aren't
  // quarantined, so for them the carried amount is ignored here (it belongs to other dwellings).
  const result = limited ? capped : full;

  return {
    fyStart, rent, management, ...ln, holding, cashOut, preTax, preTaxWeekly: preTax / 52, deductions, net,
    depreciation, grossYield: price > 0 ? weeklyRent * 52 / price * 100 : null, lvr: price > 0 ? loan / price * 100 : null,
    grandfathered, newBuild, yearCovered, exempt, limited, baseTax,
    ...result, full, capped,
    marginal: Math.round((totalTax(income + 1000, fyStart) - baseTax) / 10) / 100, // marginal rate incl. Medicare
  };
}

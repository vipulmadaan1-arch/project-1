// Borrowing power estimate: roughly how much a bank might lend on a principal and interest home loan.
// Pure functions, no DOM. This is a simplified model of a bank serviceability test, not any lender's calculator.
import { takeHome, repayment } from './calc.js';

export const BORROWING_CHECKED = '15 Oct 2026';

// APRA mortgage serviceability buffer: banks must test that you could repay at least 3 percentage points
// above the loan rate. Source (official): APRA "APRA maintains current macroprudential policy settings in highly
// uncertain environment" (2026) and APRA Corporate Plan 2026-27 (Aug 2026), both confirming 3 percentage points.
// https://www.apra.gov.au/news-and-publications/apra-maintains-current-macroprudential-policy-settings-highly-uncertain
export const APRA_BUFFER = 3;

// APRA debt-to-income limit, effective 1 Feb 2026 (APS 220 Attachment C): each bank may write no more than 20% of
// new owner-occupier loans, and 20% of new investor loans, at a debt-to-income ratio of 6 or more.
// Source (official): https://www.apra.gov.au/activation-of-debt-to-income-limits-as-a-macroprudential-policy-tool
export const DTI_LIMIT = 6;
export const DTI_SHARE = 0.20;

// Credit cards are assessed as if fully drawn, at 3.8% of the limit a month: the repayment that clears the
// limit in 3 years, which is the test ASIC requires for credit card suitability (ASIC CP 303, 2018;
// National Consumer Credit Protection Regulations reg 28HA). Lenders use 3% to 3.8%; 3.8% is the
// conservative end. ESTIMATE: lender practice, not an APRA or ASIC rule for home loans.
// https://download.asic.gov.au/media/4801736/cp303-published-4-july-2018.pdf
export const CARD_RATE = 0.038;

// Rental and other non-salary income is "shaded": lenders typically count about 80% of it, to allow for
// vacancies and costs. ESTIMATE: common lender practice (some use 70% to 80%), not an official figure.
export const OTHER_INCOME_SHADE = 0.8;

// Present value of a monthly payment over n months at a monthly rate i (the most a payment can repay).
export function presentValue(payment, ratePct, months) {
  const i = ratePct / 100 / 12;
  if (months <= 0 || payment <= 0) return 0;
  if (i === 0) return payment * months;
  return payment * (1 - (1 + i) ** -months) / i;
}

/**
 * @param {object} o
 * @param {{income:number, help?:boolean}[]} o.applicants  gross yearly salary (before tax, excluding super)
 * @param {number} [o.otherIncome]   gross yearly rental or other income for the household (before shading)
 * @param {number} o.expenses        monthly living expenses
 * @param {number} [o.cardLimits]    total credit card limits
 * @param {number} [o.otherRepayments] monthly repayments on other loans (car, personal, other home loans)
 * @param {number} [o.otherDebt]     total still owing on those other loans (only used for the DTI ratio)
 * @param {number} o.ratePct         the loan's interest rate, % a year
 * @param {number} o.years           loan term
 */
export function borrowingPower({ applicants, otherIncome = 0, expenses, cardLimits = 0, otherRepayments = 0, otherDebt = 0, ratePct, years, buffer = APRA_BUFFER, shade = OTHER_INCOME_SHADE }) {
  // Anything that isn't a number, or a loan with no term, gives null.
  if (![otherIncome, expenses, cardLimits, otherRepayments, otherDebt, ratePct, years, ...applicants.map((a) => a.income)].every(Number.isFinite) || !(years > 0)) return null;
  const n = applicants.length;
  const shaded = otherIncome * shade;
  // Shaded other income is split evenly between applicants and taxed at each person's marginal rate.
  // No $1,000 standard deduction: lenders assess income before tax-time claims.
  const people = applicants.map((a) => {
    const t = takeHome(a.income + shaded / n, { help: !!a.help, standardDeduction: false });
    return { gross: a.income + shaded / n, tax: t.tax, medicare: t.medicare, help: t.help, net: t.net };
  });
  const netMonthly = people.reduce((s, p) => s + p.net, 0) / 12;
  const cardCommitment = cardLimits * CARD_RATE;
  const commitments = cardCommitment + otherRepayments;
  const surplus = netMonthly - expenses - commitments;
  const assessRate = ratePct + buffer;
  const months = Math.round(years * 12);
  const maxLoan = surplus > 0 ? presentValue(surplus, assessRate, months) : 0;
  const pay = repayment(maxLoan, ratePct, years);
  const grossIncome = applicants.reduce((s, a) => s + a.income, 0) + otherIncome;
  const totalDebt = maxLoan + otherDebt + cardLimits;
  const dti = grossIncome > 0 ? totalDebt / grossIncome : null;
  const dtiCapLoan = Math.max(0, DTI_LIMIT * grossIncome - otherDebt - cardLimits);
  return {
    people, netMonthly, cardCommitment, commitments, surplus, assessRate, maxLoan, repayment: pay,
    assessedRepayment: surplus > 0 ? surplus : 0, grossIncome, totalDebt, dti, dtiCapLoan, highDti: dti != null && dti >= DTI_LIMIT,
  };
}

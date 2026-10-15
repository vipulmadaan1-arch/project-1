// Term deposit interest. Pure maths, no rates to look up (the tax option reuses the ATO rates in js/calc.js).
// A term deposit pays a fixed rate for a fixed term; interest is paid monthly, quarterly, annually or at
// maturity (Moneysmart, "Term deposits", https://moneysmart.gov.au/investments-paying-interest/term-deposits,
// updated 14 July 2026, checked 15 Oct 2026). Moneysmart doesn't currently offer a term deposit calculator,
// so this one doesn't claim to match one.
//
// Assumptions: each month is 1/12 of a year (banks usually count days, so results can differ by a few
// dollars); interest paid during the term is either paid out to you (simple interest) or added to the
// deposit and earns interest itself (reinvested, compounding at the payment frequency); if the term isn't a
// whole number of payment periods, the last part-period earns simple interest pro rata. No fees.
import { incomeTax, medicareLevy, TAX_YEAR } from './calc.js';

export const TERM_DEPOSIT_CHECKED = '15 Oct 2026';
export { TAX_YEAR };
export const PAY_FREQ = { monthly: 12, quarterly: 4, annually: 1, maturity: 0 };

export function termDeposit({ amount, ratePct, months, paid = 'maturity', reinvest = true }) {
  const r = ratePct / 100;
  const k = PAY_FREQ[paid];
  if (!k || !reinvest) {
    // At maturity, or paid out as it's earned: simple interest on the deposit.
    const interest = amount * r * months / 12;
    const payments = k ? Math.ceil(months / (12 / k) - 1e-9) : 1;
    return { interest, balance: amount + (k ? 0 : interest), paidOut: k ? interest : 0, perPayment: k ? amount * r / k : interest, payments, effectiveRatePct: (interest / amount) / (months / 12) * 100 };
  }
  const periodMonths = 12 / k;
  const whole = Math.floor(months / periodMonths + 1e-9);
  const rest = months - whole * periodMonths;
  let bal = amount * Math.pow(1 + r / k, whole);
  if (rest > 1e-9) bal *= 1 + r * rest / 12;
  const interest = bal - amount;
  return { interest, balance: bal, paidOut: 0, perPayment: amount * r / k, payments: whole + (rest > 1e-9 ? 1 : 0), effectiveRatePct: (interest / amount) / (months / 12) * 100 };
}

// Extra income tax and Medicare levy on the interest at your marginal rate, for an Australian resident
// with otherIncome in the same year (TAX_YEAR rates from calc.js). Ignores offsets and the Medicare levy
// surcharge, and counts all the interest in one income year.
export function taxOnInterest(interest, otherIncome) {
  const base = incomeTax(otherIncome) + medicareLevy(otherIncome);
  const tax = incomeTax(otherIncome + interest) + medicareLevy(otherIncome + interest) - base;
  return { tax, afterTax: interest - tax, ratePct: interest > 0 ? (tax / interest) * 100 : 0 };
}

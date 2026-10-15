// Refinancing (switching) a home loan: repayments, interest, switching costs and break-even.
// Pure maths, no rates to look up. Interest is charged monthly at the annual rate ÷ 12 and repayments are
// monthly, as in js/calc.js. Assumes both rates stay the same for the whole term.
//
// Approach checked 15 Oct 2026 against Moneysmart's mortgage switching calculator
// (https://moneysmart.gov.au/home-loans/mortgage-switching-calculator, updated 18 June 2026), which
// works out whether switching saves money and how long it takes to recover the cost. Two differences:
// Moneysmart always adds up-front switching costs to the new loan, while here you choose (paid up front by
// default); and the break-even month here counts both the cash you save and the gap between the two loan
// balances, so a longer new term can't look like a saving just because repayments are lower.
//
// Switching cost defaults on the page (all editable):
// - Government fees: NSW 2026-27, $182.73 (incl GST) each to register a Mortgage and a Discharge of Mortgage.
//   Source: NSW Land Registry Services "2026/27 Fees Update", issued June 2026
//   (https://nswlrs.com.au/assets/f/1129775276948026/x/5fed3e7cd6/2026-2027_nsw-lrs-fees_final.pdf), checked 15 Oct 2026.
//   Other states charge different amounts.
// - Lender discharge fee $350: ESTIMATE, not official. Mozo (June 2026) reports CBA, NAB and Westpac charge $350
//   (https://www.mozo.com.au/home-loans/resources/guides/how-to-discharge-your-mortgage-and-what-it-means).
// - New loan fees: $0 by default (varies by lender; the user enters their own).
import { repayment } from './calc.js';
import { cardPayoff } from './loans.js';

export const REFINANCE_CHECKED = '15 Oct 2026';
export const NSW_REGISTRATION_FEE = 182.73; // NSW LRS 2026-27, Mortgage or Discharge of Mortgage, incl GST
export const DISCHARGE_FEE_ESTIMATE = 350; // estimate (Mozo, June 2026), not an official figure

// Month-by-month balances of a monthly P&I loan with a fixed repayment. bal[m] is the balance after m
// repayments (bal[0] = principal); pay[m] is the m-th repayment (the last one is just what's left).
function run(principal, ratePct, months) {
  const i = ratePct / 100 / 12;
  const p = repayment(principal, ratePct, months / 12, 12);
  const bal = [principal], pay = [0];
  let b = principal;
  for (let m = 1; m <= months && b > 0.005; m++) {
    const charge = b * i;
    const x = m === months ? b + charge : Math.min(p, b + charge);
    b = b + charge - x;
    bal.push(Math.max(0, b)); pay.push(x);
  }
  return { repayment: p, bal, pay, total: pay.reduce((s, x) => s + x, 0) };
}

/**
 * balance, currentRatePct, yearsLeft: your loan now. newRatePct, newYears: the new loan.
 * costs: total switching costs (discharge + new loan fees + government fees). cashback: paid to you at settlement.
 * addCosts: true adds the costs to the new loan (Moneysmart's assumption) instead of paying them up front.
 */
export function refinance({ balance, currentRatePct, yearsLeft, newRatePct, newYears = yearsLeft, costs = 0, cashback = 0, addCosts = false }) {
  const n1 = Math.round(yearsLeft * 12), n2 = Math.round(newYears * 12);
  const newPrincipal = balance + (addCosts ? costs : 0);
  const upfront = addCosts ? 0 : costs;
  const cur = run(balance, currentRatePct, n1);
  const nu = run(newPrincipal, newRatePct, n2);
  const interestCurrent = cur.total - balance;
  const interestNew = nu.total - newPrincipal;
  const interestSaved = interestCurrent - interestNew;
  const netSaving = cur.total - nu.total - upfront + cashback;

  // How far ahead you are after m months: cash saved so far (repayments, cashback less up-front costs)
  // plus how much less you owe on the new loan than you would on the old one.
  const months = Math.max(n1, n2);
  const position = [];
  let cash = cashback - upfront;
  for (let m = 0; m <= months; m++) {
    if (m > 0) cash += (cur.pay[m] || 0) - (nu.pay[m] || 0);
    position.push(cash + (cur.bal[m] ?? 0) - (nu.bal[m] ?? 0));
  }
  // Break-even: the first month from which you stay ahead to the end. null if switching never pays.
  let breakEven = null;
  if (position[months] >= -0.005) {
    breakEven = 0;
    for (let m = months; m >= 0; m--) if (position[m] < -0.005) { breakEven = m + 1; break; }
  }

  // Keep paying your current repayment on the new loan: how much sooner it's paid off.
  // Only meaningful when the current repayment is above the new loan's minimum (not with a shorter term).
  const keep = cardPayoff({ balance: newPrincipal, ratePct: newRatePct, payment: cur.repayment });
  const keepResult = keep.paysOff && cur.repayment > nu.repayment + 0.005 ? {
    months: keep.months,
    monthsSaved: n1 - keep.months,
    interest: keep.interest,
    interestSaved: interestCurrent - keep.interest,
    netSaving: cur.total - keep.totalPaid - upfront + cashback,
  } : null;

  // Year-by-year positions for a table.
  const years = [];
  for (let y = 1; y <= Math.ceil(months / 12); y++) {
    const m = Math.min(y * 12, months);
    years.push({ year: y, currentBalance: cur.bal[m] ?? 0, newBalance: nu.bal[m] ?? 0, ahead: position[m] });
  }

  return {
    currentRepayment: cur.repayment,
    newRepayment: nu.repayment,
    monthlySaving: cur.repayment - nu.repayment,
    interestCurrent, interestNew, interestSaved,
    costs, cashback, upfront, newPrincipal,
    netSaving, breakEven, months, keep: keepResult, years,
  };
}

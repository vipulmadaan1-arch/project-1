// Rent vs buy: compares your net wealth after N years if you buy a home with a loan, or rent and invest
// the money you would have spent on buying. Pure functions, no DOM.
//
// Official rates used:
//   - Stamp (transfer) duty: js/duty.js, checked against each state revenue office on 15 Oct 2026.
//   - Loan repayments: the standard amortisation formula (js/calc.js repayment), the same approach as
//     Moneysmart's mortgage calculator (https://moneysmart.gov.au/home-loans/mortgage-calculator).
//   - Capital gains tax: a main residence is generally exempt from CGT (ATO, "Your main residence (home)",
//     https://www.ato.gov.au/individuals-and-families/investments-and-assets/capital-gains-tax/property-and-capital-gains-tax/your-main-residence-home),
//     so the home's growth is not taxed here. The renter's investments are taxed with a simple "tax drag" input.
// Everything else (prices, rates, growth, returns, ongoing costs) is an ASSUMPTION the user enters. No hidden
// numbers: every figure the model uses is a parameter of rentVsBuy() and an input on the page.
import { repayment } from './calc.js';
import { stampDuty } from './duty.js';

export const RENTBUY_CHECKED = '15 Oct 2026';

// Annual rate → equivalent monthly compounding rate.
const monthly = (pct) => Math.pow(1 + pct / 100, 1 / 12) - 1;

/**
 * Model, month by month:
 *  Buyer pays the deposit + stamp duty + other upfront costs on day one, then each month the P&I loan
 *  repayment (until the loan is paid off) plus ownership costs: council rates, strata and insurance (growing
 *  with costInflationPct each year) and maintenance (maintenancePct of the home's current value a year).
 *  Renter pays rent (growing by rentGrowthPct each year) and on day one invests what the buyer spent upfront.
 *  Whoever has the lower housing cost that month invests the difference. Investments earn returnPct a year,
 *  with taxDragPct of each year's earnings lost to tax (0 = pre-tax returns).
 *  Buyer's net wealth = home value × (1 − sellingCostPct) − loan balance + buyer's investments.
 *  Renter's net wealth = renter's investments.
 */
export function rentVsBuy({
  price, deposit, state = 'NSW', firstHome = false, home = true, otherUpfront = 0,
  ratePct, termYears = 30,
  councilRates = 0, strata = 0, insurance = 0, maintenancePct = 0, costInflationPct = 0,
  growthPct = 0, weeklyRent, rentGrowthPct = 0,
  returnPct = 0, taxDragPct = 0, sellingCostPct = 0, years = 10,
}) {
  const duty = stampDuty({ state, value: price, home, firstHome });
  const dutyAmt = duty ? duty.total : 0;
  const loan = Math.max(0, price - deposit);
  const upfront = deposit + dutyAmt + otherUpfront;
  const pay = loan > 0 ? repayment(loan, ratePct, termYears, 12) : 0;
  const iLoan = ratePct / 100 / 12;
  const gHome = monthly(growthPct);
  const gInvest = monthly(returnPct * (1 - taxDragPct / 100));
  const loanMonths = Math.round(termYears * 12);

  let value = price, balance = loan, renterInv = upfront, buyerInv = 0;
  let fixedCosts = councilRates + strata + insurance; // a year, in today's dollars
  let rentMonth = weeklyRent * 52 / 12;
  const rows = [];
  let totalRent = 0, totalOwnCosts = 0, totalRepay = 0, totalInterest = 0;
  for (let y = 1; y <= years; y++) {
    let yrRent = 0, yrOwn = 0, yrRepay = 0;
    for (let m = 0; m < 12; m++) {
      const month = (y - 1) * 12 + m;
      // Investments grow first (balances held over the month), then this month's savings go in.
      renterInv *= 1 + gInvest;
      buyerInv *= 1 + gInvest;
      let rep = 0;
      if (balance > 0.005 && month < loanMonths) {
        const interest = balance * iLoan;
        rep = Math.min(pay, balance + interest);
        balance = balance + interest - rep;
        totalInterest += interest;
      }
      const own = fixedCosts / 12 + value * maintenancePct / 100 / 12;
      const buyerOut = rep + own;
      const renterOut = rentMonth;
      if (buyerOut > renterOut) renterInv += buyerOut - renterOut;
      else buyerInv += renterOut - buyerOut;
      value *= 1 + gHome;
      yrRent += renterOut; yrOwn += own; yrRepay += rep;
    }
    totalRent += yrRent; totalOwnCosts += yrOwn; totalRepay += yrRepay;
    const equity = value * (1 - sellingCostPct / 100) - Math.max(0, balance);
    const buy = equity + buyerInv;
    const rent = renterInv;
    rows.push({ year: y, value, balance: Math.max(0, balance), equity, buyerInv, buy, rent, diff: buy - rent, rentPaid: yrRent, ownCosts: yrOwn, repayments: yrRepay });
    rentMonth *= 1 + rentGrowthPct / 100;
    fixedCosts *= 1 + costInflationPct / 100;
  }
  const last = rows[rows.length - 1];
  // Break-even: the first year buying is ahead and stays ahead to the end of the comparison.
  let breakEven = null;
  for (let k = rows.length - 1; k >= 0 && rows[k].diff >= 0; k--) breakEven = rows[k].year;
  return {
    duty: dutyAmt, dutyNote: duty ? duty.note : '', dutyEstimate: !!duty?.estimate,
    loan, upfront, repayment: pay, firstMonthRent: weeklyRent * 52 / 12,
    firstMonthOwnCosts: (councilRates + strata + insurance) / 12 + price * maintenancePct / 100 / 12,
    rows, buy: last.buy, rent: last.rent, diff: last.diff, breakEven,
    totals: { rent: totalRent, ownCosts: totalOwnCosts, repayments: totalRepay, interest: totalInterest },
  };
}

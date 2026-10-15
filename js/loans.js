// Personal and car loans, credit card payoff and savings goals. Pure maths: no rates to look up.
// Modelled on the ASIC Moneysmart calculators (moneysmart.gov.au), with their assumptions noted below.
import { FREQ, repayment } from './calc.js';

export { FREQ };

// Rounds away floating-point noise before taking a ceiling, so 36.0000000001 periods counts as 36.
const ceilish = (x) => Math.ceil(x - 1e-9);

// ---------- Car and personal loans ----------
// Repayment for a loan with a balloon (residual) left owing at the end. The balloon is paid as a
// lump sum with the last regular repayment; until then you pay interest on it, so a bigger
// balloon means smaller repayments but more interest overall.
export function balloonRepayment(principal, ratePct, periods, perYear, balloon = 0) {
  if (periods <= 0) return 0;
  const i = ratePct / 100 / perYear;
  if (i === 0) return (principal - balloon) / periods;
  return ((principal - balloon / Math.pow(1 + i, periods)) * i) / (1 - Math.pow(1 + i, -periods));
}

// Annual rate (nominal, like an advertised rate) that makes the cash you get equal the value of
// everything you pay back. With fees included this is the "true cost" of your loan, worked out the
// same way as a comparison rate but on your own figures. Solved by bisection.
export function trueRate(received, payment, periods, perYear, balloon = 0) {
  if (received <= 0 || periods <= 0) return NaN;
  const pv = (i) => {
    if (i === 0) return payment * periods + balloon;
    const d = Math.pow(1 + i, -periods);
    return (payment * (1 - d)) / i + balloon * d;
  };
  if (pv(0) <= received) return 0; // you pay back no more than you got
  let lo = 0, hi = 1;
  while (pv(hi) > received && hi < 1e6) hi *= 2;
  for (let k = 0; k < 200; k++) {
    const mid = (lo + hi) / 2;
    if (pv(mid) > received) lo = mid; else hi = mid;
  }
  return ((lo + hi) / 2) * perYear * 100;
}

// amount: what you borrow (the price less any deposit). months: loan term in months.
// upfrontFee: establishment fee; financeFee adds it to the loan (common), otherwise you pay it at the start.
// monthlyFee: account-keeping fee, charged every month of the term.
// balloon: lump sum owing at the end (a car loan residual), in dollars.
export function personalLoan({ amount, ratePct, months, frequency = 'monthly', upfrontFee = 0, financeFee = true, monthlyFee = 0, balloon = 0 }) {
  const perYear = FREQ[frequency];
  const periods = Math.max(1, Math.round((months / 12) * perYear));
  const principal = amount + (financeFee ? upfrontFee : 0);
  const pay = balloonRepayment(principal, ratePct, periods, perYear, balloon);
  const repaid = pay * periods + balloon;
  const interest = repaid - principal;
  const feePerPeriod = (monthlyFee * 12) / perYear;
  const fees = upfrontFee + monthlyFee * months;
  // Cash you actually get to spend: the amount, less the fee if you paid it out of pocket.
  const received = amount - (financeFee ? 0 : upfrontFee);
  return {
    periods, perYear, principal,
    repayment: pay,
    repaymentWithFees: pay + feePerPeriod,
    balloon,
    interest,
    fees,
    totalCost: interest + fees, // cost of credit: everything above the amount borrowed
    totalPaid: amount + interest + fees,
    trueRate: trueRate(received, pay + feePerPeriod, periods, perYear, balloon),
  };
}

// ---------- Credit cards ----------
// Interest is charged monthly at the annual rate ÷ 12 on the balance, then the repayment comes off.
// No new spending, cash advances or fees (as in Moneysmart's credit card calculator).
const MAX_MONTHS = 1200; // stop at 100 years and report "never"

// Fixed monthly repayment. Returns months to clear the card and total interest, or
// paysOff: false when the repayment doesn't cover the interest.
export function cardPayoff({ balance, ratePct, payment }) {
  const i = ratePct / 100 / 12;
  if (balance <= 0) return { paysOff: true, months: 0, interest: 0, totalPaid: 0, firstInterest: 0 };
  const firstInterest = balance * i;
  if (payment <= firstInterest + 1e-9) return { paysOff: false, reason: 'interest', months: Infinity, interest: Infinity, totalPaid: Infinity, firstInterest };
  let bal = balance, interest = 0, paid = 0, months = 0;
  while (bal > 0.005 && months < MAX_MONTHS) {
    const charge = bal * i;
    interest += charge;
    bal += charge;
    const p = Math.min(payment, bal);
    paid += p;
    bal -= p;
    months++;
  }
  if (bal > 0.005) return { paysOff: false, reason: 'too-long', months: Infinity, interest: Infinity, totalPaid: Infinity, firstInterest };
  return { paysOff: true, months, interest, totalPaid: paid, firstInterest };
}

// Monthly repayment needed to clear the card in a set number of months.
export function cardPaymentFor({ balance, ratePct, months }) {
  const payment = repayment(balance, ratePct, months / 12, 12);
  return { payment, ...cardPayoff({ balance, ratePct, payment }) };
}

// Paying only the minimum each month: the higher of minPct of the closing balance (after
// interest) and minFloor dollars, or the whole balance if that's less. Moneysmart's calculator
// offers 2% to 5% and $5 to $30; many Australian cards use 2% or 2.5% with a $25 or $30 floor.
export function cardMinimumOnly({ balance, ratePct, minPct = 2, minFloor = 25 }) {
  const i = ratePct / 100 / 12;
  let bal = balance, interest = 0, paid = 0, months = 0, firstPayment = 0;
  while (bal > 0.005 && months < MAX_MONTHS) {
    const charge = bal * i;
    interest += charge;
    bal += charge;
    const p = Math.min(bal, Math.max((bal * minPct) / 100, minFloor));
    if (months === 0) firstPayment = p;
    if (p <= charge + 1e-9 && p < bal) return { paysOff: false, reason: 'interest', months: Infinity, interest: Infinity, totalPaid: Infinity, firstPayment };
    paid += p;
    bal -= p;
    months++;
  }
  if (bal > 0.005) return { paysOff: false, reason: 'too-long', months: Infinity, interest: Infinity, totalPaid: Infinity, firstPayment };
  return { paysOff: true, months, interest, totalPaid: paid, firstPayment };
}

// ---------- Savings goals ----------
// As in Moneysmart's savings goals calculator, deposits are made at the start of each period and
// interest is reinvested. Interest compounds at the chosen frequency; each deposit period earns the
// equivalent effective rate. Ignores tax, fees and inflation.
export function periodRate(ratePct, compoundsPerYear, depositsPerYear) {
  return Math.pow(1 + ratePct / 100 / compoundsPerYear, compoundsPerYear / depositsPerYear) - 1;
}

// Balance at the end of n deposit periods (n deposits made, one at the start of each period).
export function savingsBalance({ start, deposit, g, n }) {
  if (g === 0) return start + deposit * n;
  const f = Math.pow(1 + g, n);
  return start * f + (deposit * (1 + g) * (f - 1)) / g;
}

const MAX_PERIODS_YEARS = 100;

// Regular deposit → how many deposit periods until the balance reaches the target.
export function savingsTime({ target, start = 0, ratePct, compoundsPerYear = 12, deposit, depositsPerYear = 12 }) {
  const g = periodRate(ratePct, compoundsPerYear, depositsPerYear);
  const done = (n) => {
    const balance = savingsBalance({ start, deposit, g, n });
    const deposited = start + deposit * n;
    return { reached: true, periods: n, years: n / depositsPerYear, balance, deposited, interest: balance - deposited };
  };
  if (start >= target) return done(0);
  let n;
  if (g === 0) {
    if (deposit <= 0) return { reached: false };
    n = ceilish((target - start) / deposit);
  } else {
    const k = (deposit * (1 + g)) / g;
    if (start + k <= 0) return { reached: false };
    n = ceilish(Math.log((target + k) / (start + k)) / Math.log(1 + g));
  }
  if (!Number.isFinite(n) || n > MAX_PERIODS_YEARS * depositsPerYear) return { reached: false };
  return done(Math.max(n, 1));
}

// Target number of deposit periods → regular deposit needed.
export function savingsDeposit({ target, start = 0, ratePct, compoundsPerYear = 12, depositsPerYear = 12, periods }) {
  const g = periodRate(ratePct, compoundsPerYear, depositsPerYear);
  const grown = g === 0 ? start : start * Math.pow(1 + g, periods);
  let deposit;
  if (grown >= target) deposit = 0;
  else if (g === 0) deposit = (target - start) / periods;
  else deposit = ((target - grown) * g) / ((1 + g) * (Math.pow(1 + g, periods) - 1));
  const balance = savingsBalance({ start, deposit, g, n: periods });
  const deposited = start + deposit * periods;
  return { deposit, periods, balance, deposited, interest: balance - deposited, startEnough: deposit === 0 };
}

// Whole deposit periods from one date to another (dates as 'YYYY-MM-DD' or Date, compared in UTC).
// Monthly counts calendar months, so 15 Oct to 15 Nov is one deposit.
export function periodsUntil(from, to, depositsPerYear) {
  const d = (x) => (x instanceof Date ? Date.UTC(x.getFullYear(), x.getMonth(), x.getDate()) : Date.parse(`${x}T00:00:00Z`));
  const a = d(from), b = d(to);
  if (!(b > a)) return 0;
  if (depositsPerYear === 12) {
    const A = new Date(a), B = new Date(b);
    return (B.getUTCFullYear() - A.getUTCFullYear()) * 12 + B.getUTCMonth() - A.getUTCMonth() - (B.getUTCDate() < A.getUTCDate() ? 1 : 0);
  }
  return Math.floor((b - a) / 86400000 / (364 / depositsPerYear));
}

// "2 years 3 months", "11 months", "1 year".
export function describeMonths(months) {
  const m = Math.round(months);
  const y = Math.floor(m / 12), r = m % 12;
  const parts = [];
  if (y) parts.push(`${y} year${y === 1 ? '' : 's'}`);
  if (r || !y) parts.push(`${r} month${r === 1 ? '' : 's'}`);
  return parts.join(' ');
}

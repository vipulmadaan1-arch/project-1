// HECS/HELP debt payoff projection.
//
// Compulsory repayments use helpFor() from js/rates.js: the 2026-27 (CURRENT_YEAR) marginal system.
//   Source: ATO "Study and training loan minimum repayment income and rates" (updated 13 Oct 2026),
//   https://www.ato.gov.au/tax-rates-and-codes/study-and-training-loan-minimum-repayment-income-and-rates
// Indexation is applied on 1 June each year at the lower of CPI and WPI. 2.8% was applied on
// 1 June 2026. Sources: https://www.ato.gov.au/tax-rates-and-codes/study-and-training-support-loans-indexation-rates
// (updated 17 Apr 2026) and https://www.studyassist.gov.au/news/indexation-28-will-be-applied-your-study-loan-1-june-2026
//
// ESTIMATES AND SIMPLIFYING ASSUMPTIONS (not official figures):
// - Future indexation rates are unknown; the caller passes an assumed rate (the page defaults to 2.8%,
//   the 2026 rate).
// - Repayment thresholds are held at 2026-27 values. In reality they are indexed each year, so
//   later repayments will usually be a little lower than shown.
// - Repayment income is treated as salary only and grows by a constant pay rise each year.
// - Timeline per income year (1 July to 30 June), starting with 2026-27:
//     voluntary repayments are made before 1 June, indexation is applied on 1 June to what is left,
//     then the compulsory repayment for that income year comes off when the tax return is assessed
//     (shortly after 30 June). The starting balance is today's balance, already indexed on 1 June 2026.
import { CURRENT_YEAR, helpFor } from './rates.js';

export const HELP_INDEXATION_2026 = 2.8; // % applied 1 June 2026 (ATO, Study Assist)
export const MAX_YEARS = 60;

const FIRST_YEAR = Number(CURRENT_YEAR.slice(0, 4)); // 2026 → income year 2026-27
const yearLabel = (y) => `${y}-${String((y + 1) % 100).padStart(2, '0')}`;

// debt: balance now. income: 2026-27 repayment income. payRisePct: yearly income growth.
// indexationPct: assumed indexation each 1 June. voluntary: voluntary repayment per year.
// Anything that isn't a number gives null.
export function helpPayoff({ debt, income, payRisePct = 0, indexationPct = HELP_INDEXATION_2026, voluntary = 0 }) {
  if (![debt, income, payRisePct, indexationPct, voluntary].every(Number.isFinite)) return null;
  let balance = Math.max(0, debt);
  let inc = Math.max(0, income);
  const rows = [];
  let totalCompulsory = 0, totalVoluntary = 0, totalIndexation = 0;
  for (let i = 0; i < MAX_YEARS && balance > 0.005; i++) {
    const vol = Math.min(voluntary, balance);
    balance -= vol;
    const indexation = balance * indexationPct / 100;
    balance += indexation;
    const compulsory = Math.min(helpFor(CURRENT_YEAR, inc), balance);
    balance -= compulsory;
    if (balance < 0.005) balance = 0;
    totalCompulsory += compulsory; totalVoluntary += vol; totalIndexation += indexation;
    rows.push({ year: FIRST_YEAR + i, label: yearLabel(FIRST_YEAR + i), income: inc, voluntary: vol, indexation, compulsory, balance });
    inc *= 1 + payRisePct / 100;
  }
  const repaid = balance === 0;
  return {
    repaid,
    years: repaid ? rows.length : null,
    // The income year whose tax assessment clears the debt.
    finalYear: repaid && rows.length ? rows[rows.length - 1].label : null,
    totalCompulsory, totalVoluntary, totalIndexation,
    totalRepaid: totalCompulsory + totalVoluntary,
    remaining: balance,
    rows,
  };
}

// Compares a plan with voluntary repayments against compulsory repayments only.
export function voluntaryEffect(inputs) {
  const base = helpPayoff({ ...inputs, voluntary: 0 });
  const plan = helpPayoff(inputs);
  if (!base || !plan) return null;
  return {
    base, plan,
    yearsSaved: base.repaid && plan.repaid ? base.years - plan.years : null,
    indexationSaved: base.totalIndexation - plan.totalIndexation,
  };
}

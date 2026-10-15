// Medicare levy surcharge (MLS) for people without private hospital cover. Pure functions, no DOM.
// Source (verified 15 Oct 2026): ATO "Medicare levy surcharge income, thresholds and rates", last updated
// 22 June 2026, https://www.ato.gov.au/individuals-and-families/medicare-and-private-health-insurance/medicare-levy-surcharge/medicare-levy-surcharge-income-thresholds-and-rates
export const MLS_CHECKED = '15 Oct 2026';
export const MLS_YEAR = '2026-27';
export const MLS_SOURCE = 'https://www.ato.gov.au/individuals-and-families/medicare-and-private-health-insurance/medicare-levy-surcharge/medicare-levy-surcharge-income-thresholds-and-rates';

// 2026-27 tiers (ATO, verified). Each tier starts $1 above the previous tier's upper limit.
// Base tier: singles $105,000 or less, families $210,000 or less: 0%.
// Tier 1: $105,001–$123,000 / $210,001–$246,000: 1%.
// Tier 2: $123,001–$164,000 / $246,001–$328,000: 1.25%.
// Tier 3: $164,001+ / $328,001+: 1.5%.
export const MLS_TIERS = {
  single: [105000, 123000, 164000],
  family: [210000, 246000, 328000],
};
export const MLS_RATES = [0, 0.01, 0.0125, 0.015];
// "The family income threshold is increased by $1,500 for each MLS dependent child after the first child." (ATO)
export const CHILD_INCREMENT = 1500;
// "If you had a spouse for the full year, you do not have to pay the MLS if ... your own income for MLS purposes
// was $27,222 or less." ATO "Paying the Medicare levy surcharge" (last updated 5 May 2026) still shows the 2025-26
// figure: https://www.ato.gov.au/individuals-and-families/medicare-and-private-health-insurance/medicare-levy-surcharge/paying-the-medicare-levy-surcharge
// ESTIMATE for 2026-27: the 2026-27 figure isn't published yet, so the 2025-26 one is used and the page says so.
export const SPOUSE_EXEMPT = 27222;
// Appropriate hospital cover has an excess of $750 or less (singles) or $1,500 or less (couples and families).
// ATO "Appropriate level of private patient hospital cover", last updated 30 April 2026 (verified).
export const MAX_EXCESS = { single: 750, family: 1500 };

// Income for MLS purposes (ATO): taxable income + reportable fringe benefits + total net investment losses
// (net financial investment loss + net rental property loss) + reportable super contributions (reportable
// employer super contributions, such as salary sacrifice, + deductible personal contributions). With a spouse,
// the two incomes are combined.
export function mlsIncome({ taxable = 0, fringe = 0, investmentLosses = 0, reportableSuper = 0 } = {}) {
  return Math.max(0, taxable) + Math.max(0, fringe) + Math.max(0, investmentLosses) + Math.max(0, reportableSuper);
}

// The tier limits for a single person or a family (a couple, or a single parent with a dependent child).
export function thresholds(family = false, children = 0) {
  if (!family) return MLS_TIERS.single;
  const extra = Math.max(0, Math.floor(children) - 1) * CHILD_INCREMENT;
  return MLS_TIERS.family.map((t) => t + extra);
}

// Tier 0 (base) to 3 for an income for MLS purposes. Thresholds are "or less", so the limit itself is in the lower tier.
export function tierFor(income, family = false, children = 0) {
  const t = thresholds(family, children);
  return t.filter((limit) => income > limit).length;
}

// MLS for one person for a full year without appropriate hospital cover.
// o.own: this person's income parts ({ taxable, fringe, investmentLosses, reportableSuper }).
// o.family: has a spouse or dependent child; o.spouseIncome: the spouse's income for MLS purposes (0 for a single parent).
// o.children: number of MLS dependent children. o.days: days in the year without cover (default 365).
// The rate is set by the (combined) income for MLS purposes, but the surcharge is charged only on the person's
// own taxable income plus reportable fringe benefits (ATO worked example: Tom, $90,000 + $27,000 RFB = $1,170).
// A person with a spouse whose own income for MLS purposes is $27,222 or less doesn't pay MLS (see SPOUSE_EXEMPT).
// o.premium: the annual premium of a hospital policy, to compare with the surcharge.
export function medicareLevySurcharge({ own = {}, family = false, spouse = false, spouseIncome = 0, children = 0, days = 365, premium = 0 } = {}) {
  const ownIncome = mlsIncome(own);
  const hasSpouse = family && spouse;
  const income = ownIncome + (hasSpouse ? Math.max(0, spouseIncome) : 0);
  const tier = tierFor(income, family, children);
  const rate = MLS_RATES[tier];
  // The surcharge is levied on taxable income + reportable fringe benefits (not investment losses or super).
  const base = Math.max(0, own.taxable || 0) + Math.max(0, own.fringe || 0);
  const lowIncome = hasSpouse && tier > 0 && ownIncome <= SPOUSE_EXEMPT;
  const share = Math.min(365, Math.max(0, days)) / 365;
  const surcharge = lowIncome ? 0 : Math.round(base * rate * share * 100) / 100;
  const t = thresholds(family, children);
  return {
    ownIncome, income, tier, rate, base, surcharge, lowIncome, thresholds: t,
    nextLimit: tier < 3 ? t[tier] : null, // income for MLS purposes at the top of the current tier
    freeLimit: t[0],
    premium, difference: surcharge - premium, // positive: the cover costs less than the surcharge
  };
}

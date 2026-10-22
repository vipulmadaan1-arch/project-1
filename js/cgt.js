// Capital gains tax for an individual selling one asset. Pure functions, no DOM.
// Law: ITAA 1997 as amended by the Treasury Laws Amendment (Tax Reform No. 1) Act 2026 (No. 49 of 2026,
// assented 26 June 2026). For CGT events from 1 July 2027 the 50% discount is replaced by cost base
// indexation (s114-1, s960-275) and a 30% minimum tax on post-1 July 2027 gains (Division 119).
// Assets held across 1 July 2027 are split: the gain to that date keeps the 50% discount (Subdivision 112-E).
import { taxFor, taxAndMedicareFor } from './rates.js';

export const CGT_CHECKED = '15 Oct 2026';
export const REFORM_START = '2027-07-01';

// ABS CPI, All groups, weighted average of the 8 capital cities, quarterly, Sep 2025 = 100 (the reference
// period s960-280(3) requires after the ABS re-referencing). Only expenditure from 1 July 2027 is indexed,
// so every factor today uses projected quarters: the latest published index grown at the assumed inflation rate.
export const CPI = { '2025-3': 99.73, '2025-4': 100.32, '2026-1': 101.70, '2026-2': 102.31 };
const LAST_CPI = Object.keys(CPI).at(-1);

// Resident tax rates and Medicare levy from js/rates.js, by the income year of the sale: 16% second bracket to
// 2025-26, 15% in 2026-27, 14% from 2027-28 (legislated). Sales before 1 July 2025 use the 2025-26 rates and
// later years use 2027-28's, the earliest and latest years this calculator models (a simplification for older
// sales). Medicare levy low-income thresholds are 2025-26's for every year (2026-27 and 2027-28 carry them
// forward as an estimate in js/rates.js).
export const ratesYear = (fyStart) => (fyStart <= 2025 ? '2025-26' : fyStart === 2026 ? '2026-27' : '2027-28');
export function basicTax(income, fyStart) { return taxFor(ratesYear(fyStart), income); }
// Tax payable after the low income tax offset, plus the Medicare levy.
export const totalTax = (income, fyStart) => taxAndMedicareFor(ratesYear(fyStart), income);

// ---------- Dates ----------
const D = (s) => new Date(`${s}T00:00:00Z`);
const DAY = 86400000;
const quarterOf = (s) => { const d = D(s); return [d.getUTCFullYear(), Math.floor(d.getUTCMonth() / 3) + 1]; };
const qIndex = ([y, q]) => y * 4 + (q - 1);
export const fyOf = (s) => { const d = D(s); return d.getUTCMonth() >= 6 ? d.getUTCFullYear() : d.getUTCFullYear() - 1; };
// Held at least 12 months: the sale is after the first anniversary of the purchase (the days of buying and selling
// don't count). Bought on 29 February, the anniversary is 28 February the next year, not 1 March.
export function heldTwelveMonths(bought, sold) {
  const b = D(bought);
  const y = b.getUTCFullYear() + 1, m = b.getUTCMonth();
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const a = new Date(Date.UTC(y, m, Math.min(b.getUTCDate(), lastDay)));
  return D(sold) > a;
}

// CPI for a quarter: published where available, otherwise projected from the latest at `inflation` a year.
export function cpiFor(dateStr, inflation) {
  const [y, q] = quarterOf(dateStr);
  const key = `${y}-${q}`;
  if (CPI[key]) return { value: CPI[key], projected: false };
  const [ly, lq] = LAST_CPI.split('-').map(Number);
  const ahead = qIndex([y, q]) - qIndex([ly, lq]);
  return { value: CPI[LAST_CPI] * (1 + inflation) ** (ahead / 4), projected: true };
}
// s960-275: index for the quarter of the sale ÷ index for the quarter the cost was incurred, to 3 decimal places.
export function indexationFactor(fromDate, toDate, inflation) {
  const a = cpiFor(fromDate, inflation), b = cpiFor(toDate, inflation);
  return { factor: Math.round((b.value / a.value) * 1000) / 1000, projected: a.projected || b.projected };
}

// Treasury's draft apportioning method (for real property and assets without a market value): growth is
// assumed to compound daily at one rate over the whole holding period. Returns the deemed 30 June 2027 value.
export function apportionedValue({ price, proceeds, bought, sold }) {
  const days = Math.round((D(sold) - D(bought)) / DAY) + 1;
  const preDays = Math.round((D('2027-06-30') - D(bought)) / DAY) + 1;
  const daily = (proceeds / price) ** (1 / days) - 1;
  return price * (1 + daily) ** preDays;
}

// 30% minimum tax (s119-10): 30% of the post-1 July 2027 gain, less the basic tax (before offsets, without the
// Medicare levy) that the gain adds. Rounded down to the dollar, never negative.
export function minimumTax(taxableIncome, minGain, fyStart) {
  if (minGain <= 0) return 0;
  const onGain = basicTax(taxableIncome, fyStart) - basicTax(Math.max(0, taxableIncome - minGain), fyStart);
  return Math.max(0, Math.floor(Math.round((0.3 * minGain - onGain) * 100) / 100)); // cents first, so float noise can't drop a dollar
}

/**
 * @param {object} o
 * @param {'shares'|'property'|'newbuild'|'home'} o.asset
 * @param {number} o.price purchase price; o.buyCosts stamp duty, legal and other costs of buying (and improvements)
 * @param {number} o.proceeds sale price; o.sellCosts agent, legal and other costs of selling
 * @param {string} o.bought, o.sold ISO dates (contract dates)
 * @param {number} o.income other taxable income in the year of sale
 * @param {number} [o.startValue] market value at 30 June 2027, for assets held across 1 July 2027
 * @param {boolean} [o.foreign] foreign or temporary resident; [o.support] received income support in the year
 * @param {number} [o.priorLosses] net capital losses carried forward; [o.inflation] assumed CPI a year
 */
export function capitalGainsTax(o) {
  const { asset, price, buyCosts = 0, proceeds, sellCosts = 0, bought, sold, income = 0, foreign = false,
    support = false, priorLosses = 0, inflation = 0.025 } = o;
  if (!(price > 0) || !(proceeds >= 0) || !bought || !sold || D(sold) < D(bought)) return null;
  const fy = fyOf(sold);
  const cost = price + buyCosts;
  const gross = proceeds - sellCosts - cost; // gain or loss before any discount or indexation
  const held12 = heldTwelveMonths(bought, sold);
  const afterReform = D(sold) >= D(REFORM_START);
  const boughtBefore = D(bought) < D(REFORM_START);
  const preCgt = D(bought) < D('1985-09-20');
  const base = { fy, gross, held12, afterReform, cost, notes: [] };

  if (asset === 'home') {
    return { ...base, rules: 'exempt', exempt: true, netGain: 0, tax: 0, minTax: 0, total: 0, notes: ['Your main residence is exempt from CGT, before and after 1 July 2027. Renting it out, a home office used for business, or land over 2 hectares can make part of the gain taxable.'] };
  }

  // Tax the year's net capital gain at marginal rates, then add any minimum tax top-up.
  const settle = (r) => {
    const taxable = Math.max(0, r.netGain);
    const tax = totalTax(income + taxable, fy) - totalTax(income, fy);
    const minTax = foreign || support ? 0 : minimumTax(income + taxable, r.minGain || 0, fy);
    return { ...base, ...r, tax, minTax, total: tax + minTax };
  };
  const discount = held12 && !foreign ? 0.5 : 0;

  // ---- Before 1 July 2027: today's rules ----
  if (!afterReform) {
    if (preCgt) return settle({ rules: 'current', netGain: 0, notes: ['Bought before 20 September 1985: the gain is exempt (pre-CGT asset).'] });
    let gain = gross;
    if (gain <= 0) return settle({ rules: 'current', netGain: 0, loss: -gain });
    const used = Math.min(gain, priorLosses); gain -= used;
    const notes = [];
    if (foreign) notes.push('Foreign and temporary residents generally get no 50% discount on gains after 8 May 2012.');
    if (!held12) notes.push('Held 12 months or less, so no 50% discount.');
    if (D(bought) < D('1999-09-21')) notes.push('Bought before 21 September 1999: you can choose frozen indexation instead of the 50% discount. This uses the discount.');
    return settle({ rules: 'current', discountedPart: gain * discount, netGain: gain * (1 - discount), lossesUsed: used, notes });
  }

  // ---- From 1 July 2027 ----
  const notes = [];
  // Foreign and temporary residents: no discount and no indexation on the post-2027 regime (tranche 1).
  if (foreign) {
    let gain = gross;
    if (gain <= 0) return settle({ rules: 'new', netGain: 0, loss: -gain });
    const used = Math.min(gain, priorLosses);
    notes.push('Foreign and temporary residents get no discount and no indexation. Proposed changes would pro-rate indexation by days resident.');
    return settle({ rules: 'new', netGain: gain - used, lossesUsed: used, notes });
  }

  // Split for assets bought before 1 July 2027: deemed sale and reacquisition at the 30 June 2027 value.
  let startValue = null, apportioned = false;
  if (boughtBefore && asset !== 'newbuild') {
    if (o.startValue > 0) startValue = o.startValue;
    else { startValue = apportionedValue({ price, proceeds, bought, sold }); apportioned = true; }
  }
  const startCost = startValue ?? cost; // cost base from which post-2027 gains are measured
  // Only expenditure from 1 July 2027 is indexed, so a new build bought earlier is indexed from then.
  const indexFrom = startValue != null || D(bought) < D(REFORM_START) ? REFORM_START : bought;
  const idx = held12 ? indexationFactor(indexFrom, sold, inflation) : { factor: 1, projected: false };
  // Indexation can reduce a gain to nil but never creates or increases a loss (s100-40(2)).
  const postRaw = proceeds - sellCosts - startCost;
  const postIndexed = proceeds - sellCosts - startCost * idx.factor;
  let post = postRaw <= 0 ? postRaw : Math.max(0, postIndexed);
  let pre = startValue != null ? (preCgt ? 0 : startValue - cost) : 0;

  // Losses (s102-5): current-year losses first reduce deferred (pre-2027) gains, then post-2027 gains;
  // then carried-forward losses in the same order. The 50% discount applies to what's left of the deferred gain.
  let lossPool = (pre < 0 ? -pre : 0) + (post < 0 ? -post : 0);
  pre = Math.max(0, pre); post = Math.max(0, post);
  const take = (amt) => { const t = Math.min(amt, lossPool); lossPool -= t; return amt - t; };
  pre = take(pre); post = take(post);
  const carriedLoss = lossPool;
  let priorLeft = priorLosses;
  const takePrior = (amt) => { const t = Math.min(amt, priorLeft); priorLeft -= t; return amt - t; };
  pre = takePrior(pre); post = takePrior(post);
  const lossesUsed = priorLosses - priorLeft;

  const indexed = { rules: 'new', startValue, apportioned, factor: idx.factor, projected: idx.projected,
    deferredGain: pre, postGain: post, discountedPart: pre * discount, netGain: pre * (1 - discount) + post,
    minGain: post, loss: carriedLoss, lossesUsed, notes };
  if (preCgt && startValue != null) notes.push('Pre-CGT asset: the gain to 30 June 2027 stays exempt; growth from 1 July 2027 is taxed.');
  if (!held12) notes.push('Held 12 months or less, so no discount and no indexation.');
  if (support) notes.push('Income support recipients are exempt from the 30% minimum tax.');
  if (apportioned) notes.push('The 30 June 2027 value was estimated with Treasury\'s draft apportioning method (growth spread evenly, compounding daily). For listed shares use the actual market value.');

  // New builds: choose the 50% discount (outside the minimum tax) or indexation, whichever costs less.
  if (asset === 'newbuild') {
    const withIndex = settle(indexed);
    let g = gross;
    const loss = g < 0 ? -g : 0;
    g = Math.max(0, g); const used = Math.min(g, priorLosses); g -= used;
    const withDiscount = settle({ rules: 'new', choice: 'discount', discountedPart: g * discount, netGain: g * (1 - discount), minGain: 0, loss, lossesUsed: used, factor: idx.factor, projected: idx.projected, notes: [...notes] });
    const best = withDiscount.total <= withIndex.total ? withDiscount : { ...withIndex, choice: 'indexation' };
    best.notes.push(`New builds can choose the 50% discount or indexation. ${best.choice === 'discount' ? 'The 50% discount' : 'Indexation'} costs less here. The definition of a new build is in a bill before Parliament (Tax Reform No. 3, introduced 14 October 2026) and could still change.`);
    return { ...best, alternative: best === withDiscount ? withIndex.total : withDiscount.total };
  }
  return settle(indexed);
}

// What the same sale would cost if the 50% discount still applied to the whole gain, at the same year's rates.
export function oldRulesTax(o) {
  const { asset, price, buyCosts = 0, proceeds, sellCosts = 0, bought, sold, income = 0, foreign = false, priorLosses = 0 } = o;
  const gain = proceeds - sellCosts - price - buyCosts;
  if (asset === 'home' || gain <= 0 || D(bought) < D('1985-09-20')) return 0;
  const disc = heldTwelveMonths(bought, sold) && !foreign ? 0.5 : 0;
  const taxable = Math.max(0, gain - priorLosses) * (1 - disc);
  const fy = fyOf(sold);
  return totalTax(income + taxable, fy) - totalTax(income, fy);
}

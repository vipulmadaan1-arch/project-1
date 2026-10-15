// Stamp (transfer) duty for every Australian state and territory: residential purchases.
// Rates checked against each revenue office on 15 Oct 2026. Pure functions, no DOM.
// Where a rule comes from independent calculators rather than the revenue office, the result
// is flagged `estimate: true` and the page says so.
import { nswTransferDuty, nswFhbConcessionDuty, NSW_FHB, NSW_FOREIGN_SURCHARGE } from './calc.js';

export const DUTY_CHECKED = '15 Oct 2026';

// Foreign purchasers. The calculator assumes every buyer is foreign. With a joint purchase, each state
// charges the surcharge only on the foreign buyer's share, and concessions can apply to the rest.
// `foreignFhb: false` = first home relief needs at least one Australian citizen or permanent resident.

// A bracket table: [upTo, base, from, ratePer100]. `part` = the revenue office charges
// "for every $100 or part of $100", so the amount over the threshold rounds up to the next $100.
function scale(table, value, { part = false } = {}) {
  const [, base, from, rate] = table.find(([upTo]) => value <= upTo);
  const over = Math.max(0, value - from);
  const units = part ? Math.ceil(over / 100) : over / 100;
  return base + units * rate;
}

// ---------- Rate tables ----------
const VIC_GENERAL = (v) => {
  if (v <= 25000) return v * 0.014;
  if (v <= 130000) return 350 + (v - 25000) * 0.024;
  if (v <= 960000) return 2870 + (v - 130000) * 0.06;
  if (v <= 2000000) return v * 0.055;
  return 110000 + (v - 2000000) * 0.065;
};
const VIC_PPR = (v) => { // home you'll live in, up to $550,000
  if (v <= 25000) return v * 0.014;
  if (v <= 130000) return 350 + (v - 25000) * 0.024;
  if (v <= 440000) return 2870 + (v - 130000) * 0.05;
  return 18370 + (v - 440000) * 0.06;
};
const QLD_GENERAL = [[5000, 0, 0, 0], [75000, 0, 5000, 1.5], [540000, 1050, 75000, 3.5], [1000000, 17325, 540000, 4.5], [Infinity, 38025, 1000000, 5.75]];
const QLD_HOME = [[350000, 0, 0, 1], [540000, 3500, 350000, 3.5], [1000000, 10150, 540000, 4.5], [Infinity, 30850, 1000000, 5.75]];
const SA = [[12000, 0, 0, 1], [30000, 120, 12000, 2], [50000, 480, 30000, 3], [100000, 1080, 50000, 3.5], [200000, 2830, 100000, 4], [250000, 6830, 200000, 4.25], [300000, 8955, 250000, 4.75], [500000, 11330, 300000, 5], [Infinity, 21330, 500000, 5.5]];
const WA_GENERAL = [[120000, 0, 0, 1.9], [150000, 2280, 120000, 2.85], [360000, 3135, 150000, 3.8], [725000, 11115, 360000, 4.75], [Infinity, 28453, 725000, 5.15]];
const WA_CONCESSIONAL = [[120000, 0, 0, 1.5], [200000, 1800, 120000, 4.04]]; // home, value up to $200,000
const TAS = [[25000, 50, 3000, 1.75], [75000, 435, 25000, 2.25], [200000, 1560, 75000, 3.5], [375000, 5935, 200000, 4], [725000, 12935, 375000, 4.25], [Infinity, 27810, 725000, 4.5]];
const ACT_OWNER = [[260000, 0, 0, 0.28], [300000, 728, 260000, 2.2], [500000, 1608, 300000, 3.4], [750000, 8408, 500000, 4.32], [1000000, 19208, 750000, 5.9], [1455000, 33958, 1000000, 6.4]];
const ACT_INVESTOR = [[200000, 0, 0, 1.2], [300000, 2400, 200000, 2.2], [500000, 4600, 300000, 3.4], [750000, 11400, 500000, 4.32], [1000000, 22200, 750000, 5.9], [1455000, 36950, 1000000, 6.4]];

// Queensland first home concession: deducted from the home concession amount (contracts from 9 June 2024).
function qldFirstHomeDeduction(v) {
  if (v < 710000) return 17350;
  if (v >= 800000) return 0;
  return 17350 - 1735 * (Math.floor((v - 700000) / 10000));
}

// ---------- States ----------
export const STATES = [
  {
    code: 'NSW', name: 'New South Wales', foreign: NSW_FOREIGN_SURCHARGE, foreignFhb: false, office: 'Revenue NSW',
    source: 'https://www.revenue.nsw.gov.au/taxes-duties-levies-royalties/transfer-duty/understanding-transfer-duty/calculate-transfer-duty',
    calc({ value, firstHome, home }) {
      const general = nswTransferDuty(value);
      if (firstHome && home) {
        if (value <= NSW_FHB.exemptUpTo) return { duty: 0, general, note: 'First home buyer exemption: homes valued at $800,000 or less pay no duty.' };
        if (value < NSW_FHB.concessionUpTo) return { duty: nswFhbConcessionDuty(value), general, estimate: true, note: 'First home buyer concession for homes $800,000 to $1 million. The formula comes from independent calculators, not Revenue NSW.' };
        return { duty: general, general, note: 'First home buyer relief ends at $1 million, so full duty applies.' };
      }
      return { duty: general, general };
    },
  },
  {
    code: 'VIC', name: 'Victoria', foreign: 0.08, foreignFhb: false, office: 'State Revenue Office Victoria',
    source: 'https://www.sro.vic.gov.au/buying-property/land-transfer-stamp-duty/understanding-land-transfer-stamp-duty',
    calc({ value, firstHome, home }) {
      const general = Math.round(VIC_GENERAL(value));
      const base = home && value <= 550000 ? Math.round(VIC_PPR(value)) : general;
      const baseNote = home && value <= 550000 ? 'Principal place of residence rate applies (homes up to $550,000).' : '';
      if (firstHome && home) {
        if (value <= 600000) return { duty: 0, general, note: 'First home buyer exemption: homes up to $600,000 pay no duty.' };
        if (value <= 750000) return { duty: Math.floor(base * (value - 600000) / 150000), general, estimate: true, note: 'First home buyer concession for homes $600,001 to $750,000, tapering from no duty at $600,000 to full duty at $750,000. The taper formula comes from independent calculators, not the SRO.' };
      }
      return { duty: base, general, note: baseNote };
    },
  },
  {
    code: 'QLD', name: 'Queensland', foreign: 0.08, foreignFhb: false, office: 'Queensland Revenue Office',
    source: 'https://qro.qld.gov.au/duties/transfer-duty/calculate/rates/',
    calc({ value, firstHome, home, newHome, foreign }) {
      const general = Math.round(scale(QLD_GENERAL, value, { part: true }));
      // From 1 August 2026 the home concession also needs a citizen, permanent resident or specified foreign retiree.
      if (home && foreign) return { duty: general, general, note: 'From 1 August 2026 foreign buyers can\'t get the Queensland home concession, unless they are a specified foreign retiree (visa 405 or 410).' };
      if (!home) return { duty: general, general };
      const homeRate = Math.round(scale(QLD_HOME, value, { part: true }));
      if (firstHome && newHome) return { duty: 0, general, note: 'First home (new home) concession: no duty on a new home, with no price cap (contracts from 1 May 2025).' };
      if (firstHome) {
        const duty = Math.max(0, homeRate - qldFirstHomeDeduction(value));
        return { duty, general, note: value < 800000 ? 'Home concession rate, less the first home concession for homes under $800,000.' : 'Home concession rate. The first home concession ends at $800,000.' };
      }
      return { duty: homeRate, general, note: 'Home concession rate for a home you will live in.' };
    },
  },
  {
    code: 'SA', name: 'South Australia', foreign: 0.07, foreignFhb: false, office: 'RevenueSA',
    source: 'https://revenuesa.sa.gov.au/stamp-duty/rate-of-stamp-duty',
    calc({ value, firstHome, home, newHome }) {
      const general = Math.round(scale(SA, value, { part: true }) * 100) / 100; // RevenueSA quotes cents: $235,000 → $8,317.50
      if (firstHome && home && newHome) return { duty: 0, general, note: 'First home buyer relief: no stamp duty on a new home, with no price cap.' };
      if (firstHome && home) return { duty: general, general, note: 'First home buyer relief only applies to new homes and vacant land in South Australia.' };
      return { duty: general, general };
    },
  },
  {
    code: 'WA', name: 'Western Australia', foreign: 0.07, foreignFhb: false, office: 'RevenueWA',
    source: 'https://www.wa.gov.au/organisation/department-of-treasury-and-finance/transfer-duty-assessment',
    calc({ value, firstHome, home }) {
      const general = Math.round(scale(WA_GENERAL, value, { part: true }));
      if (firstHome && home) {
        if (value <= 600000) return { duty: 0, general, note: 'First home owner rate: no duty on homes up to $600,000 (from 7 May 2026).' };
        if (value <= 800000) return { duty: Math.round(Math.ceil((value - 600000) / 100) * 16.15), general, note: 'First home owner rate for homes $600,001 to $800,000.' };
      }
      if (home && value <= 200000) return { duty: Math.round(scale(WA_CONCESSIONAL, value, { part: true })), general, note: 'Concessional rate for a home valued at $200,000 or less.' };
      return { duty: general, general };
    },
  },
  {
    code: 'TAS', name: 'Tasmania', foreign: 0.08, foreignFhb: false, office: 'State Revenue Office Tasmania',
    source: 'https://www.sro.tas.gov.au/property-transfer-duties/rates-of-duty',
    calc({ value, firstHome, home }) {
      const general = value <= 3000 ? 50 : Math.round(scale(TAS, value, { part: true }));
      if (firstHome && home) return { duty: general, general, note: 'The first home buyer exemption for established homes ended for transfers settling after 30 June 2026.' };
      return { duty: general, general };
    },
  },
  {
    code: 'ACT', name: 'Australian Capital Territory', foreign: 0, foreignFhb: true, office: 'ACT Revenue Office',
    source: 'https://www.revenue.act.gov.au/rates-and-property-charges/conveyance-duty-stamp-duty/conveyance-duty-for-non-commercial-property',
    calc({ value, firstHome, home, foreign }) {
      const investor = value > 1455000 ? value * 0.0454 : scale(ACT_INVESTOR, value, { part: true });
      const owner = value > 1455000 ? value * 0.0454 : scale(ACT_OWNER, value, { part: true });
      const general = Math.round(investor);
      if (firstHome && home) return { duty: 0, general, note: `Home Buyer Concession Scheme: no duty at any price from 1 July 2026 if no buyer has owned property anywhere in the last 5 years and one of you lives in it for a year.${foreign ? ' Its published rules don\'t require citizenship, but confirm with the ACT Revenue Office.' : ''}` };
      if (home) return { duty: Math.round(owner), general, note: 'Owner-occupier rate for a home you will live in.' };
      return { duty: general, general };
    },
  },
  {
    code: 'NT', name: 'Northern Territory', foreign: 0, foreignFhb: true, office: 'Territory Revenue Office',
    source: 'https://nt.gov.au/property/buying-and-selling-a-home/settle-the-sale/stamp-duty-buying-or-selling-a-home/conveyance-calculator',
    calc({ value, home, newHome }) {
      // Over $525,000: flat rates from NT Treasury Budget 2024-25, Budget Paper 2, Table 6.4
      // (4.95% under $3M, 5.75% to under $5M, 5.95% from $5M). Under $525,000: TRO formula (I-GEN-001).
      let duty;
      if (value <= 525000) { const V = value / 1000; duty = 0.06571441 * V * V + 15 * V; }
      else if (value < 3000000) duty = value * 0.0495;
      else duty = value * (value < 5000000 ? 0.0575 : 0.0595);
      const general = Math.round(duty);
      if (home && newHome) return { duty: 0, general, note: 'House and land package exemption: no duty on a new home bought from a building contractor in one contract, for contracts signed to 30 June 2027. No price cap; you don\'t need to be a first home buyer.' };
      return { duty: general, general, note: '' };
    },
  },
];

export function stampDuty({ state, value, home = true, firstHome = false, newHome = false, foreign = false }) {
  const s = STATES.find((x) => x.code === state);
  if (!s || !(value > 0)) return null;
  const fhbBlocked = foreign && firstHome && home && !s.foreignFhb;
  const r = s.calc({ value, home, firstHome: firstHome && home && !fhbBlocked, newHome: newHome && home, foreign });
  if (fhbBlocked) r.note = `First home relief in ${s.name} needs at least one buyer who is an Australian citizen or permanent resident. ${r.note || ''}`.trim();
  // The surcharge is on the full dutiable value, before any concession.
  const surcharge = foreign ? Math.round(value * s.foreign) : 0;
  return {
    state: s, duty: r.duty, general: r.general, saving: Math.max(0, r.general - r.duty),
    surcharge, total: r.duty + surcharge, note: r.note || '', estimate: !!r.estimate,
    foreignNote: !foreign ? '' : `${s.foreign ? '' : `${s.name} has no foreign purchaser duty surcharge. `}This assumes every buyer is foreign. Buying with an Australian citizen or permanent resident? The surcharge applies only to the foreign buyer's share, and concessions may apply to the rest.`,
  };
}

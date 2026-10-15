// Lenders mortgage insurance (LMI): an ESTIMATE of the premium, the state duty charged on it, and
// whether the Australian Government 5% Deposit Scheme could remove it. Pure functions, no DOM.
//
// ESTIMATE: LMI premiums are set by each insurer (Helia, QBE) and lender and are not published by any
// government body. The premium rates below are the full-doc table "used by one of our lenders" published by
// Home Loan Experts (https://www.homeloanexperts.com.au/lenders-mortgage-insurance/lmi-premium-rates,
// page updated 18 May 2026, read 15 Oct 2026). Real quotes vary by lender, insurer, borrower and property.
//
// Duty on the premium (official, checked 15 Oct 2026):
// - NSW: exempt for LMI premiums paid from 1 July 2017. Revenue NSW, Insurance exemptions:
//   https://www.revenue.nsw.gov.au/taxes-duties-levies-royalties/insurance-duty/exemptions
// - VIC: 10% of the premium. SRO Victoria, Insurance policies (current rates), updated 29 Sep 2026:
//   https://www.sro.vic.gov.au/about-us/rates-and-statistics/current-rates/insurance-policies-current-rates
//   (Ruling DA-068: the mortgage class is not "business insurance", so the falling business rate doesn't apply.)
// - QLD: 9% (class 1 and class 2 general insurance; class 2 includes a first home mortgage). QRO:
//   https://qro.qld.gov.au/duties/insurance-duty/rates/
// - SA: 11% of the premium; mortgage insurance appears in RevenueSA's apportionment schedule. RevenueSA:
//   https://revenuesa.sa.gov.au/stamp-duty-insurance/general-insurance-property-risk-inside-south-australia
// - WA: 10% (general insurance). WA Treasury, Overview of State Taxes and Royalties 2023-24, p.35:
//   https://www.wa.gov.au/system/files/2023-11/2023-24-overview-of-state-taxes-and-royalties.pdf
// - TAS: 10% (general insurance). SRO Tasmania, Rates of duty (published 5 Aug 2026):
//   https://www.sro.tas.gov.au/insurance-duty/rates-of-duty
// - ACT: nil (insurance duty abolished). Same WA Treasury interstate comparison.
// - NT: 10% (general insurance). Same WA Treasury interstate comparison.
//
// 5% Deposit Scheme (formerly the Home Guarantee Scheme), from 1 October 2025: no income caps, no place
// limits, minimum 5% deposit (2% for single parents), no LMI, location price caps. Price caps from
// https://firsthomebuyers.gov.au/australian-government-5-percent-deposit-scheme/property-price-caps (15 Oct 2026).

export const LMI_CHECKED = '15 Oct 2026';
export const LMI_SOURCE = 'https://www.homeloanexperts.com.au/lenders-mortgage-insurance/lmi-premium-rates';
export const SCHEME_URL = 'https://firsthomebuyers.gov.au/australian-government-5-percent-deposit-scheme';
export const SCHEME_CAPS_URL = 'https://firsthomebuyers.gov.au/australian-government-5-percent-deposit-scheme/property-price-caps';

// Loan size bands (upper limits) for the columns of the premium table.
export const LOAN_BANDS = [300000, 500000, 600000, 750000, 1000000];
// ESTIMATE. Rows: LVR band upper limit (%), then % of the loan for each loan band.
export const PREMIUM_TABLE = [
  [81, [0.475, 0.568, 0.904, 0.904, 0.913]],
  [82, [0.485, 0.568, 0.904, 0.904, 0.913]],
  [83, [0.596, 0.699, 0.932, 1.090, 1.109]],
  [84, [0.662, 0.829, 0.960, 1.090, 1.146]],
  [85, [0.727, 0.969, 1.165, 1.333, 1.407]],
  [86, [0.876, 1.081, 1.258, 1.407, 1.463]],
  [87, [0.932, 1.146, 1.407, 1.631, 1.733]],
  [88, [1.062, 1.305, 1.463, 1.631, 1.752]],
  [89, [1.295, 1.621, 1.948, 2.218, 2.395]],
  [90, [1.463, 1.873, 2.180, 2.367, 2.516]],
  [91, [2.013, 2.618, 3.513, 3.783, 3.820]],
  [92, [2.013, 2.674, 3.569, 3.867, 3.932]],
  [93, [2.330, 3.028, 3.802, 4.081, 4.156]],
  [94, [2.376, 3.028, 3.802, 4.286, 4.324]],
  [95, [2.609, 3.345, 3.998, 4.613, 4.603]],
];

export const LMI_DUTY = {
  NSW: { rate: 0, office: 'Revenue NSW', source: 'https://www.revenue.nsw.gov.au/taxes-duties-levies-royalties/insurance-duty/exemptions', note: 'NSW charges no duty on LMI premiums paid from 1 July 2017.' },
  VIC: { rate: 0.10, office: 'State Revenue Office Victoria', source: 'https://www.sro.vic.gov.au/about-us/rates-and-statistics/current-rates/insurance-policies-current-rates' },
  QLD: { rate: 0.09, office: 'Queensland Revenue Office', source: 'https://qro.qld.gov.au/duties/insurance-duty/rates/' },
  SA: { rate: 0.11, office: 'RevenueSA', source: 'https://revenuesa.sa.gov.au/stamp-duty-insurance/general-insurance-property-risk-inside-south-australia' },
  WA: { rate: 0.10, office: 'WA Department of Treasury', source: 'https://www.wa.gov.au/system/files/2023-11/2023-24-overview-of-state-taxes-and-royalties.pdf' },
  TAS: { rate: 0.10, office: 'State Revenue Office Tasmania', source: 'https://www.sro.tas.gov.au/insurance-duty/rates-of-duty' },
  ACT: { rate: 0, office: 'WA Department of Treasury (interstate comparison)', source: 'https://www.wa.gov.au/system/files/2023-11/2023-24-overview-of-state-taxes-and-royalties.pdf', note: 'The ACT has abolished duty on insurance.' },
  NT: { rate: 0.10, office: 'WA Department of Treasury (interstate comparison)', source: 'https://www.wa.gov.au/system/files/2023-11/2023-24-overview-of-state-taxes-and-royalties.pdf' },
};

// 5% Deposit Scheme price caps. `city` = capital city and regional centres (or the whole territory for the ACT).
export const SCHEME_CAPS = {
  NSW: { city: 1500000, other: 800000 },
  VIC: { city: 950000, other: 650000 },
  QLD: { city: 1000000, other: 700000 },
  WA: { city: 850000, other: 600000 },
  SA: { city: 900000, other: 500000 },
  TAS: { city: 700000, other: 550000 },
  ACT: { city: 1000000, other: 1000000 },
  NT: { city: 750000, other: 600000 },
};
export const SCHEME_MIN_DEPOSIT = 0.05;

// LVR as a percentage, rounded to 2 decimal places so 90% stays exactly 90.
export const lvr = (loan, value) => Math.round((loan / value) * 10000) / 100;

// Premium rate (% of the loan) from the table, or null when the LVR is above 95%.
export function premiumRate(loan, lvrPct) {
  if (lvrPct <= 80) return 0;
  const row = PREMIUM_TABLE.find(([upTo]) => lvrPct <= upTo);
  if (!row) return null;
  const col = LOAN_BANDS.findIndex((upTo) => loan <= upTo);
  return row[1][col === -1 ? LOAN_BANDS.length - 1 : col];
}

// Could the 5% Deposit Scheme replace LMI? `area`: 'city' (capital city or regional centre) or 'other'.
export function schemeCheck({ state, value, loan, firstHome, home = true, area = 'city' }) {
  const caps = SCHEME_CAPS[state];
  if (!caps) return null;
  const cap = caps[area] ?? caps.city;
  const deposit = value - loan;
  const reasons = [];
  if (!firstHome) reasons.push('it is for first home buyers (and single parents or guardians)');
  if (!home) reasons.push('you must live in the home');
  if (value > cap) reasons.push(`the price must be ${cap.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 })} or less in this area`);
  if (deposit < value * SCHEME_MIN_DEPOSIT - 0.005) reasons.push('you need at least a 5% deposit');
  return { eligible: reasons.length === 0, cap, reasons };
}

// Main calculation. Returns null for unusable input.
export function lmi({ state, value, loan, firstHome = false, home = true, area = 'city' }) {
  const duty = LMI_DUTY[state];
  if (!duty || !(value > 0) || !(loan >= 0) || loan > value * 2) return null;
  const ratio = lvr(loan, value);
  const scheme = schemeCheck({ state, value, loan, firstHome, home, area });
  const base = { state, lvr: ratio, loan, value, deposit: value - loan, duty, scheme, estimate: true };
  if (ratio <= 80) return { ...base, needed: false, rate: 0, premium: 0, dutyOnPremium: 0, total: 0 };
  const rate = premiumRate(loan, ratio);
  if (rate === null) return { ...base, needed: true, overMax: true, rate: null, premium: null, dutyOnPremium: null, total: null };
  const premium = Math.round(loan * rate) / 100;
  const dutyOnPremium = Math.round(premium * duty.rate * 100) / 100;
  return { ...base, needed: true, aboveTable: loan > LOAN_BANDS.at(-1), rate, premium, dutyOnPremium, total: Math.round((premium + dutyOnPremium) * 100) / 100 };
}

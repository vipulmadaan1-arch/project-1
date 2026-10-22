// Upfront costs of buying a home: deposit, stamp duty, land titles registration fees, LMI and
// typical professional costs. Pure functions, no DOM.
import { stampDuty } from './duty.js';
import { lmi } from './lmi.js';

export const UPFRONT_CHECKED = '15 Oct 2026';

// Land titles registration fees for 2026-27, per state. `transfer(price)` registers the transfer of
// land into your name; `mortgage` registers the lender's mortgage. `estimate: true` = not confirmed
// against the land titles office's own schedule; the page says so. `null` = not found, so not included.
export const REGO = {
  // NSW Land Registry Services, 2026/27 Fees Update (issued June 2026): Transfer $182.73, Mortgage $182.73.
  // https://nswlrs.com.au/assets/f/1129775276948026/x/5fed3e7cd6/2026-2027_nsw-lrs-fees_final.pdf
  NSW: {
    office: 'NSW Land Registry Services', source: 'https://nswlrs.com.au/assets/f/1129775276948026/x/5fed3e7cd6/2026-2027_nsw-lrs-fees_final.pdf',
    transfer: () => 182.73, mortgage: 182.73,
  },
  // ESTIMATE. Land Services Victoria publishes 2026-27 fees only as a Word document and calculator
  // (https://www.land.vic.gov.au/land-registration/fees-guides-and-forms/2026-27-fees). Formula: $104.30 +
  // $2.34 per $1,000 (or part) of the price, capped at $3,614.30 (the $2.34 rate and $3,510 ad valorem cap
  // are in the REIV's Feb 2026 submission on Victoria's land registry fee review; the $104.30 base and
  // $129.20 electronic mortgage fee are inferred from Delora's 2026 Victorian worked example:
  // https://delora.ai/buying/prepare-financially/buying-costs, $1,742.30 on $700,000).
  VIC: {
    office: 'Land Services Victoria', source: 'https://www.land.vic.gov.au/land-registration/fees-guides-and-forms/2026-27-fees',
    transfer: (p) => Math.min(104.30 + 2.34 * Math.ceil(p / 1000), 104.30 + 3510), mortgage: 129.20, estimate: true,
  },
  // Titles Queensland FY2026/27 fees: any other instrument (incl. mortgage) $248.04; a transfer pays the
  // same lodgement fee plus $46.56 for each $10,000 or part over $180,000.
  // https://www.titlesqld.com.au/wp-content/uploads/2026/05/Titles-Registry-Fees_FY-2026-to-2027.pdf
  QLD: {
    office: 'Titles Queensland', source: 'https://www.titlesqld.com.au/wp-content/uploads/2026/05/Titles-Registry-Fees_FY-2026-to-2027.pdf',
    transfer: (p) => 248.04 + 46.56 * Math.max(0, Math.ceil((p - 180000) / 10000)), mortgage: 248.04,
  },
  // Land Services SA, Transfer Registration Fees as at 1 July 2026 (ad valorem table): $204 to $5,000,
  // $228 to $20,000, $251 to $40,000, $353 to $50,000, then $105 more per $10,000 or part.
  // https://www.landservices.com.au/our-resources/industry-ad-valorem-fees-2026-27
  // Mortgage $204: ESTIMATE from OzCalc (https://ozcalc.com.au/stamp-duty-calculator-sa), not checked
  // against Land Services SA's Document Lodgement Fees 2026-27.
  SA: {
    office: 'Land Services SA', source: 'https://www.landservices.com.au/our-resources/industry-ad-valorem-fees-2026-27',
    transfer: (p) => (p <= 5000 ? 204 : p <= 20000 ? 228 : p <= 40000 ? 251 : 353 + 105 * Math.max(0, Math.ceil((p - 50000) / 10000))),
    mortgage: 204, mortgageEstimate: true,
  },
  // Landgate, Land transaction fees (from 1 July 2026): Mortgage $225.10.
  // https://www.landgate.wa.gov.au/land-and-property/land-transactions-hub/land-transaction-fees
  // Transfer: ESTIMATE. Landgate only publishes a calculator. OzCalc's capture of it
  // (https://ozcalc.com.au/stamp-duty-calculator-wa): $225.10 to $85,000, $255.10 at $200,000, then $20 per
  // $100,000 or part. The $85,001–$200,000 steps are assumed ($235.10 to $120,000).
  WA: {
    office: 'Landgate', source: 'https://www.landgate.wa.gov.au/land-and-property/land-transactions-hub/land-transaction-fees',
    transfer: (p) => (p <= 85000 ? 225.10 : p <= 120000 ? 235.10 : 255.10 + 20 * Math.max(0, Math.ceil((p - 200000) / 100000))),
    mortgage: 225.10, transferEstimate: true,
  },
  // Land Titles Office Tasmania, brief schedule of fees from 1 July 2026: Transfer $256.76, Mortgage $167.58.
  // https://nre.tas.gov.au/Documents/2026-2027%20Brief%20Fee%20Schedule.pdf
  TAS: {
    office: 'Land Titles Office Tasmania', source: 'https://nre.tas.gov.au/Documents/2026-2027%20Brief%20Fee%20Schedule.pdf',
    transfer: () => 256.76, mortgage: 167.58,
  },
  // Access Canberra, land title fees current as at 1 July 2026: 052 Transfer $496, 026 Mortgage $184.
  // https://www.accesscanberra.act.gov.au/building-and-property/land-title-lodgement-registration-and-search-forms-related-fees
  ACT: {
    office: 'Access Canberra', source: 'https://www.accesscanberra.act.gov.au/building-and-property/land-title-lodgement-registration-and-search-forms-related-fees',
    transfer: () => 496, mortgage: 184,
  },
  // NT Land Titles Office (pages dated 1 July 2026, checked 22 Oct 2026): "Fee: A $181 fee applies" to transfer land
  // and to lodge a mortgage. https://nt.gov.au/property/land-titles-office/transfer-your-land and
  // https://nt.gov.au/property/land-titles-office/lodge-a-mortgage-or-discharge-of-mortgage
  NT: { office: 'Land Titles Office NT', source: 'https://nt.gov.au/property/land-titles-office/transfer-your-land', transfer: () => 181, mortgage: 181 },
};

// Typical costs: ESTIMATES only, editable on the page. Ranges from Mozo's 2026 conveyancing guide
// (https://www.mozo.com.au/home-loans/resources/guides/conveyancing: conveyancer $500–$3,000 plus $300–$800
// disbursements) and Delora's 2026 Victorian buying costs (https://delora.ai/buying/prepare-financially/buying-costs:
// building and pest $400–$900, loan application and valuation $0–$900).
export const TYPICAL = { legal: 1800, inspection: 600, loanFee: 400 };

const cents = (n) => Math.round(n * 100) / 100;

export function registrationFees(state, price, { borrowing = true } = {}) {
  const r = REGO[state];
  if (!r || !(price > 0)) return null;
  const transfer = r.transfer ? cents(r.transfer(price)) : null;
  const mortgage = borrowing && r.mortgage != null ? r.mortgage : borrowing ? null : 0;
  return {
    transfer, mortgage, office: r.office, source: r.source, missing: transfer === null || mortgage === null,
    estimate: !!(r.estimate || r.transferEstimate || (borrowing && r.mortgageEstimate)),
  };
}

// All upfront cash. `lmiToLoan`: add LMI to the loan instead of paying it in cash.
// `scheme`: buying with the 5% Deposit Scheme (no LMI, if eligible).
export function upfrontCosts({
  state, price, deposit, home = true, firstHome = false, newHome = false, area = 'city',
  legal = TYPICAL.legal, inspection = TYPICAL.inspection, loanFee = TYPICAL.loanFee, other = 0,
  lmiToLoan = false, scheme = false,
}) {
  if (!(price > 0) || !(deposit >= 0) || deposit > price) return null;
  const loan = price - deposit;
  const duty = stampDuty({ state, value: price, home, firstHome, newHome });
  const rego = registrationFees(state, price, { borrowing: loan > 0 });
  if (!duty || !rego) return null;
  const l = lmi({ state, value: price, loan, firstHome, home, area });
  const schemeUsed = scheme && l.needed && l.scheme.eligible;
  const lmiCost = !l.needed || schemeUsed ? 0 : l.total;
  const lmiCash = lmiToLoan ? 0 : lmiCost;
  const items = [
    { key: 'duty', label: 'Stamp duty', amount: duty.total },
    { key: 'transfer', label: 'Transfer registration fee', amount: rego.transfer ?? 0, missing: rego.transfer === null },
    { key: 'mortgage', label: 'Mortgage registration fee', amount: rego.mortgage ?? 0, missing: rego.mortgage === null },
    { key: 'lmi', label: schemeUsed ? 'LMI (none with the 5% Deposit Scheme)' : lmiToLoan && lmiCost ? 'LMI (added to the loan, not paid in cash)' : 'Lenders mortgage insurance (estimate)', amount: lmiCash, estimate: true },
    { key: 'legal', label: 'Conveyancing and legal', amount: legal, estimate: true },
    { key: 'inspection', label: 'Building and pest inspection', amount: inspection, estimate: true },
    { key: 'loanFee', label: 'Loan application fee', amount: loan > 0 ? loanFee : 0, estimate: true },
    { key: 'other', label: 'Other costs', amount: other },
  ];
  const costs = cents(items.reduce((s, i) => s + (i.amount || 0), 0));
  return {
    loan, lvr: l.lvr, duty, rego, lmi: l, lmiCost, lmiCash, schemeUsed, items, costs,
    cash: cents(deposit + costs), loanWithLmi: cents(loan + (lmiToLoan ? lmiCost : 0)),
  };
}

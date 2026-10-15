// Motor vehicle (stamp) duty on registering or transferring a private passenger car, for every
// Australian state and territory. Pure functions, no DOM.
//
// Every rate below was read from the official revenue office or transport department page on
// 15 Oct 2026 (source URLs are on each state). Nothing in this file is an estimate. Where a state's
// rules are too detailed to model, the common case is used and `notes` says what's left out.
//
// Scope: passenger cars and SUVs (light vehicles under 4.5 tonnes, up to 8 or 9 seats). Not covered:
// utes, vans and other commercial vehicles (SA and VIC charge them less), motorcycles, heavy vehicles,
// VIC primary producer cars, TAS manufacturer's fleet discounts, and exemptions (gifts between spouses,
// deceased estates, disability, veterans, dealers and so on).

export const MOTOR_DUTY_CHECKED = '15 Oct 2026';

// Fuel types, as the calculator asks for them.
export const FUELS = {
  petrol: 'Petrol, diesel or LPG',
  hybrid: 'Hybrid (not plug-in)',
  phev: 'Plug-in hybrid',
  ev: 'Fully electric or hydrogen',
};

// Whole cents, so "per $100 or part" rounding isn't thrown off by floating point.
const cents = (v) => Math.round(v * 100);
// Number of $step blocks in v, counting a part block as a whole one ("per $100, or part").
const blocks = (v, step) => Math.ceil(cents(v) / (step * 100));
// Number of $step blocks in the amount over `from`.
const blocksOver = (v, from, step) => Math.max(0, Math.ceil((cents(v) - from * 100) / (step * 100)));
// rate × blocks, to the cent (rates like $8.40 or $2.67 aren't whole dollars).
const times = (n, rate) => Math.round(n * Math.round(rate * 100)) / 100;
const money = (n) => `$${n.toLocaleString('en-AU', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;

// ---------- NSW ----------
// Duties Act 1997 (NSW) s 265: $3 per $100, or part; passenger vehicles worth $45,000 or more pay
// $1,350 plus $5 per $100, or part, over $45,000.
// Source: https://www.revenue.nsw.gov.au/taxes-duties-levies-royalties/motor-vehicle-duty
// and https://legislation.nsw.gov.au/view/html/inforce/current/act-1997-123 (s 265)
export const NSW_THRESHOLD = 45000;
function nsw({ value }) {
  if (value < NSW_THRESHOLD) return { duty: times(blocks(value, 100), 3), basis: '$3 per $100 of value' };
  return { duty: 1350 + times(blocksOver(value, NSW_THRESHOLD, 100), 5), basis: '$1,350 plus $5 per $100 over $45,000' };
}

// ---------- VIC ----------
// Rates from 1 July 2026. Value rounded up to the next $200; one rate applies to the whole value.
// The standard-rate ceiling is the Commonwealth luxury car tax threshold for 2026-27 ($80,809).
// Green car = combined tailpipe CO2 of 120 g/km or less (includes pure electric cars): flat $8.40.
// Source: https://www.sro.vic.gov.au/about-us/rates-and-statistics/current-rates/motor-vehicle-duty-current-rates
// and https://www.sro.vic.gov.au/vehicles-and-car-parks/motor-vehicle-duty/understanding-motor-vehicle-duty
export const VIC_LUXURY_THRESHOLD = 80809;
export const VIC_GREEN_CO2 = 120;
const VIC_TIERS = [[VIC_LUXURY_THRESHOLD, 8.4], [100000, 10.4], [150000, 14], [Infinity, 18]];
function vic({ value, fuel, co2 }) {
  const green = fuel === 'ev' || (co2 != null && co2 <= VIC_GREEN_CO2);
  const rate = green ? 8.4 : VIC_TIERS.find(([upTo]) => value <= upTo)[1];
  const notes = [];
  if (!green && co2 == null) notes.push('If the car emits 120 g/km of CO2 or less, enter its emissions: green cars pay $8.40 per $200 at any price.');
  return {
    duty: times(blocks(value, 200), rate),
    basis: `${green ? 'Green car rate, ' : ''}$${rate.toFixed(2)} per $200 of value`,
    notes,
  };
}

// ---------- QLD ----------
// Light vehicles (contracts from 1 July 2018). Per $100, or part. Above $100,000 the higher rate
// applies to the whole value. Hybrids of any kind (including plug-in) and electric cars pay the lowest rate.
// Source: https://www.qld.gov.au/transport/registration/fees/duty/rates
export const QLD_HIGH_VALUE = 100000;
const QLD_RATES = { electric: [2, 4], '4': [3, 5], '6': [3.5, 5.5], '8': [4, 6] };
const QLD_LABEL = { electric: 'hybrid or electric', '4': '1 to 4 cylinders', '6': '5 or 6 cylinders', '8': '7 or more cylinders' };
function qld({ value, fuel, cylinders = '4' }) {
  const key = fuel === 'petrol' ? cylinders : 'electric';
  const rate = QLD_RATES[key][value > QLD_HIGH_VALUE ? 1 : 0];
  return { duty: times(blocks(value, 100), rate), basis: `$${rate.toFixed(2)} per $100 of value (${QLD_LABEL[key]}${value > QLD_HIGH_VALUE ? ', over $100,000' : ''})` };
}

// ---------- SA ----------
// Non-commercial vehicles. Per $100, or part. Minimum $5.
// Source: https://www.revenuesa.sa.gov.au/stamp-duty-vehicles/rates
function sa({ value }) {
  if (value <= 1000) return { duty: Math.max(5, blocks(value, 100)), basis: '$1 per $100 of value (minimum $5)' };
  if (value <= 2000) return { duty: 10 + times(blocksOver(value, 1000, 100), 2), basis: '$10 plus $2 per $100 over $1,000' };
  if (value <= 3000) return { duty: 30 + times(blocksOver(value, 2000, 100), 3), basis: '$30 plus $3 per $100 over $2,000' };
  return { duty: 60 + times(blocksOver(value, 3000, 100), 4), basis: '$60 plus $4 per $100 over $3,000' };
}

// ---------- WA ----------
// Non-heavy vehicles (4.5 tonnes or less), new and used. Between $25,000 and $50,000 the rate R%
// = 2.75 + (value − 25,000) ÷ 6,666.66, rounded to 2 decimal places, applied to the whole value.
// Source: https://www.wa.gov.au/organisation/department-of-treasury-and-finance/vehicle-licence-duty
export function waRate(value) {
  if (value <= 25000) return 2.75;
  if (value > 50000) return 6.5;
  return Math.round((2.75 + (value - 25000) / 6666.66) * 100) / 100;
}
function wa({ value }) {
  const r = waRate(value);
  return { duty: Math.round(cents(value) * r / 100) / 100, basis: `${r.toFixed(2)}% of value` };
}

// ---------- TAS ----------
// Passenger vehicles. Per $100, or part. The EV exemption ran 1 July 2021 to 30 June 2023 only.
// Source: https://www.sro.tas.gov.au/motor-vehicle-duty/rates-of-duty
// Worked examples: https://www.transport.tas.gov.au/fees_forms/registration_fees
function tas({ value }) {
  if (value <= 600) return { duty: 20, basis: 'Flat $20 (value $600 or less)' };
  if (value <= 35000) return { duty: times(blocks(value, 100), 3), basis: '$3 per $100 of value' };
  if (value <= 40000) return { duty: 1050 + times(blocksOver(value, 35000, 100), 11), basis: '$1,050 plus $11 per $100 over $35,000' };
  return { duty: times(blocks(value, 100), 4), basis: '$4 per $100 of value' };
}

// ---------- ACT ----------
// Passenger and light commercial vehicles, by combined tailpipe CO2 (g/km, from the Green Vehicle Guide).
// Rows: [base rate under $45,000, rate per $100 over $45,000 up to $80,000]. Above $80,000 every row
// pays $8 per $100 over $80,000. Per $100, or part. The scale is continuous, so the base at $45,000 is
// 450 × the first rate and the base at $80,000 adds 350 × the second.
// Sources: https://www.revenue.act.gov.au/motor-vehicle-duty
// Determination 2025 (1 Sep 2025 to 31 Jan 2027): https://legislation.act.gov.au/di/2025-152
// Determination 2026 (from 1 Feb 2027): https://www.legislation.act.gov.au/di/2026-154/
export const ACT_2027_START = '2027-02-01';
const ACT_NEW = {
  current: { AAA: [2.5, 4], AA: [2.67, 4.41], A: [2.84, 4.81], B: [3, 5.22], C: [3.17, 5.62], D: [4.53, 7.81], NR: [3.17, 5.62] },
  from2027: { AAA: [2.5, 4], AA: [2.67, 4.41], A: [2.84, 4.81], B: [3.25, 5.59], C: [3.72, 6.44], D: [4.83, 8], NR: [3.72, 6.44] },
};
const ACT_LABEL = { AAA: 'AAA (zero emissions)', AA: 'AA (1 to 65 g/km)', A: 'A (66 to 130 g/km)', B: 'B (131 to 175 g/km)', C: 'C (176 to 220 g/km)', D: 'D (221 g/km or more)', NR: 'non-rated' };
export function actCategory({ fuel, co2 }) {
  if (fuel === 'ev') return 'AAA';
  if (co2 == null) return 'NR';
  if (co2 <= 0) return 'AAA';
  if (co2 <= 65) return 'AA';
  if (co2 <= 130) return 'A';
  if (co2 <= 175) return 'B';
  if (co2 <= 220) return 'C';
  return 'D';
}
function act({ value, used, fuel, co2, actFrom2027 = false }) {
  const table = ACT_NEW[actFrom2027 ? 'from2027' : 'current'];
  const cat = actCategory({ fuel, co2 });
  // Used cars: zero-emission cars pay the AAA scale; everything else pays the non-rated scale.
  const row = used ? (cat === 'AAA' ? table.AAA : table.NR) : table[cat];
  const [r1, r2] = row;
  const base45 = 450 * r1;
  const base80 = base45 + 350 * r2;
  let duty;
  if (value < 45000) duty = times(blocks(value, 100), r1);
  else if (value <= 80000) duty = Math.round((base45 + times(blocksOver(value, 45000, 100), r2)) * 100) / 100;
  else duty = Math.round((base80 + times(blocksOver(value, 80000, 100), 8)) * 100) / 100;
  const label = used ? (cat === 'AAA' ? 'Used zero-emission car' : 'Used car (not zero-emission)') : `New car, emissions category ${ACT_LABEL[cat]}`;
  const notes = [`${label}, ${actFrom2027 ? 'rates from 1 February 2027' : 'rates to 31 January 2027'}.`];
  if (!used && cat === 'NR') notes.push('Enter the car\'s CO2 emissions for an exact rate. Without them it\'s treated as non-rated, which costs the same as category C.');
  return {
    duty,
    basis: value < 45000 ? `$${r1.toFixed(2)} per $100 of value` : value <= 80000 ? `${money(base45)} plus $${r2.toFixed(2)} per $100 over $45,000` : `${money(base80)} plus $8.00 per $100 over $80,000`,
    notes,
    category: cat,
  };
}

// ---------- NT ----------
// $3 per $100, or part. Battery electric and plug-in hybrid cars get a concession that removes duty on
// the first $50,000 (up to $1,500) for registrations from 1 July 2022 to 30 June 2027.
// Sources: https://nt.gov.au/driving/rego/getting-an-nt-registration/register-or-transfer-your-vehicle/mvr-duty-calculator
// https://nt.gov.au/driving/rego/getting-an-nt-registration/get-electric-vehicle-registration-and-stamp-duty-concessions
// Worked example ($42,990 → $1,290): https://treasury.nt.gov.au/pms/tro/information/I-SD-005.pdf
export const NT_EV_CONCESSION = 1500;
export const NT_EV_END = '30 June 2027';
function nt({ value, fuel }) {
  const full = times(blocks(value, 100), 3);
  if (fuel === 'ev' || fuel === 'phev') {
    const saving = Math.min(full, NT_EV_CONCESSION);
    return { duty: full - saving, saving, basis: '$3 per $100 of value, less the electric vehicle concession', notes: [`Plug-in electric cars pay no duty on the first $50,000 of value (registrations to ${NT_EV_END}).`] };
  }
  return { duty: full, basis: '$3 per $100 of value' };
}

// ---------- States ----------
export const STATES = [
  { code: 'NSW', roundTo: 100, name: 'New South Wales', office: 'Revenue NSW', calc: nsw,
    source: 'https://www.revenue.nsw.gov.au/taxes-duties-levies-royalties/motor-vehicle-duty',
    uses: [], note: 'New and used cars pay the same rate. Electric cars have paid full duty since 1 January 2024.' },
  { code: 'VIC', roundTo: 200, name: 'Victoria', office: 'State Revenue Office Victoria', calc: vic,
    source: 'https://www.sro.vic.gov.au/about-us/rates-and-statistics/current-rates/motor-vehicle-duty-current-rates',
    uses: ['fuel', 'co2'], note: 'New and used cars pay the same rate. Drive-away prices must be converted to a dutiable value first (see the SRO drive-away guide).' },
  { code: 'QLD', roundTo: 100, name: 'Queensland', office: 'Queensland Government', calc: qld,
    source: 'https://www.qld.gov.au/transport/registration/fees/duty/rates',
    uses: ['fuel', 'cylinders'], note: 'For a new car, duty is on the list price plus options, even if you negotiate a discount.' },
  { code: 'SA', roundTo: 100, name: 'South Australia', office: 'RevenueSA', calc: sa,
    source: 'https://www.revenuesa.sa.gov.au/stamp-duty-vehicles/rates',
    uses: [], note: 'New and used cars pay the same rate. Utes, vans and other commercial vehicles pay less (not covered here).' },
  { code: 'WA', roundTo: 0, name: 'Western Australia', office: 'RevenueWA', calc: wa,
    source: 'https://www.wa.gov.au/organisation/department-of-treasury-and-finance/vehicle-licence-duty',
    uses: [], note: 'For a new car, duty is on the manufacturer\'s retail price plus factory options, not dealer extras.' },
  { code: 'TAS', roundTo: 100, name: 'Tasmania', office: 'State Revenue Office Tasmania', calc: tas,
    source: 'https://www.sro.tas.gov.au/motor-vehicle-duty/rates-of-duty',
    uses: [], note: 'New and used cars pay the same rate. New cars bought with a manufacturer\'s fleet discount pay $3.50 per $100 instead (not covered here).' },
  { code: 'ACT', roundTo: 100, name: 'Australian Capital Territory', office: 'ACT Revenue Office', calc: act,
    source: 'https://www.revenue.act.gov.au/motor-vehicle-duty',
    uses: ['used', 'fuel', 'co2', 'actDate'], note: 'Rates depend on CO2 emissions for new cars, and on whether a used car is zero-emission.' },
  { code: 'NT', roundTo: 100, name: 'Northern Territory', office: 'Territory Revenue Office', calc: nt,
    source: 'https://nt.gov.au/driving/rego/getting-an-nt-registration/register-or-transfer-your-vehicle/mvr-duty-calculator',
    uses: ['fuel'], note: 'Duty is on the sale price including accessories and on-road costs.' },
];

// Main entry point. value = dutiable value in dollars (usually the higher of the price and market value,
// including GST). used = previously registered. fuel = a FUELS key. cylinders = '4' | '6' | '8' (QLD).
// co2 = combined tailpipe CO2 in g/km, or null if unknown (VIC, ACT). actFrom2027 = ACT registration on or
// after 1 February 2027.
export function motorDuty({ state, value, used = false, fuel = 'petrol', cylinders = '4', co2 = null, actFrom2027 = false }) {
  const s = STATES.find((x) => x.code === state);
  if (!s) throw new Error(`Unknown state ${state}`);
  if (!Number.isFinite(value) || value <= 0) return { state: s, duty: 0, saving: 0, chargedOn: 0, basis: '', notes: [], effectiveRate: 0 };
  const r = s.calc({ value, used, fuel, cylinders, co2, actFrom2027 });
  return {
    state: s,
    duty: r.duty,
    // The value duty is worked out on, after rounding up to the state's step ("per $100, or part").
    chargedOn: s.roundTo ? blocks(value, s.roundTo) * s.roundTo : value,
    saving: r.saving ?? 0,
    basis: r.basis,
    category: r.category,
    notes: [...(r.notes ?? []), s.note],
    effectiveRate: r.duty / value,
  };
}

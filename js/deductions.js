// Work-related deductions for employees: working from home (fixed rate method) and car expenses
// (cents per kilometre or logbook method), plus the tax a deduction saves. Pure functions, no DOM.
import { taxAndMedicareFor, ratesFor } from './rates.js';

export const DEDUCTIONS_CHECKED = '15 Oct 2026';

export const SOURCES = {
  wfh: 'https://www.ato.gov.au/individuals-and-families/income-deductions-offsets-and-records/deductions-you-can-claim/work-related-deductions/working-from-home-expenses/fixed-rate-method',
  car: 'https://www.ato.gov.au/individuals-and-families/income-deductions-offsets-and-records/deductions-you-can-claim/work-related-deductions/cars-transport-and-travel/motor-vehicle-and-car-expenses/expenses-for-a-car-you-own-or-lease/cents-per-kilometre-method',
  standard: 'https://www.ato.gov.au/individuals-and-families/income-deductions-offsets-and-records/deductions-you-can-claim/work-related-deductions/standard-deduction-for-work-related-expenses',
};

// Income years, keyed by label. For each year:
//   wfhRate  dollars per hour worked from home, fixed rate method.
//            Source: ATO "Fixed rate method" (last updated 8 June 2026): 70c for 2024-25 and 2025-26.
//            2026-27: the ATO hasn't published a rate as at 15 Oct 2026, so 70c is carried forward as an
//            ESTIMATE (wfhEstimate: true) and the page says so.
//   carRate  dollars per work-related km, cents per kilometre method.
//            Source: ATO "Cents per kilometre method" (last updated 12 Aug 2026): 88c for 2024-25 and
//            2025-26, 91c for 2026-27 (Cents per Kilometre Deduction Rate for Car Expenses 2026 Determination).
//   standard The standard deduction for work-related expenses: up to $1,000 from 2026-27, reduced dollar
//            for dollar by work-related expenses you claim (including working from home and car).
//            From js/rates.js (ATO "Standard deduction for work-related expenses", last updated 14 Sep 2026).
// Tax brackets and Medicare levy thresholds for each year also come from js/rates.js.
export const YEARS = {
  '2024-25': { wfhRate: 0.70, carRate: 0.88, standard: ratesFor('2024-25').standard },
  '2025-26': { wfhRate: 0.70, carRate: 0.88, standard: ratesFor('2025-26').standard },
  '2026-27': { wfhRate: 0.70, wfhEstimate: true, carRate: 0.91, standard: ratesFor('2026-27').standard },
};
export const DEFAULT_YEAR = '2026-27';
export const CAR_KM_CAP = 5000; // per car, per year (ATO cents per kilometre method)

// The ATO says to disregard (not round) cents on the final deduction.
const dollars = (n) => Math.floor(n + 1e-9);

export function wfhFixedRate(hours, year = DEFAULT_YEAR) {
  const y = YEARS[year];
  if (!y) throw new Error(`Unknown income year ${year}`);
  const h = Math.max(0, hours || 0);
  return { hours: h, rate: y.wfhRate, amount: h * y.wfhRate, estimate: !!y.wfhEstimate };
}

export function carCentsPerKm(km, year = DEFAULT_YEAR) {
  const y = YEARS[year];
  if (!y) throw new Error(`Unknown income year ${year}`);
  const entered = Math.max(0, km || 0);
  const claimed = Math.min(entered, CAR_KM_CAP);
  return { km: entered, claimedKm: claimed, capped: entered > CAR_KM_CAP, rate: y.carRate, amount: claimed * y.carRate };
}

// Logbook method: total car running costs (fuel, rego, insurance, servicing, interest, decline in value)
// × the business-use percentage from a valid 12-week logbook.
export function carLogbook(totalCosts, businessPct) {
  const pct = Math.min(100, Math.max(0, businessPct || 0));
  return { pct, amount: Math.max(0, totalCosts || 0) * pct / 100 };
}

// Resident tax for a year, after LITO, plus the Medicare levy, with that year's brackets and Medicare levy
// low-income thresholds (js/rates.js). LITO is unchanged across these years.
export function taxFor(income, year = DEFAULT_YEAR) {
  if (!YEARS[year]) throw new Error(`Unknown income year ${year}`);
  return taxAndMedicareFor(year, Math.max(0, income));
}

// Everything the page shows. taxableIncome is before these deductions.
export function workDeductions({ year = DEFAULT_YEAR, wfhHours = 0, carMethod = 'cents', km = 0, carCosts = 0, businessPct = 0, taxableIncome = 0 } = {}) {
  const y = YEARS[year];
  if (!y) throw new Error(`Unknown income year ${year}`);
  const wfh = wfhFixedRate(wfhHours, year);
  const car = carMethod === 'logbook' ? { method: 'logbook', ...carLogbook(carCosts, businessPct) } : { method: 'cents', ...carCentsPerKm(km, year) };
  const total = dollars(wfh.amount + car.amount);
  const saving = (d) => taxFor(taxableIncome, year) - taxFor(Math.max(0, taxableIncome - d), year);
  const taxSaving = saving(total);
  // From 2026-27 claiming these replaces the $1,000 standard deduction (assumes labour income of at least
  // $1,000 and no other work-related claims). Extra is what itemising adds over the standard deduction.
  const standard = y.standard;
  const extra = standard ? total - standard : null;
  const extraSaving = standard ? taxSaving - saving(standard) : null;
  return { year, wfh, car, total, taxSaving, standard, extra, extraSaving, estimate: wfh.estimate };
}

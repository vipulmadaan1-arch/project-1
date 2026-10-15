// Today's dollars (present value). Its own small module so js/layout.js can use it without loading calc.js.
// ASIC Corporations (Generic Calculators) Instrument 2026/41 (https://www.legislation.gov.au/F2026L00271/latest/text):
// a calculator about a financial product must show, for an amount payable 2 or more years ahead, "a clear and
// prominent statement setting out the present value of the estimate" (s 8(1)(e)(iv)). Section 6 defines that
// present value as C / (1 + r)^n: C the estimate, n the years and part years until it's payable, and r 0.025
// "or such other assumed inflation rate ... as is inputted by the user". The 2.5% default is "the mid-point of the
// Reserve Bank of Australia's target range for inflation" (the RBA targets 2–3% CPI inflation).
export const PV_INFLATION_PCT = 2.5;
export const PV_MIN_YEARS = 2;
export function presentValue(amount, years, inflationPct = PV_INFLATION_PCT) {
  if (!Number.isFinite(amount) || !Number.isFinite(years) || !Number.isFinite(inflationPct) || inflationPct <= -100) return null;
  return amount / Math.pow(1 + inflationPct / 100, Math.max(0, years));
}

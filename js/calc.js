// Pure calculation functions. No DOM access so they can be unit-tested in Node.

// ---------- Basic calculator (safe expression evaluator, no eval) ----------
export function evaluate(expr) {
  const src = String(expr).replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/\s+/g, '');
  let i = 0;
  const peek = () => src[i];
  const fail = () => { throw new Error('Invalid expression'); };

  function number() {
    const start = i;
    while (i < src.length && /[0-9.]/.test(src[i])) i++;
    // Exponent, e.g. a previous result of 1e+21 carried into the next sum.
    if (src[i] === 'e' && /^e[+-]?\d/.test(src.slice(i, i + 3))) { i += /[+-]/.test(src[i + 1]) ? 2 : 1; while (/[0-9]/.test(src[i] || '')) i++; }
    const s = src.slice(start, i);
    if (!s || s === '.' || s.startsWith('.e') || (s.split('e')[0].match(/\./g) || []).length > 1) fail();
    let n = parseFloat(s);
    if (peek() === '%') { i++; n /= 100; }
    return n;
  }
  function factor() {
    if (peek() === '-') { i++; return -factor(); }
    if (peek() === '+') { i++; return factor(); }
    if (peek() === '(') {
      i++;
      const v = expression();
      if (peek() !== ')') fail();
      i++;
      if (peek() === '%') { i++; return v / 100; }
      return v;
    }
    return number();
  }
  function term() {
    let v = factor();
    // A bracket straight after a number or bracket multiplies: 2(3) = 6, (2)(3) = 6, (2)3 = 6.
    const implicit = () => peek() === '(' || (src[i - 1] === ')' && /[0-9.]/.test(peek() || ''));
    while (peek() === '*' || peek() === '/' || implicit()) {
      const op = peek() === '*' || peek() === '/' ? src[i++] : '*';
      const r = factor();
      if (op === '/' && r === 0) throw new Error('Cannot divide by zero');
      v = op === '*' ? v * r : v / r;
    }
    return v;
  }
  function expression() {
    let v = term();
    while (peek() === '+' || peek() === '-') {
      const op = src[i++];
      const r = term();
      v = op === '+' ? v + r : v - r;
    }
    return v;
  }

  if (!src) return 0;
  const result = expression();
  if (i !== src.length) fail();
  if (!Number.isFinite(result)) throw new Error('Number too large');
  // 15 significant digits hides floating-point noise (0.1 + 0.2 = 0.3) without
  // wiping out very small results. Adding 0 turns -0 into 0.
  return parseFloat(result.toPrecision(15)) + 0;
}

// ---------- Compound interest ----------
// Contributions are made at the end of each contribution period.
export function compoundInterest({ principal, ratePct, years, compoundsPerYear = 12, contribution = 0, contributionsPerYear = 12 }) {
  const r = ratePct / 100;
  // Simulate per compounding period, spreading contributions proportionally.
  const periods = Math.round(years * compoundsPerYear);
  const perRate = r / compoundsPerYear;
  const contribPerPeriod = (contribution * contributionsPerYear) / compoundsPerYear;
  let balance = principal;
  let contributed = principal;
  const yearly = [];
  for (let p = 1; p <= periods; p++) {
    balance = balance * (1 + perRate) + contribPerPeriod;
    contributed += contribPerPeriod;
    if (p % compoundsPerYear === 0 || p === periods) {
      yearly.push({ year: Math.ceil(p / compoundsPerYear), balance, contributed, interest: balance - contributed });
    }
  }
  return { balance, contributed, interest: balance - contributed, yearly };
}

// ---------- Loan repayments ----------
export const FREQ = { weekly: 52, fortnightly: 26, monthly: 12 };

export function repayment(principal, ratePct, years, perYear = 12) {
  const n = Math.round(years * perYear);
  const i = ratePct / 100 / perYear;
  if (n <= 0) return 0;
  if (i === 0) return principal / n;
  return (principal * i) / (1 - Math.pow(1 + i, -n));
}

export function mortgage({ principal, ratePct, years, frequency = 'monthly' }) {
  const perYear = FREQ[frequency];
  const pay = repayment(principal, ratePct, years, perYear);
  const total = pay * Math.round(years * perYear);
  return { repayment: pay, total, interest: total - principal };
}

// Simulates a P&I loan with an offset balance. Repayment stays fixed at the no-offset amount,
// so the offset shortens the loan term.
export function offsetSavings({ principal, ratePct, years, offset, frequency = 'monthly' }) {
  const perYear = FREQ[frequency];
  const i = ratePct / 100 / perYear;
  const pay = repayment(principal, ratePct, years, perYear);
  const run = (off) => {
    let bal = principal, interest = 0, periods = 0;
    const max = Math.round(years * perYear) + 1;
    while (bal > 0.005 && periods < max) {
      const charge = Math.max(0, bal - off) * i;
      interest += charge;
      bal = bal + charge - pay;
      periods++;
    }
    return { interest, periods };
  };
  const base = run(0);
  const withOffset = run(Math.min(offset, principal));
  return {
    repayment: pay,
    interestSaved: base.interest - withOffset.interest,
    periodsSaved: base.periods - withOffset.periods,
    yearsSaved: (base.periods - withOffset.periods) / perYear,
    baseInterest: base.interest,
    offsetInterest: withOffset.interest,
  };
}

// ---------- NSW transfer (stamp) duty, 2026/27 ----------
// Source: Revenue NSW "How to calculate transfer duty", rates for 2026/2027 (checked 14 Oct 2026).
export const NSW_DUTY_YEAR = '2026/27';
export const NSW_BRACKETS = [
  { upTo: 18000, base: 0, from: 0, rate: 0.0125 },
  { upTo: 38000, base: 225, from: 18000, rate: 0.015 },
  { upTo: 103000, base: 525, from: 38000, rate: 0.0175 },
  { upTo: 387000, base: 1662, from: 103000, rate: 0.035 },
  { upTo: 1290000, base: 11602, from: 387000, rate: 0.045 },
  { upTo: Infinity, base: 52237, from: 1290000, rate: 0.055 },
];
export const NSW_PREMIUM = { threshold: 3870000, base: 194137, rate: 0.07 };
export const NSW_FHB = { exemptUpTo: 800000, concessionUpTo: 1000000 };
// First home buyer concession for homes over $800,000 and under $1,000,000.
// Formula as published by independent calculators (not on Revenue NSW's site):
// duty on value − duty on $800,000 × ($1,000,000 − value) ÷ $200,000.
export function nswFhbConcessionDuty(value) {
  const full = nswTransferDuty(value);
  const discount = nswTransferDuty(NSW_FHB.exemptUpTo) * (NSW_FHB.concessionUpTo - value) / (NSW_FHB.concessionUpTo - NSW_FHB.exemptUpTo);
  return Math.max(0, Math.round(full - discount));
}
export const NSW_FOREIGN_SURCHARGE = 0.09;

export function nswTransferDuty(value, { residential = true } = {}) {
  if (!(value > 0)) return 0;
  let duty;
  if (residential && value > NSW_PREMIUM.threshold) {
    duty = NSW_PREMIUM.base + (value - NSW_PREMIUM.threshold) * NSW_PREMIUM.rate;
  } else {
    const b = NSW_BRACKETS.find((x) => value <= x.upTo);
    duty = b.base + (value - b.from) * b.rate;
  }
  return Math.max(20, Math.round(duty));
}

export function nswDuty(value, { firstHomeBuyer = false, foreign = false, residential = true } = {}) {
  const general = nswTransferDuty(value, { residential });
  let duty = general;
  let note = '';
  if (firstHomeBuyer && residential) {
    if (value <= NSW_FHB.exemptUpTo) {
      duty = 0;
      note = 'Full first home buyer exemption (homes valued at $800,000 or less), subject to eligibility.';
    } else if (value < NSW_FHB.concessionUpTo) {
      duty = nswFhbConcessionDuty(value);
      note = `First home buyer concession (homes $800,000–$1 million): saves an estimated ${(general - duty).toLocaleString('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 })} on full duty of ${general.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 })}. Confirm with the Revenue NSW First Home Buyer calculator.`;
    } else {
      note = 'Over $1 million: no first home buyer concession. Full duty applies.';
    }
  }
  const surcharge = foreign && residential ? Math.round(value * NSW_FOREIGN_SURCHARGE) : 0;
  return { general, duty, surcharge, total: duty + surcharge, note };
}

// ---------- Australian take-home pay, 2026-27 (residents) ----------
// Rates: 15% second bracket from 1 July 2026 (legislated). Medicare thresholds are the latest
// published by the ATO (2025-26) until 2026-27 figures are released.
export const TAX_YEAR = '2026-27';
export const TAX_BRACKETS = [
  { upTo: 18200, rate: 0 },
  { upTo: 45000, rate: 0.15 },
  { upTo: 135000, rate: 0.30 },
  { upTo: 190000, rate: 0.37 },
  { upTo: Infinity, rate: 0.45 },
];
export const MEDICARE = { rate: 0.02, lower: 28011, upper: 35013, shadeIn: 0.10 };
export const SUPER_GUARANTEE = 0.12;
export const SUPER_MAX_BASE = 270830; // ATO maximum contribution base 2026-27 (annual)

// Study and training loan (HELP/HECS) compulsory repayments, 2026-27, marginal system.
// Source: ATO "Study and training loan minimum repayment income and rates" (updated 13 Oct 2026).
export const HELP = { threshold: 69528, band2: 129717, band2Base: 9028, top: 186050 };
export function helpRepayment(repaymentIncome) {
  const x = repaymentIncome;
  if (x <= HELP.threshold) return 0;
  if (x <= HELP.band2) return (x - HELP.threshold) * 0.15;
  if (x <= HELP.top) return HELP.band2Base + (x - HELP.band2) * 0.17;
  return x * 0.10;
}

export function incomeTax(income) {
  let tax = 0, prev = 0;
  for (const b of TAX_BRACKETS) {
    if (income > prev) tax += (Math.min(income, b.upTo) - prev) * b.rate;
    prev = b.upTo;
  }
  return tax;
}

export function lito(income) {
  if (income <= 37500) return 700;
  if (income <= 45000) return 700 - (income - 37500) * 0.05;
  return Math.max(0, 325 - (income - 45000) * 0.015);
}

export function medicareLevy(income) {
  if (income <= MEDICARE.lower) return 0;
  if (income <= MEDICARE.upper) return (income - MEDICARE.lower) * MEDICARE.shadeIn;
  return income * MEDICARE.rate;
}

export function takeHome(gross, { includesSuper = false, help = false } = {}) {
  // Super is only payable on earnings up to the maximum contribution base.
  const salary = includesSuper
    ? (gross <= SUPER_MAX_BASE * (1 + SUPER_GUARANTEE) ? gross / (1 + SUPER_GUARANTEE) : gross - SUPER_MAX_BASE * SUPER_GUARANTEE)
    : gross;
  const superAmt = Math.min(salary, SUPER_MAX_BASE) * SUPER_GUARANTEE;
  const tax = Math.max(0, incomeTax(salary) - lito(salary));
  const medicare = medicareLevy(salary);
  const helpAmt = help ? helpRepayment(salary) : 0;
  const net = salary - tax - medicare - helpAmt;
  return { salary, super: superAmt, tax, medicare, help: helpAmt, net, effectiveRate: salary ? (tax + medicare) / salary : 0 };
}

// ---------- Unit conversion ----------
export const UNITS = {
  Length: { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.344, yd: 0.9144, ft: 0.3048, in: 0.0254, 'nautical mi': 1852 },
  Mass: { kg: 1, g: 0.001, t: 1000, lb: 0.45359237, oz: 0.028349523125, st: 6.35029318 },
  Volume: { L: 1, mL: 0.001, 'm³': 1000, 'US gal': 3.785411784, 'UK gal': 4.54609, cup: 0.25, 'fl oz (US)': 0.0295735295625 },
  Area: { 'm²': 1, 'km²': 1e6, ha: 1e4, acre: 4046.8564224, 'ft²': 0.09290304, square: 9.290304 },
  Speed: { 'km/h': 1, 'm/s': 3.6, mph: 1.609344, knot: 1.852 },
  Temperature: { '°C': 'C', '°F': 'F', K: 'K' },
};

export function convert(category, value, from, to) {
  if (category === 'Temperature') {
    const toC = { C: (v) => v, F: (v) => (v - 32) * 5 / 9, K: (v) => v - 273.15 };
    const fromC = { C: (v) => v, F: (v) => v * 9 / 5 + 32, K: (v) => v + 273.15 };
    return fromC[UNITS.Temperature[to]](toC[UNITS.Temperature[from]](value));
  }
  const u = UNITS[category];
  return (value * u[from]) / u[to];
}

// ---------- Time formatting ----------
export function formatDuration(ms, { showMs = true } = {}) {
  const neg = ms < 0;
  ms = Math.abs(ms);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const cs = Math.floor((ms % 1000) / 10);
  const pad = (n) => String(n).padStart(2, '0');
  const core = `${h ? pad(h) + ':' : ''}${pad(m)}:${pad(s)}`;
  return (neg ? '-' : '') + (showMs ? `${core}.${pad(cs)}` : core);
}

// ---------- GST (Australia, 10%) ----------
export const GST_RATE = 0.10;
export function gst(amount, mode = 'add') {
  if (mode === 'add') return { exclusive: amount, gst: amount * GST_RATE, inclusive: amount * (1 + GST_RATE) };
  const exclusive = amount / (1 + GST_RATE);
  return { exclusive, gst: amount - exclusive, inclusive: amount };
}

// ---------- Percentages ----------
export const percent = {
  of: (p, x) => (p / 100) * x,                       // p% of x
  whatPercent: (x, y) => (y === 0 ? NaN : (x / y) * 100), // x is what % of y
  change: (from, to) => (from === 0 ? NaN : ((to - from) / Math.abs(from)) * 100),
};

// ---------- Rental yield ----------
export function rentalYield({ price, weeklyRent, annualCosts = 0, vacancyWeeks = 0 }) {
  if (!(price > 0)) return { gross: 0, net: 0, annualRent: 0, netIncome: 0 };
  const annualRent = weeklyRent * (52 - vacancyWeeks);
  const netIncome = annualRent - annualCosts;
  return { annualRent, netIncome, gross: (weeklyRent * 52 / price) * 100, net: (netIncome / price) * 100 };
}

// ---------- Dates ----------
// Inputs are 'YYYY-MM-DD' strings. Works in UTC to avoid daylight-saving off-by-one errors.
// Date.UTC treats years 0–99 as 1900–1999, so set the full year explicitly.
const utc = (y, m, d) => { const t = new Date(Date.UTC(2000, 0, 1)); t.setUTCFullYear(y, m, d); return t.getTime(); };
const toUTC = (s) => { const [y, m, d] = s.split('-').map(Number); return utc(y, m - 1, d); };
export function daysBetween(a, b, { inclusive = false } = {}) {
  const days = Math.round((toUTC(b) - toUTC(a)) / 86400000);
  return inclusive ? days + Math.sign(days || 1) : days;
}
// NSW public holidays (declared statewide), 2026–2027. Source: nsw.gov.au/about-nsw/public-holidays.
// Bank Holiday is excluded because it isn't a declared public holiday.
export const NSW_HOLIDAYS = new Set([
  '2026-01-01', '2026-01-26', '2026-04-03', '2026-04-04', '2026-04-05', '2026-04-06', '2026-04-25', '2026-04-27',
  '2026-06-08', '2026-10-05', '2026-12-25', '2026-12-26', '2026-12-28',
  '2027-01-01', '2027-01-26', '2027-03-26', '2027-03-27', '2027-03-28', '2027-03-29', '2027-04-25', '2027-04-26',
  '2027-06-14', '2027-10-04', '2027-12-25', '2027-12-26', '2027-12-27', '2027-12-28',
]);
export const NSW_HOLIDAY_YEARS = [2026, 2027];

export function businessDays(a, b, { excludeHolidays = false } = {}) {
  let start = toUTC(a), end = toUTC(b);
  const sign = end < start ? -1 : 1;
  if (sign < 0) [start, end] = [end, start];
  let count = 0;
  for (let t = start; t <= end; t += 86400000) {
    const d = new Date(t);
    const wd = d.getUTCDay();
    if (wd === 0 || wd === 6) continue;
    if (excludeHolidays && NSW_HOLIDAYS.has(d.toISOString().slice(0, 10))) continue;
    count++;
  }
  return count * sign;
}
function addMonthsClamped(y, m, d, n) {
  const target = new Date(utc(y, m - 1 + n, 1));
  const lastDay = new Date(utc(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  return utc(target.getUTCFullYear(), target.getUTCMonth(), Math.min(d, lastDay));
}
export function ymdBetween(a, b) {
  if (toUTC(b) < toUTC(a)) [a, b] = [b, a];
  const [y1, m1, d1] = a.split('-').map(Number), [y2, m2] = b.split('-').map(Number);
  let months = (y2 - y1) * 12 + (m2 - m1);
  if (addMonthsClamped(y1, m1, d1, months) > toUTC(b)) months--;
  const days = Math.round((toUTC(b) - addMonthsClamped(y1, m1, d1, months)) / 86400000);
  return { years: Math.floor(months / 12), months: months % 12, days };
}
export function addDays(a, n) {
  return new Date(toUTC(a) + n * 86400000).toISOString().slice(0, 10);
}

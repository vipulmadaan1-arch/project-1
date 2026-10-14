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
    const s = src.slice(start, i);
    if (!s || (s.match(/\./g) || []).length > 1) fail();
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
    while (peek() === '*' || peek() === '/') {
      const op = src[i++];
      const r = factor();
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
  if (!Number.isFinite(result)) throw new Error('Cannot divide by zero');
  return Math.round(result * 1e12) / 1e12;
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
      note = 'A reduced (concessional) rate applies between $800,000 and $1 million. Figure shown is full duty — use the Revenue NSW First Home Buyer calculator for the concession amount.';
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

export function takeHome(gross, { includesSuper = false } = {}) {
  const salary = includesSuper ? gross / (1 + SUPER_GUARANTEE) : gross;
  const superAmt = salary * SUPER_GUARANTEE;
  const tax = Math.max(0, incomeTax(salary) - lito(salary));
  const medicare = medicareLevy(salary);
  const net = salary - tax - medicare;
  return { salary, super: superAmt, tax, medicare, net, effectiveRate: salary ? (tax + medicare) / salary : 0 };
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

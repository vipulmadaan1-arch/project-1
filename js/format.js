// Number reading and money formatting with no page access, so the unit tests can import them
// (tests/layout.test.mjs). js/layout.js re-exports them for the page scripts.

// One Intl.NumberFormat per set of options: building a formatter is far slower than using one,
// and results are formatted on every keystroke.
const formatters = new Map();
export function numberFormat(opts = {}) {
  const key = JSON.stringify(opts);
  let f = formatters.get(key);
  if (!f) { f = new Intl.NumberFormat('en-AU', opts); formatters.set(key, f); }
  return f;
}

// Money for display. Shows "–" rather than NaN, avoids "-$0", and switches very large
// figures to scientific notation so they don't run off a phone screen.
export const fmtMoney = (n, dp = 0) => {
  if (!Number.isFinite(n)) return '–';
  if (Math.abs(n) >= 1e15) return numberFormat({ style: 'currency', currency: 'AUD', notation: 'scientific', maximumFractionDigits: 2 }).format(n);
  const v = Math.abs(n) < 0.5 / 10 ** dp ? 0 : n;
  return numberFormat({ style: 'currency', currency: 'AUD', minimumFractionDigits: dp, maximumFractionDigits: dp }).format(v);
};

// Number fields are text inputs with inputmode="decimal" rather than type="number"
// (the GOV.UK Design System advises against type="number"), so people can type or paste
// "$750,000", "6.5%", "1 000" or "650k". Returns null when empty and NaN when it isn't a number.
// Commas count only as thousands separators ("1,250,000"); "6,5" is NaN, so it's never read as 65.
export function parseNumber(value) {
  let s = String(value ?? '').trim().replace(/^A(UD)?(?=\$)/i, '').replace(/[\s$%]/g, '').replace(/^−/, '-');
  if (s === '') return null;
  // k and m suffixes: "650k" is 650,000 and "1.2m" is 1,200,000 (scaled in the exponent, so no rounding error).
  const short = s.match(/^(.*\d)([km])$/i);
  if (short) s = short[1];
  if (s.includes(',')) {
    if (!/^[-+]?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) return NaN;
    s = s.replace(/,/g, '');
  }
  if (short) return /^[-+]?(\d+\.?\d*|\.\d+)$/.test(s) ? parseFloat(`${s}e${/k/i.test(short[2]) ? 3 : 6}`) : NaN;
  return /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s) ? parseFloat(s) : NaN;
}

// A comma where a full stop belongs ("6,5" or "650,50"), which parseNumber rejects.
export const decimalComma = (value) => /^[-+$\s]*\d+,\d{1,2}%?\s*$/.test(String(value ?? ''));

const plain = (n) => numberFormat().format(n);
const UNIT_FMT = {
  money: (n) => fmtMoney(n),
  percent: (n) => `${plain(n)}%`,
  years: (n) => `${plain(n)} year${n === 1 ? '' : 's'}`,
  weeks: (n) => `${plain(n)} week${n === 1 ? '' : 's'}`,
  days: plain,
  plain,
};

// Checks what's typed in a number field. Returns { n } when it can be used, otherwise { n: null, msg }
// with an error that says what's wrong and how to fix it, and empty: true for an empty field.
// opts: name ("Loan amount"), unit (money, percent, years, weeks, days, plain), min, max,
// above (must be more than), optional (empty counts as 0), whole (whole numbers only), example,
// enter (message for an empty field).
export function checkNumber(value, { name, unit = 'plain', min, max, above, optional = false, whole = false, example, enter } = {}) {
  const n = parseNumber(value);
  const f = UNIT_FMT[unit];
  const lower = name[0].toLowerCase() + name.slice(1);
  if (n === null) return optional ? { n: 0 } : { n: null, empty: true, msg: enter || `Enter the ${lower}` };
  if (Number.isNaN(n)) {
    if (decimalComma(value)) return { n: null, msg: `Use a full stop for ${unit === 'money' ? 'cents' : 'decimals'}, like ${unit === 'money' ? '650.50' : '6.5'}` };
    return { n: null, msg: `${name} must be a number, like ${example ?? (unit === 'money' ? '750,000' : '5')}` };
  }
  if (whole && !Number.isInteger(n)) return { n: null, msg: `${name} must be a whole number` };
  if ((min !== undefined && n < min) || (max !== undefined && n > max) || (above !== undefined && n <= above)) {
    const lo = above !== undefined ? above : min;
    // A short range reads best as "between"; for money, "$0 or more" is clearer than "between $0 and $1 trillion".
    if (lo !== undefined && max !== undefined && above === undefined && unit !== 'money') return { n: null, msg: `${name} must be between ${unit === 'years' || unit === 'weeks' ? plain(lo) : f(lo)} and ${f(max)}` };
    if (above !== undefined && n <= above) return { n: null, msg: `${name} must be more than ${f(above)}` };
    if (min !== undefined && n < min) return { n: null, msg: `${name} must be ${f(min)} or more` };
    return { n: null, msg: `${name} must be ${f(max)} or less` };
  }
  return { n };
}

// How a money field shows its value once you leave it: thousands separators back in ("750,000"), or
// null to leave it as typed (not a number, negative, huge, or with fractions of a cent, which
// rounding would silently change).
export function moneyFieldText(value) {
  const n = parseNumber(value);
  if (!Number.isFinite(n) || n < 0 || n >= 1e15) return null;
  if (Math.abs(n * 100 - Math.round(n * 100)) > 1e-6) return null;
  return numberFormat({ maximumFractionDigits: 2 }).format(n);
}

// Registry of every tool. Add a tool here and create tools/<slug>.html to list it on the home page.
// cat: 'au' = uses Australian rates or conventions; 'general' = works anywhere.
export const CATEGORIES = [
  { key: 'au', title: 'Australian calculators', blurb: 'Current Australian tax, duty and GST rates, in AUD.' },
  { key: 'general', title: 'General tools', blurb: 'Everyday maths, conversions and time tools that work anywhere.' },
];

export const TOOLS = [
  { slug: 'stamp-duty-nsw', name: 'NSW Stamp Duty', icon: '📝', desc: 'Transfer duty with 2026/27 rates.', cat: 'au' },
  { slug: 'take-home-pay', name: 'Take-Home Pay (AU)', icon: '💵', desc: 'After-tax pay with 2026-27 rates.', cat: 'au' },
  { slug: 'mortgage', name: 'Mortgage Repayments', icon: '🏠', desc: 'Weekly, fortnightly or monthly repayments.', cat: 'au' },
  { slug: 'offset', name: 'Offset Account Savings', icon: '💰', desc: 'Interest and time saved with an offset.', cat: 'au' },
  { slug: 'rental-yield', name: 'Rental Yield', icon: '🏘️', desc: 'Gross and net yield on an investment property.', cat: 'au' },
  { slug: 'gst', name: 'GST Calculator', icon: '🧾', desc: 'Add or remove 10% GST.', cat: 'au' },
  { slug: 'compound-interest', name: 'Compound Interest', icon: '📈', desc: 'Grow savings with regular deposits.', cat: 'general' },
  { slug: 'calculator', name: 'Calculator', icon: '🧮', desc: 'Quick everyday maths with keyboard support.', cat: 'general' },
  { slug: 'percentage', name: 'Percentage', icon: '％', desc: 'Percent of, percent change and more.', cat: 'general' },
  { slug: 'unit-converter', name: 'Unit Converter', icon: '📏', desc: 'Length, weight, volume, temperature and more.', cat: 'general' },
  { slug: 'date-calculator', name: 'Date Calculator', icon: '📅', desc: 'Days between dates and business days.', cat: 'general' },
  { slug: 'world-clock', name: 'World Clock', icon: '🌏', desc: 'Time in cities worldwide, plus a time converter.', cat: 'general' },
  { slug: 'stopwatch', name: 'Stopwatch', icon: '⏱️', desc: 'Start, stop and record laps.', cat: 'general' },
  { slug: 'timer', name: 'Countdown Timer', icon: '⏳', desc: 'Set a countdown with an alarm.', cat: 'general' },
];

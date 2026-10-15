// Registry of every tool. Add a tool here and create tools/<slug>.html to list it on the home page.
// cat: 'au' = uses Australian rates or conventions; 'general' = works anywhere.
// meta: a short factual label shown on the tile (rate source, units, etc).
export const CATEGORIES = [
  { key: 'au', title: 'Australian calculators', blurb: 'Tax, duty and GST at current Australian rates, in dollars.' },
  { key: 'general', title: 'General tools', blurb: 'Maths, conversions and time tools that work anywhere.' },
];

export const TOOLS = [
  { slug: 'stamp-duty', name: 'Stamp Duty, All States', desc: 'Transfer duty for every state and territory, with home and first home concessions.', meta: 'All 8 states and territories', cat: 'au' },
  { slug: 'stamp-duty-nsw', name: 'NSW Stamp Duty', desc: 'Transfer duty, first home buyer concessions and foreign surcharge.', meta: 'Revenue NSW 2026/27', cat: 'au' },
  { slug: 'capital-gains-tax', name: 'Capital Gains Tax', desc: 'Tax on selling shares, crypto or property, with the new 2027 rules.', meta: 'Indexation and 30% minimum', cat: 'au' },
  { slug: 'take-home-pay', name: 'Take-Home Pay', desc: 'Pay after income tax, Medicare levy and HECS/HELP.', meta: 'ATO 2026-27', cat: 'au' },
  { slug: 'mortgage', name: 'Mortgage Repayments', desc: 'Principal and interest repayments and total interest.', meta: 'Weekly to monthly', cat: 'au' },
  { slug: 'offset', name: 'Offset Account', desc: 'Interest and years saved by money held in offset.', meta: 'Same repayment', cat: 'au' },
  { slug: 'rental-yield', name: 'Rental Yield', desc: 'Gross and net yield from weekly rent and annual costs.', meta: 'Per-week rent', cat: 'au' },
  { slug: 'gst', name: 'GST', desc: 'Add GST to a price or find the GST inside a total.', meta: '10% rate', cat: 'au' },
  { slug: 'compound-interest', name: 'Compound Interest', desc: 'Savings growth with regular deposits, year by year.', meta: 'Daily to annual', cat: 'general' },
  { slug: 'calculator', name: 'Calculator', desc: 'Basic and scientific: trig, logs, powers, roots and factorials.', meta: 'Basic and scientific', cat: 'general' },
  { slug: 'percentage', name: 'Percentage', desc: 'Percent of a number, share of a total and change.', meta: 'Three in one', cat: 'general' },
  { slug: 'unit-converter', name: 'Unit Converter', desc: 'Length, mass, volume, area, speed and temperature.', meta: 'Metric ⇄ imperial', cat: 'general' },
  { slug: 'date-calculator', name: 'Date Calculator', desc: 'Days and business days between dates, or add days.', meta: 'NSW holidays', cat: 'general' },
  { slug: 'world-clock', name: 'World Clock', desc: 'Live times worldwide and a meeting-time converter.', meta: '50 cities', cat: 'general' },
  { slug: 'stopwatch', name: 'Stopwatch', desc: 'Split and total lap times to the hundredth.', meta: 'Space to start', cat: 'general' },
  { slug: 'timer', name: 'Countdown Timer', desc: 'Hours, minutes and seconds with an audible alarm.', meta: 'Presets included', cat: 'general' },
];

export const RATES_CHECKED = '14 Oct 2026';

// Registry of every tool. Add a tool here and create tools/<slug>.html to list it on the home page.
// cat: one of the CATEGORIES keys below; it sets the home page section, breadcrumb and footer column.
// meta: a short factual label shown on the tile (rate source, units, etc).
export const CATEGORIES = [
  { key: 'tax', short: 'Tax & pay', title: 'Tax, pay and super', blurb: 'Income tax, capital gains, HECS and deductions at current ATO rates.' },
  { key: 'property', short: 'Property', title: 'Property and cars', blurb: 'Stamp duty in every state, home loans and rental returns.' },
  { key: 'money', short: 'Loans & savings', title: 'Loans and savings', blurb: 'Car and personal loans, credit cards, savings goals and compound interest.' },
  { key: 'general', short: 'Everyday', title: 'Everyday tools', blurb: 'Maths, conversions and time tools that work anywhere.' },
];

export const TOOLS = [
  { slug: 'take-home-pay', name: 'Take-Home Pay', desc: 'Pay after income tax, Medicare levy and HECS/HELP.', meta: 'ATO 2026-27', cat: 'tax' },
  { slug: 'gross-up', name: 'Salary Needed for Take-Home Pay', desc: 'The salary you need to earn a set take-home pay, after tax and HECS.', meta: 'ATO 2026-27', cat: 'tax' },
  { slug: 'capital-gains-tax', name: 'Capital Gains Tax', desc: 'Tax on selling shares, crypto or property, with the new 2027 rules.', meta: 'Indexation and 30% minimum', cat: 'tax' },
  { slug: 'work-deductions', name: 'Work From Home & Car Expenses', desc: 'Your working from home and work car tax deductions, and the tax they save.', meta: 'ATO 70c/hr and 91c/km', cat: 'tax' },
  { slug: 'hecs-help', name: 'HECS/HELP Debt Payoff', desc: 'Years to repay your study loan, with indexation and extra repayments.', meta: 'ATO 2026-27 rates', cat: 'tax' },
  { slug: 'gst', name: 'GST', desc: 'Add GST to a price or find the GST inside a total.', meta: '10% rate', cat: 'tax' },
  { slug: 'stamp-duty', name: 'Stamp Duty, All States', desc: 'Transfer duty for every state and territory, with home and first home concessions.', meta: 'All 8 states and territories', cat: 'property' },
  { slug: 'stamp-duty-nsw', name: 'NSW Stamp Duty', desc: 'Transfer duty, first home buyer concessions and foreign surcharge.', meta: 'Revenue NSW 2026-27', cat: 'property' },
  { slug: 'stamp-duty-vic', name: 'VIC Stamp Duty', desc: 'Victorian land transfer duty, the PPR rate and first home buyer relief to $750,000.', meta: 'SRO Victoria 2026-27', cat: 'property' },
  { slug: 'stamp-duty-qld', name: 'QLD Stamp Duty', desc: 'Queensland transfer duty, the home concession and first home concessions.', meta: 'QRO 2026-27', cat: 'property' },
  { slug: 'stamp-duty-wa', name: 'WA Stamp Duty', desc: 'WA transfer duty, the first home owner rate to $800,000 and foreign surcharge.', meta: 'RevenueWA 2026-27', cat: 'property' },
  { slug: 'mortgage', name: 'Mortgage Repayments', desc: 'Home loan repayments and total interest, weekly to monthly.', meta: 'Weekly to monthly', cat: 'property' },
  { slug: 'offset', name: 'Offset Account', desc: 'Interest and years saved by money held in offset.', meta: 'Same repayment', cat: 'property' },
  { slug: 'rental-yield', name: 'Rental Yield', desc: 'Gross and net yield from weekly rent and annual costs.', meta: 'Per-week rent', cat: 'property' },
  { slug: 'compound-interest', name: 'Compound Interest', desc: 'Savings growth with regular deposits, year by year.', meta: 'Daily to annual', cat: 'money' },
  { slug: 'personal-loan', name: 'Car & Personal Loan Repayments', desc: 'Repayments and true cost with fees and an optional balloon.', meta: 'Fees and balloon', cat: 'money' },
  { slug: 'credit-card', name: 'Credit Card Payoff', desc: 'Time and interest to clear your card, versus minimum repayments.', meta: 'Minimum vs fixed', cat: 'money' },
  { slug: 'savings-goal', name: 'Savings Goal', desc: 'How long to reach a goal, or how much to save by a date.', meta: 'Weekly to monthly', cat: 'money' },
  { slug: 'calculator', name: 'Calculator', desc: 'Basic and scientific: trig, logs, powers, roots and factorials.', meta: 'Basic and scientific', cat: 'general' },
  { slug: 'percentage', name: 'Percentage', desc: 'Percent of a number, share of a total and change.', meta: 'Three in one', cat: 'general' },
  { slug: 'unit-converter', name: 'Unit Converter', desc: 'Length, mass, volume, area, speed and temperature.', meta: 'Metric ⇄ imperial', cat: 'general' },
  { slug: 'date-calculator', name: 'Date Calculator', desc: 'Days and business days between dates, or add days.', meta: 'NSW holidays', cat: 'general' },
  { slug: 'world-clock', name: 'World Clock', desc: 'Live times worldwide and a meeting-time converter.', meta: '50 cities', cat: 'general' },
  { slug: 'stopwatch', name: 'Stopwatch', desc: 'Split and total lap times to the hundredth.', meta: 'Space to start', cat: 'general' },
  { slug: 'timer', name: 'Countdown Timer', desc: 'Hours, minutes and seconds with an audible alarm.', meta: 'Presets included', cat: 'general' },
  { slug: 'super', name: 'Super & Salary Sacrifice', desc: 'Employer super, tax saved by salary sacrificing and the concessional cap.', meta: 'ATO 2026-27, $32,500 cap', cat: 'tax' },
  { slug: 'medicare-levy-surcharge', name: 'Medicare Levy Surcharge', desc: 'The surcharge without hospital cover, and whether a policy costs less.', meta: 'ATO 2026-27 thresholds', cat: 'tax' },
  { slug: 'car-stamp-duty', name: 'Car Stamp Duty, All States', desc: 'Motor vehicle duty on new and used cars in every state, with electric, hybrid and luxury rates.', meta: 'All 8 states and territories', cat: 'property' },
  { slug: 'inflation', name: 'Inflation', desc: 'What an amount from any year since 1948 is worth today, using ABS CPI.', meta: 'ABS CPI since 1948', cat: 'money' },
  { slug: 'borrowing-power', name: 'Borrowing Power', desc: 'Roughly how much a bank might lend, tested at APRA\'s 3% buffer.', meta: 'APRA 3% buffer', cat: 'property' },
  { slug: 'rental-cashflow', name: 'Rental Cashflow & Negative Gearing', desc: 'Weekly cashflow after tax, and the 2027 negative gearing limit.', meta: 'Before and after 1 July 2027', cat: 'property' },
  { slug: 'refinance', name: 'Refinance', desc: 'What switching home loans saves after costs, and when you break even.', meta: 'Costs and break-even', cat: 'property' },
  { slug: 'term-deposit', name: 'Term Deposit', desc: 'Interest and balance at maturity, paid monthly to at maturity, with tax.', meta: 'Monthly to maturity', cat: 'money' },
  { slug: 'balance-transfer', name: 'Balance Transfer', desc: 'Stay or transfer: interest, fees, time to clear and what is left after the intro rate.', meta: 'Fee, intro and revert rate', cat: 'money' },
  { slug: 'tax-refund', name: 'Tax Refund Estimator', desc: 'Your tax refund or bill for 2025-26 or 2026-27, from your income statement.', meta: 'ATO 2025-26 & 2026-27', cat: 'tax' },
  { slug: 'rent-vs-buy', name: 'Rent vs Buy', desc: 'Your wealth after buying a home or renting and investing the difference.', meta: 'Stamp duty, all states', cat: 'property' },
  { slug: 'retirement', name: 'Super & Retirement', desc: 'Super at retirement in today\'s dollars, how long it lasts, and the ASFA standard.', meta: 'ASFA June qtr 2026', cat: 'tax' },
  { slug: 'budget', name: 'Budget Planner', desc: 'Income and bills at any frequency, with your surplus or shortfall and where it goes.', meta: 'Weekly to yearly', cat: 'money' },
  { slug: 'lmi', name: 'LMI Calculator', desc: 'Estimate lenders mortgage insurance and state duty on it, and check if the 5% Deposit Scheme avoids it.', meta: 'Estimate, all states', cat: 'property' },
  { slug: 'upfront-costs', name: 'Upfront Costs of Buying a Home', desc: 'Cash needed to buy: deposit, stamp duty, registration fees, LMI and typical costs.', meta: 'All 8 states, 2026-27', cat: 'property' },
];

export const RATES_CHECKED = '15 Oct 2026';

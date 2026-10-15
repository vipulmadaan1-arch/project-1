// Household budget: income and spending at any frequency, normalised to one view. Pure functions, no DOM.
export const BUDGET_CHECKED = '15 Oct 2026';

// Times a year each frequency happens. A year is 52 weeks or 26 fortnights here, as in Moneysmart's budget
// planner (https://moneysmart.gov.au/budgeting/budget-planner, last updated 19 May 2026, which offers weekly,
// fortnightly, monthly, quarterly and annual items). So $100 a week is $5,200 a year and $433.33 a month.
export const PER_YEAR = { weekly: 52, fortnightly: 26, monthly: 12, quarterly: 4, yearly: 1 };
export const PER_LABEL = { weekly: 'week', fortnightly: 'fortnight', monthly: 'month', quarterly: 'quarter', yearly: 'year' };

// Spending categories. group is for the 50/30/20 rule of thumb: needs, wants, and savings (including extra debt
// repayments). The rule is a popular guide, not an official Australian standard; minimum debt repayments are
// usually counted as needs, so debt sits in needs here.
export const CATEGORIES = [
  { key: 'housing', label: 'Housing', hint: 'Rent or mortgage, rates, strata', group: 'needs' },
  { key: 'groceries', label: 'Groceries', hint: 'Food and household supplies', group: 'needs' },
  { key: 'transport', label: 'Transport', hint: 'Fuel, rego, public transport, tolls', group: 'needs' },
  { key: 'utilities', label: 'Utilities', hint: 'Electricity, gas, water', group: 'needs' },
  { key: 'insurance', label: 'Insurance', hint: 'Car, home, contents, life', group: 'needs' },
  { key: 'phone', label: 'Phone and internet', hint: '', group: 'needs' },
  { key: 'health', label: 'Health', hint: 'Private health, doctors, chemist', group: 'needs' },
  { key: 'kids', label: 'Kids', hint: 'Childcare, school fees, activities', group: 'needs' },
  { key: 'debt', label: 'Debt repayments', hint: 'Car loan, credit card, personal loan, BNPL', group: 'needs' },
  { key: 'entertainment', label: 'Entertainment', hint: 'Eating out, streaming, hobbies, holidays', group: 'wants' },
  { key: 'savings', label: 'Savings', hint: 'Money you set aside or invest', group: 'savings' },
  { key: 'other', label: 'Other', hint: 'Clothes, gifts, pets, anything else', group: 'wants' },
];

// 50/30/20 rule of thumb: half of after-tax income on needs, 30% on wants, 20% on savings and extra debt
// repayments. A common guide only, not a rule from any Australian government source.
export const RULE_503020 = { needs: 0.5, wants: 0.3, savings: 0.2 };

export const toYearly = (amount, freq) => (Number(amount) || 0) * (PER_YEAR[freq] ?? 0);

// income: { amount, freq }. items: { key: { amount, freq } }. view: frequency to show results in.
// Returns totals in the view, rows sorted largest first with each one's share of income, and the 50/30/20 split.
export function budget({ income, items = {}, view = 'monthly' }) {
  const per = PER_YEAR[view];
  if (!per) throw new Error(`Unknown frequency ${view}`);
  const incomeYear = toYearly(income?.amount, income?.freq);
  const rows = CATEGORIES.map((c) => {
    const yearly = toYearly(items[c.key]?.amount, items[c.key]?.freq);
    return { ...c, yearly, amount: yearly / per, share: incomeYear > 0 ? yearly / incomeYear : null };
  });
  const spendYear = rows.reduce((s, r) => s + r.yearly, 0);
  const sorted = [...rows].sort((a, b) => b.yearly - a.yearly || CATEGORIES.indexOf(a) - CATEGORIES.indexOf(b));
  const groups = {};
  for (const g of Object.keys(RULE_503020)) {
    const yearly = rows.filter((r) => r.group === g).reduce((s, r) => s + r.yearly, 0);
    const guide = incomeYear * RULE_503020[g];
    groups[g] = { amount: yearly / per, share: incomeYear > 0 ? yearly / incomeYear : null, guide: guide / per, within: Math.min(yearly, guide) / per, over: Math.max(0, yearly - guide) / per };
  }
  return {
    income: incomeYear / per,
    spending: spendYear / per,
    surplus: (incomeYear - spendYear) / per,
    spentShare: incomeYear > 0 ? spendYear / incomeYear : null,
    rows: sorted,
    groups,
  };
}

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { budget, toYearly, PER_YEAR, CATEGORIES, RULE_503020, BUDGET_CHECKED } from '../js/budget.js';

const near = (a, b, msg = '') => assert.ok(Math.abs(a - b) < 0.005, `${msg} expected ${b}, got ${a}`);

test('frequencies', () => {
  assert.deepEqual(PER_YEAR, { weekly: 52, fortnightly: 26, monthly: 12, quarterly: 4, yearly: 1 });
  assert.equal(toYearly(100, 'weekly'), 5200);
  assert.equal(toYearly(1000, 'monthly'), 12000);
  assert.equal(toYearly('', 'monthly'), 0);
  assert.equal(CATEGORIES.length, 12);
  assert.equal(BUDGET_CHECKED, '15 Oct 2026');
  near(RULE_503020.needs + RULE_503020.wants + RULE_503020.savings, 1);
});

test('$100 a week is $433.33 a month and $200 a fortnight', () => {
  const r = budget({ income: { amount: 100, freq: 'weekly' }, view: 'monthly' });
  near(r.income, 433.33);
  near(budget({ income: { amount: 100, freq: 'weekly' }, view: 'fortnightly' }).income, 200);
});

test('surplus, shares and sorting', () => {
  const r = budget({
    income: { amount: 2000, freq: 'weekly' }, // $104,000 a year
    items: { housing: { amount: 2600, freq: 'monthly' }, groceries: { amount: 250, freq: 'weekly' }, savings: { amount: 5200, freq: 'yearly' }, entertainment: { amount: 300, freq: 'fortnightly' } },
    view: 'yearly',
  });
  near(r.income, 104000);
  near(r.spending, 31200 + 13000 + 5200 + 7800);
  near(r.surplus, 104000 - 57200);
  assert.deepEqual(r.rows.slice(0, 4).map((x) => x.key), ['housing', 'groceries', 'entertainment', 'savings']);
  near(r.rows[0].share, 0.3);
  near(r.groups.needs.share, 0.425);
  near(r.groups.wants.share, 0.075);
  near(r.groups.savings.share, 0.05);
  near(r.groups.savings.guide, 20800);
});

test('shortfall is negative, and over-the-guide amounts split out', () => {
  const r = budget({ income: { amount: 1000, freq: 'weekly' }, items: { housing: { amount: 800, freq: 'weekly' } }, view: 'weekly' });
  near(r.surplus, 200);
  near(r.groups.needs.within, 500);
  near(r.groups.needs.over, 300);
  const s = budget({ income: { amount: 500, freq: 'weekly' }, items: { housing: { amount: 600, freq: 'weekly' } }, view: 'weekly' });
  near(s.surplus, -100);
});

test('no income gives no shares', () => {
  const r = budget({ income: { amount: 0, freq: 'weekly' }, items: { other: { amount: 10, freq: 'weekly' } } });
  assert.equal(r.spentShare, null);
  assert.equal(r.rows[0].share, null);
  assert.throws(() => budget({ income: { amount: 1, freq: 'weekly' }, view: 'daily' }));
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { grossUp } from '../js/grossup.js';
import { takeHome, HELP, MEDICARE, TAX_BRACKETS, SUPER_MAX_BASE, SUPER_GUARANTEE } from '../js/calc.js';

// Incomes around every threshold the engine uses, plus a spread of ordinary salaries.
const edges = [
  ...TAX_BRACKETS.filter((b) => Number.isFinite(b.upTo)).map((b) => b.upTo),
  MEDICARE.lower, MEDICARE.upper, HELP.threshold, HELP.band2, HELP.top, 37500, 66667,
  SUPER_MAX_BASE, SUPER_MAX_BASE * (1 + SUPER_GUARANTEE),
];
const incomes = [1, 500, 12345.67, 250000, 1e6, 5e6];
for (const e of edges) for (const d of [-1, -0.01, 0, 0.01, 1, 250]) incomes.push(e + d);
for (let g = 5000; g <= 400000; g += 7919) incomes.push(g);

for (const opts of [{}, { help: true }, { includesSuper: true }, { includesSuper: true, help: true }]) {
  test(`gross-up round-trips through takeHome within $1 ${JSON.stringify(opts)}`, () => {
    for (const g of incomes) {
      const target = takeHome(g, opts).net;
      const r = grossUp(target, opts);
      assert.ok(Math.abs(r.gross - g) <= 1, `gross ${g} → net ${target} → gross ${r.gross}`);
      assert.ok(r.net >= target - 1e-9, `net ${r.net} below target ${target}`);
      assert.ok(r.net - target < 0.01, `net ${r.net} overshoots ${target}`);
      // Every figure is exactly what the Take-Home Pay tool shows for that gross.
      assert.deepEqual({ ...r, gross: undefined, package: undefined }, { ...takeHome(r.gross, opts), gross: undefined, package: undefined });
      assert.ok(Math.abs(r.package - (r.salary + r.super)) < 1e-9);
    }
  });
}

test('take-home pay tool default ($90,000, no HELP) round-trips', () => {
  const net = takeHome(90000).net;
  assert.equal(grossUp(net).gross, 90000);
  assert.equal(grossUp(net / 26 * 26).gross, 90000);
});

test('zero, negative and non-numbers give nil', () => {
  for (const v of [0, -5, NaN]) assert.equal(grossUp(v).gross, 0);
});

test('income under the tax-free threshold needs no gross-up', () => {
  assert.equal(grossUp(15000).gross, 15000);
});

test('package includes super and super is capped at the maximum contribution base', () => {
  const r = grossUp(400000);
  assert.equal(r.super, SUPER_MAX_BASE * SUPER_GUARANTEE);
  assert.equal(r.package, r.salary + r.super);
});

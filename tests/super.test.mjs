import { test } from 'node:test';
import assert from 'node:assert/strict';
import { salarySacrifice, scenario, division293, superGuarantee, marginal, CONCESSIONAL_CAP, SUPER_CHECKED } from '../js/super.js';

const near = (a, b, msg) => assert.ok(Math.abs(a - b) < 0.01, `${msg ?? ''} expected ${b}, got ${a}`);

test('2026-27 concessional cap is $32,500', () => assert.equal(CONCESSIONAL_CAP, 32500));

test('super guarantee is 12%, capped at the $270,830 annual maximum contribution base', () => {
  near(superGuarantee(100000), 12000);
  near(superGuarantee(270830), 32499.6);
  near(superGuarantee(400000), 32499.6);
});

test('ATO Division 293 example: Jan, $240,000 income + $15,000 contributions pays $750', () => {
  near(division293(240000, 15000), 750);
  assert.equal(division293(235000, 15000), 0); // exactly $250,000 isn't over
  near(division293(300000, 20000), 3000); // all contributions over the threshold
});

test('salary sacrifice $10,000 on $100,000: saves $1,700 tax, take-home falls $6,800', () => {
  const r = salarySacrifice({ salary: 100000, sacrifice: 10000 });
  near(r.sg, 12000);
  near(r.concessional, 22000);
  near(r.incomeTaxSaved, 3200); // 30% + 2% Medicare on $10,000
  near(r.extraContribTax, 1500);
  near(r.taxSaved, 1700);
  near(r.takeHomeChange, -6800);
  near(r.superAdded, 8500);
  assert.equal(r.excess, 0);
  near(r.remaining, 10500);
});

test('sacrificing doesn\'t reduce the employer super guarantee', () => {
  near(salarySacrifice({ salary: 100000, sacrifice: 20000 }).sg, 12000);
});

test('over the cap: excess is taxed at marginal rates less a 15% offset', () => {
  const r = salarySacrifice({ salary: 150000, sacrifice: 20000 });
  near(r.concessional, 38000);
  near(r.excess, 5500);
  near(r.taxable, 135500);
});

test('carried-forward unused cap lifts the cap', () => {
  const r = salarySacrifice({ salary: 150000, sacrifice: 20000, unusedCap: 10000 });
  assert.equal(r.excess, 0);
  near(r.cap, 42500);
});

test('Division 293 applies when income plus contributions pass $250,000', () => {
  const r = salarySacrifice({ salary: 240000, sacrifice: 3000 });
  // taxable $237,000 + contributions $31,800 = $268,800: 15% of $18,800
  near(r.div293, 2820);
  // without sacrifice: $240,000 + $28,800 = $268,800 too, so the sacrifice adds no Division 293 here
  near(r.extraDiv293, 0);
});

test('Division 293 counts other income such as fringe benefits', () => {
  assert.equal(scenario({ salary: 200000 }).div293, 0);
  near(scenario({ salary: 200000, otherIncome: 40000 }).div293, 0.15 * 14000);
});

test('no sacrifice means no change', () => {
  const r = salarySacrifice({ salary: 80000 });
  assert.equal(r.taxSaved, 0);
  assert.equal(r.takeHomeChange, 0);
});

test('marginal rate includes Medicare levy', () => {
  assert.equal(marginal(100000), 0.32);
  assert.equal(marginal(200000), 0.47);
});

test('checked date is exported', () => assert.equal(SUPER_CHECKED, '15 Oct 2026'));

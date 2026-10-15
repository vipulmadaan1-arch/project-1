import { test } from 'node:test';
import assert from 'node:assert/strict';
import { motorDuty, STATES, waRate, actCategory, MOTOR_DUTY_CHECKED } from '../js/motor-duty.js';

const d = (state, value, o = {}) => motorDuty({ state, value, ...o }).duty;

test('all eight states and territories are covered, with official sources', () => {
  assert.deepEqual(STATES.map((s) => s.code), ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'ACT', 'NT']);
  for (const s of STATES) assert.match(s.source, /^https:\/\/[^/]*(gov\.au)\//, `${s.code} source should be a government site`);
  assert.equal(MOTOR_DUTY_CHECKED, '15 Oct 2026');
});

test('zero or invalid value gives no duty', () => {
  for (const s of STATES) {
    assert.equal(d(s.code, 0), 0);
    assert.equal(d(s.code, NaN), 0);
  }
  assert.throws(() => motorDuty({ state: 'XX', value: 1000 }));
});

test('NSW: $3 per $100 or part, then $1,350 + $5 per $100 from $45,000 (Duties Act s 265)', () => {
  assert.equal(d('NSW', 30000), 900);
  assert.equal(d('NSW', 30001), 903); // part of $100 counts as a whole $100
  assert.equal(d('NSW', 44999), 1350);
  assert.equal(d('NSW', 45000), 1350);
  assert.equal(d('NSW', 45001), 1355);
  assert.equal(d('NSW', 60000), 2100);
  assert.equal(d('NSW', 60000, { fuel: 'ev' }), 2100); // EV exemption ended 31 Dec 2023
});

test('VIC: rounded up to $200, one rate on the whole value (SRO 2026-27)', () => {
  // SRO drive-away examples give the rounded dutiable value; duty is that × rate ÷ 200.
  assert.equal(d('VIC', 69095.01), 2906.4); // rounds to $69,200
  assert.equal(d('VIC', 19147.31), 806.4); // rounds to $19,200
  assert.equal(d('VIC', 94061.31), 4898.4); // rounds to $94,200 at $10.40
  assert.equal(d('VIC', 80809), 3402); // at the threshold: rounds to $81,000, 405 × $8.40
  assert.equal(d('VIC', 80809.01), 4212); // just over: 405 × $10.40
  assert.equal(d('VIC', 100000), 5200);
  assert.equal(d('VIC', 100000.01), 7014); // 501 × $14
  assert.equal(d('VIC', 150000), 10500);
  assert.equal(d('VIC', 200000), 18000);
});

test('VIC: green cars pay $8.40 per $200 at any price', () => {
  assert.equal(d('VIC', 120000, { fuel: 'ev' }), 5040);
  assert.equal(d('VIC', 120000, { fuel: 'hybrid', co2: 120 }), 5040);
  assert.equal(d('VIC', 120000, { fuel: 'hybrid', co2: 121 }), 8400);
  assert.equal(d('VIC', 120000, { fuel: 'petrol' }), 8400); // unknown emissions: standard rate
  assert.equal(d('VIC', 51463.53, { fuel: 'ev' }), 2167.2); // SRO green example rounds to $51,600
});

test('QLD: by engine type, higher rate on the whole value above $100,000', () => {
  assert.equal(d('QLD', 30000, { cylinders: '4' }), 900);
  assert.equal(d('QLD', 30000, { cylinders: '6' }), 1050);
  assert.equal(d('QLD', 30000, { cylinders: '8' }), 1200);
  assert.equal(d('QLD', 30000, { fuel: 'hybrid', cylinders: '8' }), 600); // hybrids of any cylinders
  assert.equal(d('QLD', 30000, { fuel: 'phev' }), 600);
  assert.equal(d('QLD', 30000, { fuel: 'ev' }), 600);
  assert.equal(d('QLD', 43990, { cylinders: '4' }), 1320); // QRO optional-equipment example value
  assert.equal(d('QLD', 100000, { cylinders: '8' }), 4000);
  assert.equal(d('QLD', 100001, { cylinders: '8' }), 6006); // 1,001 × $6
  assert.equal(d('QLD', 101000, { cylinders: '4' }), 5050); // QRO list-price example value
  assert.equal(d('QLD', 120000, { fuel: 'ev' }), 4800);
});

test('SA: non-commercial vehicle scale (RevenueSA)', () => {
  assert.equal(d('SA', 300), 5); // minimum
  assert.equal(d('SA', 1000), 10);
  assert.equal(d('SA', 1500), 20);
  assert.equal(d('SA', 2000), 30);
  assert.equal(d('SA', 2500), 45);
  assert.equal(d('SA', 3000), 60);
  assert.equal(d('SA', 3001), 64);
  assert.equal(d('SA', 30000), 1140);
});

test('WA: 2.75% to 6.5%, sliding between $25,000 and $50,000', () => {
  assert.equal(waRate(25000), 2.75);
  assert.equal(waRate(30000), 3.5);
  assert.equal(waRate(40000), 5);
  assert.equal(waRate(50000), 6.5);
  assert.equal(waRate(50001), 6.5);
  assert.equal(d('WA', 20000), 550);
  assert.equal(d('WA', 30000), 1050);
  assert.equal(d('WA', 37500), 1736.25); // R = 2.75 + 1.875 = 4.625, rounded to 4.63
  assert.equal(d('WA', 60000), 3900);
});

test('TAS: passenger vehicle scale, matching Transport Tasmania examples', () => {
  assert.equal(d('TAS', 375), 20);
  assert.equal(d('TAS', 600), 20);
  assert.equal(d('TAS', 27750), 834);
  assert.equal(d('TAS', 35000), 1050);
  assert.equal(d('TAS', 38750), 1468);
  assert.equal(d('TAS', 40000), 1600);
  assert.equal(d('TAS', 40001), 1604);
  assert.equal(d('TAS', 50000), 2000);
});

test('ACT: emissions categories', () => {
  assert.equal(actCategory({ fuel: 'ev' }), 'AAA');
  assert.equal(actCategory({ fuel: 'petrol', co2: null }), 'NR');
  assert.equal(actCategory({ fuel: 'hybrid', co2: 65 }), 'AA');
  assert.equal(actCategory({ fuel: 'hybrid', co2: 66 }), 'A');
  assert.equal(actCategory({ fuel: 'petrol', co2: 130 }), 'A');
  assert.equal(actCategory({ fuel: 'petrol', co2: 175 }), 'B');
  assert.equal(actCategory({ fuel: 'petrol', co2: 220 }), 'C');
  assert.equal(actCategory({ fuel: 'petrol', co2: 221 }), 'D');
});

test('ACT: new cars, rates 1 Sep 2025 to 31 Jan 2027', () => {
  assert.equal(d('ACT', 40000, { fuel: 'ev' }), 1000);
  assert.equal(d('ACT', 45000, { fuel: 'ev' }), 1125);
  assert.equal(d('ACT', 80000, { fuel: 'ev' }), 2525); // published base above $80,000
  assert.equal(d('ACT', 90000, { fuel: 'ev' }), 3325);
  assert.equal(d('ACT', 80000, { fuel: 'hybrid', co2: 50 }), 2745);
  assert.equal(d('ACT', 80000, { fuel: 'hybrid', co2: 100 }), 2961.5);
  assert.equal(d('ACT', 80000, { co2: 150 }), 3177);
  assert.equal(d('ACT', 80000, { co2: 200 }), 3393.5);
  assert.equal(d('ACT', 80000, { co2: 250 }), 4772);
  assert.equal(d('ACT', 45000, { co2: 250 }), 2038.5);
  assert.equal(d('ACT', 80000), 3393.5); // non-rated = category C
  assert.equal(d('ACT', 30000, { co2: 150 }), 900);
  assert.equal(d('ACT', 30001, { co2: 150 }), 903);
});

test('ACT: used cars and rates from 1 Feb 2027', () => {
  assert.equal(d('ACT', 30000, { used: true, fuel: 'ev' }), 750);
  assert.equal(d('ACT', 30000, { used: true, fuel: 'hybrid', co2: 50 }), 951); // all other cars: $3.17
  assert.equal(d('ACT', 80000, { used: true, co2: 120 }), 3393.5);
  assert.equal(d('ACT', 80000, { used: true, actFrom2027: true }), 3928);
  assert.equal(d('ACT', 80000, { co2: 150, actFrom2027: true }), 3419);
  assert.equal(d('ACT', 80000, { co2: 200, actFrom2027: true }), 3928);
  assert.equal(d('ACT', 80000, { co2: 250, actFrom2027: true }), 4973.5);
  assert.equal(d('ACT', 45000, { co2: 250, actFrom2027: true }), 2173.5);
  assert.equal(d('ACT', 80000, { fuel: 'ev', actFrom2027: true }), 2525); // AAA unchanged
});

test('NT: $3 per $100, with the plug-in EV concession', () => {
  assert.equal(d('NT', 42990), 1290); // Territory Revenue Office worked example
  assert.equal(d('NT', 42990, { fuel: 'hybrid' }), 1290); // ordinary hybrids don't qualify
  assert.equal(d('NT', 42990, { fuel: 'ev' }), 0);
  assert.equal(d('NT', 50000, { fuel: 'phev' }), 0);
  assert.equal(d('NT', 60000, { fuel: 'ev' }), 300); // 3% of the $10,000 over $50,000
  const r = motorDuty({ state: 'NT', value: 60000, fuel: 'ev' });
  assert.equal(r.saving, 1500);
});

test('results carry a basis, notes and an effective rate', () => {
  const r = motorDuty({ state: 'NSW', value: 60000 });
  assert.match(r.basis, /\$1,350/);
  assert.ok(r.notes.length > 0);
  assert.equal(r.effectiveRate, 2100 / 60000);
});

test('chargedOn shows the rounded value duty is worked out on', () => {
  assert.equal(motorDuty({ state: 'VIC', value: 69095.01 }).chargedOn, 69200);
  assert.equal(motorDuty({ state: 'TAS', value: 27750 }).chargedOn, 27800);
  assert.equal(motorDuty({ state: 'WA', value: 27750 }).chargedOn, 27750);
  assert.match(motorDuty({ state: 'ACT', value: 50000, fuel: 'hybrid', co2: 50 }).notes[0], /category AA/);
});

test('the FAQ $45,000 figures match the calculator', async () => {
  const { readFileSync } = await import('node:fs');
  const { motorDuty } = await import('../js/motor-duty.js');
  const html = readFileSync('tools/car-stamp-duty.html', 'utf8');
  for (const state of ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'ACT', 'NT']) {
    const d = motorDuty({ state, value: 45000 }).duty;
    const fmt = `$${d.toLocaleString('en-AU', { minimumFractionDigits: Number.isInteger(d) ? 0 : 2 })}`;
    assert.ok(html.includes(fmt), `${state} figure ${fmt} missing from the FAQ`);
  }
});

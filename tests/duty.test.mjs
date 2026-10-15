import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stampDuty, STATES } from '../js/duty.js';

const d = (state, value, o = {}) => stampDuty({ state, value, home: false, ...o });

test('all eight states and territories are covered', () => {
  assert.deepEqual(STATES.map((s) => s.code), ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'ACT', 'NT']);
});

test('NSW matches Revenue NSW 2026/27 examples', () => {
  assert.equal(d('NSW', 1350000).duty, 55537);
  assert.equal(d('NSW', 450000).duty, 14437);
  assert.equal(d('NSW', 750000, { home: true, firstHome: true }).duty, 0);
  assert.equal(d('NSW', 1000000, { foreign: true }).surcharge, 90000);
});

test('Queensland matches QRO worked examples', () => {
  assert.equal(d('QLD', 850000).duty, 31275); // investment, general rate
  assert.equal(d('QLD', 950000, { home: true }).duty, 28600); // home concession
  assert.equal(d('QLD', 795000, { home: true, firstHome: true }).duty, 19890); // first home concession
  assert.equal(d('QLD', 700000, { home: true, firstHome: true }).duty, 0);
  assert.equal(d('QLD', 1500000, { home: true, firstHome: true, newHome: true }).duty, 0);
  assert.equal(d('QLD', 500000, { foreign: true }).surcharge, 40000);
});

test('Victoria general, PPR and first home buyer', () => {
  assert.equal(d('VIC', 750000).duty, 40070);
  assert.equal(d('VIC', 1000000).duty, 55000); // 5.5% of the whole value
  assert.equal(d('VIC', 2500000).duty, 110000 + 32500);
  assert.equal(d('VIC', 500000, { home: true }).duty, 18370 + 3600); // PPR rate
  assert.equal(d('VIC', 600000, { home: true, firstHome: true }).duty, 0);
  // taper matches independent published figures (estimate)
  const fhb = d('VIC', 650000, { home: true, firstHome: true });
  assert.equal(fhb.duty, 11356);
  assert.equal(fhb.estimate, true);
  assert.equal(d('VIC', 700000, { home: true, firstHome: true }).duty, 24713);
});

test('South Australia, WA and Tasmania tables', () => {
  assert.equal(d('SA', 500000).duty, 21330);
  assert.equal(d('SA', 600000, { home: true, firstHome: true, newHome: true }).duty, 0);
  assert.equal(d('SA', 600000, { home: true, firstHome: true }).duty, d('SA', 600000).duty); // established: no relief
  assert.equal(d('WA', 725000).duty, 28453);
  assert.equal(d('WA', 600000, { home: true, firstHome: true }).duty, 0);
  assert.equal(d('WA', 700000, { home: true, firstHome: true }).duty, Math.round(1000 * 16.15));
  assert.equal(d('WA', 150000, { home: true }).duty, 1800 + 300 * 4.04); // concessional rate
  assert.equal(d('TAS', 725000).duty, 27810);
  assert.equal(d('TAS', 2000).duty, 50);
});

test('ACT owner-occupier, investor and flat rate', () => {
  assert.equal(d('ACT', 750000, { home: true }).duty, 19208);
  assert.equal(d('ACT', 750000).duty, 22200);
  assert.equal(d('ACT', 2000000).duty, 90800); // 4.54% of total
  assert.equal(d('ACT', 900000, { home: true, firstHome: true }).duty, 0);
  assert.equal(d('ACT', 900000, { foreign: true }).surcharge, 0);
});

test('Northern Territory formula joins up with the 4.95% rate at $525,000', () => {
  const at = d('NT', 525000).duty;
  assert.ok(Math.abs(at - 525000 * 0.0495) < 1);
  assert.equal(d('NT', 500000).duty, Math.round(0.06571441 * 500 * 500 + 15 * 500));
  assert.equal(d('NT', 4000000).estimate, true);
});

test('"or part of $100" rounds the amount over a threshold up', () => {
  // QLD $540,001: $17,325 + $4.50 for one part-$100
  assert.equal(d('QLD', 540001).duty, 17330); // 17325 + 4.5 → 17329.5 → rounds to 17330
});

test('FAQ comparison figures match the calculator ($750,000 investment)', async () => {
  const { readFileSync } = await import('node:fs');
  const html = readFileSync('tools/stamp-duty.html', 'utf8');
  const fmt = (n) => `$${n.toLocaleString('en-AU')}`;
  for (const s of STATES) assert.ok(html.includes(fmt(d(s.code, 750000).duty)), `${s.code} figure ${fmt(d(s.code, 750000).duty)} missing from FAQ`);
});

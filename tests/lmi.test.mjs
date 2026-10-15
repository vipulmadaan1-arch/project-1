import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lmi, lvr, premiumRate, schemeCheck, LMI_DUTY, LMI_CHECKED } from '../js/lmi.js';

test('checked date is set', () => assert.equal(LMI_CHECKED, '15 Oct 2026'));

test('Home Loan Experts worked example: $90,000 at 90% LVR in Victoria', () => {
  // Source page: $90,000 x 1.463% = $1,316.70, plus 10% Victorian duty = $1,448.37.
  const r = lmi({ state: 'VIC', value: 100000, loan: 90000 });
  assert.equal(r.lvr, 90);
  assert.equal(r.rate, 1.463);
  assert.equal(r.premium, 1316.7);
  assert.equal(r.dutyOnPremium, 131.67);
  assert.equal(r.total, 1448.37);
  assert.equal(r.estimate, true);
});

test('no LMI at 80% LVR or less', () => {
  const r = lmi({ state: 'NSW', value: 800000, loan: 640000 });
  assert.equal(r.needed, false);
  assert.equal(r.total, 0);
  assert.equal(premiumRate(500000, 80), 0);
});

test('band edges: 80.01% is the first band, 85% stays in the 84-85 band', () => {
  assert.equal(premiumRate(250000, 80.01), 0.475);
  assert.equal(premiumRate(400000, 85), 0.969);
  assert.equal(premiumRate(400000, 85.01), 1.081);
  assert.equal(premiumRate(300000, 95), 2.609);
  assert.equal(premiumRate(300001, 95), 3.345);
});

test('loan size bands, and loans over $1m use the top band (flagged)', () => {
  assert.equal(premiumRate(1000000, 90), 2.516);
  const r = lmi({ state: 'NSW', value: 1250000, loan: 1125000 });
  assert.equal(r.rate, 2.516);
  assert.equal(r.aboveTable, true);
});

test('above 95% LVR there is no estimate', () => {
  const r = lmi({ state: 'QLD', value: 500000, loan: 490000 });
  assert.equal(r.overMax, true);
  assert.equal(r.total, null);
});

test('state duty on the premium', () => {
  assert.equal(LMI_DUTY.NSW.rate, 0);
  assert.equal(LMI_DUTY.ACT.rate, 0);
  const qld = lmi({ state: 'QLD', value: 700000, loan: 630000 });
  assert.equal(qld.premium, 14912.1); // 630,000 x 2.367%
  assert.equal(qld.dutyOnPremium, 1342.09);
  const sa = lmi({ state: 'SA', value: 700000, loan: 630000 });
  assert.equal(sa.dutyOnPremium, 1640.33);
  const nsw = lmi({ state: 'NSW', value: 700000, loan: 630000 });
  assert.equal(nsw.total, 14912.1);
});

test('5% Deposit Scheme check', () => {
  assert.equal(schemeCheck({ state: 'NSW', value: 1500000, loan: 1425000, firstHome: true }).eligible, true);
  assert.equal(schemeCheck({ state: 'NSW', value: 1500001, loan: 1425000, firstHome: true }).eligible, false);
  assert.equal(schemeCheck({ state: 'NSW', value: 900000, loan: 855000, firstHome: true, area: 'other' }).eligible, false);
  assert.equal(schemeCheck({ state: 'VIC', value: 600000, loan: 571000, firstHome: true }).eligible, false); // deposit under 5%
  assert.equal(schemeCheck({ state: 'VIC', value: 600000, loan: 570000, firstHome: false }).eligible, false);
  assert.equal(schemeCheck({ state: 'ACT', value: 1000000, loan: 950000, firstHome: true, area: 'other' }).cap, 1000000);
});

test('lvr rounding', () => assert.equal(lvr(540000, 600000), 90));

test('bad input gives null', () => {
  assert.equal(lmi({ state: 'XX', value: 1, loan: 1 }), null);
});

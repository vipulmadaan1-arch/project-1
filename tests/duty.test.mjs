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
  assert.equal(d('NT', 4000000).estimate, false); // rates confirmed by NT Treasury BP2 2024-25
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

test('foreign buyers: no first home relief without a citizen or PR, surcharge on full value', () => {
  const fhb = { home: true, firstHome: true, foreign: true };
  // WA fact sheet: first home owner rate needs a citizen/PR buyer; a foreign-only buyer pays general duty plus 7%.
  assert.equal(d('WA', 400000, fhb).duty, d('WA', 400000).duty);
  assert.equal(d('WA', 400000, fhb).surcharge, 28000);
  assert.equal(d('NSW', 700000, fhb).duty, d('NSW', 700000).duty);
  assert.equal(d('VIC', 500000, fhb).duty, d('VIC', 500000, { home: true }).duty); // PPR rate still applies in Victoria
  assert.equal(d('VIC', 500000, fhb).surcharge, 40000); // SRO example: 8% of $500,000, before concessions
  assert.equal(d('SA', 600000, { ...fhb, newHome: true }).duty, d('SA', 600000).duty);
  // Queensland from 1 August 2026: no home concession either, new home or not.
  assert.equal(d('QLD', 700000, { home: true, foreign: true }).duty, d('QLD', 700000).duty);
  assert.equal(d('QLD', 700000, { ...fhb, newHome: true }).duty, d('QLD', 700000).duty);
  // ACT and NT set no citizenship test and no surcharge.
  assert.equal(d('ACT', 1200000, fhb).duty, 0);
  assert.match(d('ACT', 1200000, fhb).note, /confirm/);
  assert.match(d('NSW', 700000, fhb).note, /citizen or permanent resident/);
  assert.match(d('NSW', 700000, { foreign: true }).foreignNote, /share/);
});

test('NT house and land package exemption for any home buyer', () => {
  assert.equal(d('NT', 900000, { home: true, newHome: true }).duty, 0);
  assert.equal(d('NT', 900000, { home: true }).duty, d('NT', 900000).duty);
  assert.equal(d('NT', 900000, { newHome: true }).duty, d('NT', 900000).duty); // must live in it
});

test('state page worked examples and FAQ figures match the calculator', async () => {
  const { readFileSync } = await import('node:fs');
  const fmt = (n) => `$${n.toLocaleString('en-AU')}`;
  const pages = {
    VIC: [d('VIC', 700000).duty, d('VIC', 700000, { home: true, firstHome: true }).duty, d('VIC', 500000, { home: true }).duty, d('VIC', 700000, { foreign: true }).total, d('VIC', 1000000).duty],
    QLD: [d('QLD', 700000, { home: true }).duty, d('QLD', 700000).duty, d('QLD', 750000, { home: true, firstHome: true }).duty, d('QLD', 700000, { home: true, foreign: true }).total, d('QLD', 1000000, { home: true }).duty],
    WA: [d('WA', 700000).duty, d('WA', 700000, { home: true, firstHome: true }).duty, d('WA', 650000, { home: true, firstHome: true }).duty, d('WA', 700000, { foreign: true }).total, d('WA', 1000000).duty],
  };
  for (const [code, figures] of Object.entries(pages)) {
    const html = readFileSync(`tools/stamp-duty-${code.toLowerCase()}.html`, 'utf8');
    assert.match(html, new RegExp(`<form class="card" id="form" data-state="${code}">`));
    for (const n of figures) assert.ok(html.includes(fmt(n)), `${code} figure ${fmt(n)} missing from tools/stamp-duty-${code.toLowerCase()}.html`);
  }
  assert.equal(d('QLD', 700000, { home: true, firstHome: true }).duty, 0);
  assert.equal(d('QLD', 1000000, { home: true, firstHome: true, newHome: true }).duty, 0);
});

test('QLD first home concession matches the QRO worked examples', () => {
  // https://qro.qld.gov.au/duties/transfer-duty/concessions/homes/first-home (checked 15 Oct 2026)
  const fhb = (value) => stampDuty({ state: 'QLD', value, home: true, firstHome: true }).duty;
  assert.equal(fhb(650000), 0);
  assert.equal(fhb(730000), 6555);
  assert.equal(fhb(850000), 24100);
});

test('WA first home owner rate from 7 May 2026 is one statewide scale', () => {
  // https://www.wa.gov.au/organisation/department-of-treasury-and-finance/transfer-duty-assessment (checked 15 Oct 2026):
  // $0–$600,000 no duty; $600,001–$800,000 $16.15 per $100 or part above $600,000. The Perth/regional split ended 6 May 2026.
  const fhb = (value) => stampDuty({ state: 'WA', value, home: true, firstHome: true }).duty;
  assert.equal(fhb(600000), 0);
  assert.equal(fhb(600001), 16); // $1 over is one "part of $100": $16.15, shown to the dollar
  assert.equal(fhb(700000), 16150);
  assert.equal(fhb(800000), 32300);
});

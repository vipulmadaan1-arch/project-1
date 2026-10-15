import { test } from 'node:test';
import assert from 'node:assert/strict';
import { wfhFixedRate, carCentsPerKm, carLogbook, taxFor, workDeductions, YEARS, CAR_KM_CAP, DEDUCTIONS_CHECKED } from '../js/deductions.js';

const cents = (n) => Math.round(n * 100);

test('ATO fixed rate examples: Keisha 843 hours = $590, Yang 567 hours = $396.90 (2025-26)', () => {
  assert.equal(workDeductions({ year: '2025-26', wfhHours: 843 }).total, 590);
  assert.equal(cents(wfhFixedRate(567, '2025-26').amount), 39690);
  assert.equal(workDeductions({ year: '2025-26', wfhHours: 136 }).total, 95); // Wanda, cents disregarded
});

test('ATO cents per km examples: Johan 2,514 km = $2,212; D1 instructions 3,250 km = $2,860 (2025-26)', () => {
  assert.equal(workDeductions({ year: '2025-26', km: 2514 }).total, 2212);
  assert.equal(workDeductions({ year: '2025-26', km: 3250 }).total, 2860);
});

test('car km are capped at 5,000 per car', () => {
  const r = carCentsPerKm(8000, '2026-27');
  assert.equal(CAR_KM_CAP, 5000);
  assert.equal(r.claimedKm, 5000);
  assert.equal(r.capped, true);
  assert.equal(cents(r.amount), 455000);
  assert.equal(carCentsPerKm(5000, '2024-25').capped, false);
  assert.equal(cents(carCentsPerKm(5000, '2024-25').amount), 440000);
});

test('year selection picks the right rates', () => {
  assert.equal(carCentsPerKm(1000, '2024-25').rate, 0.88);
  assert.equal(carCentsPerKm(1000, '2025-26').rate, 0.88);
  assert.equal(carCentsPerKm(1000, '2026-27').rate, 0.91);
  for (const y of Object.keys(YEARS)) assert.equal(wfhFixedRate(100, y).rate, 0.70);
  assert.equal(wfhFixedRate(100, '2025-26').estimate, false);
  assert.equal(wfhFixedRate(100, '2026-27').estimate, true); // not yet published by the ATO
  assert.throws(() => wfhFixedRate(1, '2023-24'));
  assert.equal(DEDUCTIONS_CHECKED, '15 Oct 2026');
});

test('logbook method: costs × business-use %', () => {
  assert.equal(carLogbook(12000, 40).amount, 4800);
  assert.equal(carLogbook(12000, 140).amount, 12000);
  assert.equal(workDeductions({ year: '2025-26', carMethod: 'logbook', carCosts: 9000, businessPct: 25, km: 9999 }).total, 2250);
});

test('tax: 16% second bracket to 2025-26, 15% in 2026-27', () => {
  assert.equal(taxFor(90000, '2025-26'), 4288 + 13500 + 1800);
  assert.equal(taxFor(90000, '2026-27'), 4020 + 13500 + 1800);
  assert.equal(taxFor(10000, '2024-25'), 0);
});

test('tax saving at the marginal rate plus Medicare', () => {
  const r = workDeductions({ year: '2025-26', wfhHours: 1000, km: 1000, taxableIncome: 90000 }); // $700 + $880
  assert.equal(r.total, 1580);
  assert.equal(Math.round(r.taxSaving), Math.round(1580 * 0.32));
  assert.equal(r.standard, 0);
  assert.equal(r.extra, null);
});

test('2026-27: claims replace the $1,000 standard deduction', () => {
  const small = workDeductions({ year: '2026-27', wfhHours: 500, taxableIncome: 90000 }); // $350
  assert.equal(small.standard, 1000);
  assert.equal(small.extra, -650);
  assert.ok(small.extraSaving < 0);
  const big = workDeductions({ year: '2026-27', km: 5000, taxableIncome: 90000 }); // $4,550
  assert.equal(big.extra, 3550);
  assert.equal(Math.round(big.extraSaving), Math.round(3550 * 0.32));
});

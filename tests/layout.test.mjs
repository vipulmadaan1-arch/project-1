import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseNumber, checkNumber, fmtMoney, moneyFieldText } from '../js/format.js';

test('parseNumber reads the ways people type amounts', () => {
  assert.equal(parseNumber(''), null);
  assert.equal(parseNumber('  '), null);
  assert.equal(parseNumber('750000'), 750000);
  assert.equal(parseNumber('$750,000'), 750000);
  assert.equal(parseNumber('AUD$1,250,000.50'), 1250000.5);
  assert.equal(parseNumber('1 000'), 1000);
  assert.equal(parseNumber('6.5%'), 6.5);
  assert.equal(parseNumber('.5'), 0.5);
  assert.equal(parseNumber('−200'), -200);
  assert.equal(parseNumber('-1,000'), -1000);
});

test('parseNumber: k and m suffixes', () => {
  assert.equal(parseNumber('650k'), 650000);
  assert.equal(parseNumber('650K'), 650000);
  assert.equal(parseNumber('$1.2m'), 1200000);
  assert.equal(parseNumber('1.15M'), 1150000);
  assert.equal(parseNumber('$1,200k'), 1200000);
  assert.ok(Number.isNaN(parseNumber('k')));
  assert.ok(Number.isNaN(parseNumber('1e3k')));
  assert.ok(Number.isNaN(parseNumber('5km')));
});

test('parseNumber: commas only as thousands separators', () => {
  assert.equal(parseNumber('1,000'), 1000);
  assert.equal(parseNumber('12,345,678.9'), 12345678.9);
  for (const bad of ['6,5', '650,50', '1,00', '1000,000', '1,0000', ',100', '1,,000', '1.000,50', 'abc', '1.2.3']) {
    assert.ok(Number.isNaN(parseNumber(bad)), `${bad} should not be a number`);
  }
});

test('checkNumber (behind readNumber): errors say what is wrong and how to fix it', () => {
  const money = { name: 'Loan amount', unit: 'money', min: 0, max: 1e12 };
  assert.deepEqual(checkNumber('650k', money), { n: 650000 });
  assert.deepEqual(checkNumber('', money), { n: null, empty: true, msg: 'Enter the loan amount' });
  assert.deepEqual(checkNumber('', { ...money, optional: true }), { n: 0 });
  assert.equal(checkNumber('abc', money).msg, 'Loan amount must be a number, like 750,000');
  assert.equal(checkNumber('650,50', money).msg, 'Use a full stop for cents, like 650.50');
  assert.equal(checkNumber('6,5', { name: 'Interest rate', unit: 'percent', min: 0, max: 100 }).msg, 'Use a full stop for decimals, like 6.5');
  assert.equal(checkNumber('-5', money).msg, 'Loan amount must be $0 or more');
  assert.equal(checkNumber('0', { name: 'Price', unit: 'money', above: 0 }).msg, 'Price must be more than $0');
  assert.equal(checkNumber('120', { name: 'Interest rate', unit: 'percent', min: 0, max: 100 }).msg, 'Interest rate must be between 0% and 100%');
  assert.equal(checkNumber('50', { name: 'Loan term', unit: 'years', min: 1, max: 40 }).msg, 'Loan term must be between 1 and 40 years');
  assert.equal(checkNumber('2.5', { name: 'Loan term', unit: 'years', whole: true }).msg, 'Loan term must be a whole number');
});

test('fmtMoney', () => {
  assert.equal(fmtMoney(113765), '$113,765');
  assert.equal(fmtMoney(1234.5, 2), '$1,234.50');
  assert.equal(fmtMoney(-0.2), '$0');
  assert.equal(fmtMoney(-1500), '-$1,500');
  assert.equal(fmtMoney(NaN), '–');
  assert.equal(fmtMoney(Infinity), '–');
  assert.match(fmtMoney(2e15), /^\$2(\.00)?e15$/i);
  // Cached formatters keep options apart.
  assert.equal(fmtMoney(1.5, 2), '$1.50');
  assert.equal(fmtMoney(1.5), '$2');
});

test('money fields regain separators but never lose typed digits', () => {
  assert.equal(moneyFieldText('750000'), '750,000');
  assert.equal(moneyFieldText('650k'), '650,000');
  assert.equal(moneyFieldText('1234.5'), '1,234.5');
  assert.equal(moneyFieldText('1234.567'), null);
  assert.equal(moneyFieldText('-5'), null);
  assert.equal(moneyFieldText('6,5'), null);
});

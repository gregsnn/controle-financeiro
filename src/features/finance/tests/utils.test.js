import assert from 'node:assert/strict';
import test from 'node:test';
import {
  formatMoney,
  monthKey,
  monthLabel,
  previousMonthKey,
  isMonthInRange,
  formatStartMonth,
  clone,
} from '../lib/utils.js';

test('formatMoney formats BRL currency', () => {
  const result = formatMoney(1000);
  assert.ok(result.includes('1.000'));
  assert.ok(result.includes('R$'));
});

test('formatMoney handles negative values', () => {
  const result = formatMoney(-500);
  assert.ok(result.includes('500'));
});

test('monthKey returns YYYY-MM format', () => {
  const date = new Date('2026-04-25T12:00:00');
  assert.equal(monthKey(date), '2026-04');
});

test('monthLabel returns Portuguese month year', () => {
  const date = new Date('2026-04-15T00:00:00');
  const label = monthLabel(date);
  assert.ok(label.toLowerCase().includes('abril'));
  assert.ok(label.includes('2026'));
});

test('previousMonthKey returns previous month', () => {
  assert.equal(previousMonthKey('2026-04'), '2026-03');
  assert.equal(previousMonthKey('2026-01'), '2025-12');
});

test('isMonthInRange checks boundaries', () => {
  assert.ok(isMonthInRange('2026-04', '2026-01', '2026-12'));
  assert.ok(!isMonthInRange('2025-12', '2026-01', '2026-12'));
  assert.ok(!isMonthInRange('2027-01', '2026-01', '2026-12'));
  assert.ok(isMonthInRange('2026-04', null, '2026-06'));
  assert.ok(isMonthInRange('2026-04', '2026-04', null));
});

test('formatStartMonth formats month key to short format', () => {
  assert.equal(formatStartMonth('2026-04'), 'Abr/2026');
  assert.equal(formatStartMonth('2026-01'), 'Jan/2026');
  assert.equal(formatStartMonth(null), '-');
  assert.equal(formatStartMonth(''), '-');
});

test('clone creates deep copy', () => {
  const original = { a: 1, b: { c: 2 } };
  const copy = clone(original);

  copy.b.c = 3;
  assert.equal(original.b.c, 2);
  assert.equal(copy.b.c, 3);
});

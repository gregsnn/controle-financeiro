import assert from 'node:assert/strict';
import test from 'node:test';
import { formatMoneyInput, applyMoneyMask, parseMoneyInput } from '../lib/moneyInput.js';

test('formatMoneyInput formats to BRL', () => {
  assert.equal(formatMoneyInput(1000), '1.000,00');
  assert.equal(formatMoneyInput(0), '0,00');
});

test('formatMoneyInput hides non-positive when option set', () => {
  assert.equal(formatMoneyInput(0, { hideNonPositive: true }), '');
  assert.equal(formatMoneyInput(-100, { hideNonPositive: true }), '');
  assert.equal(formatMoneyInput(100, { hideNonPositive: true }), '100,00');
});

test('applyMoneyMask handles digits only', () => {
  assert.equal(applyMoneyMask('100'), '1,00');
  assert.equal(applyMoneyMask('1000'), '10,00');
  assert.equal(applyMoneyMask('10000'), '100,00');
  assert.equal(applyMoneyMask('R$ 1.000,00'), '1.000,00');
  assert.equal(applyMoneyMask(''), '');
});

test('parseMoneyInput parses BRL string', () => {
  assert.equal(parseMoneyInput('1.000,00'), 1000);
  assert.equal(parseMoneyInput('100,00'), 100);
  assert.equal(parseMoneyInput('1000'), 1000);
});

test('parseMoneyInput returns null for invalid', () => {
  assert.equal(parseMoneyInput(''), null);
  assert.equal(parseMoneyInput(null), null);
  assert.equal(parseMoneyInput('abc'), null);
});

test('parseMoneyInput allowZero option', () => {
  assert.equal(parseMoneyInput('0,00', { allowZero: true }), 0);
  assert.equal(parseMoneyInput('0,00', { allowZero: false }), null);
});

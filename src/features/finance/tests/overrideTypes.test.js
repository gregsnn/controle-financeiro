import assert from 'node:assert/strict';
import test from 'node:test';
import { OVERRIDE_TYPES } from '../domain/constants.js';

test('OVERRIDE_TYPES has all required types', () => {
  assert.equal(OVERRIDE_TYPES.FIXED_EXPENSE, 'fixedExpense');
  assert.equal(OVERRIDE_TYPES.FIXED_EXPENSE_PAYMENT, 'fixedExpensePayment');
  assert.equal(OVERRIDE_TYPES.REVENUE, 'revenue');
  assert.equal(OVERRIDE_TYPES.INSTALLMENT_PAYMENT, 'installmentPayment');
  assert.equal(OVERRIDE_TYPES.CARD_BILL_AMOUNT, 'cardBillAmount');
  assert.equal(OVERRIDE_TYPES.CARD_BILL_PAYMENT, 'cardBillPayment');
});

test('OVERRIDE_TYPES values are unique strings', () => {
  const values = Object.values(OVERRIDE_TYPES);
  const unique = new Set(values);
  assert.equal(unique.size, values.length);
});

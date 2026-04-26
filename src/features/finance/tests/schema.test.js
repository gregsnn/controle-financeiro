import assert from 'node:assert/strict';
import test from 'node:test';
import { emptyFinanceState, financeSchemaVersion } from '../lib/schema.js';

test('financeSchemaVersion is a positive number', () => {
  assert.ok(typeof financeSchemaVersion === 'number');
  assert.ok(financeSchemaVersion > 0);
});

test('emptyFinanceState has all required fields', () => {
  assert.ok(emptyFinanceState.currentDate instanceof Date);
  assert.ok(Array.isArray(emptyFinanceState.fixedExpenses));
  assert.ok(Array.isArray(emptyFinanceState.installments));
  assert.ok(Array.isArray(emptyFinanceState.revenues));
  assert.ok(Array.isArray(emptyFinanceState.monthOverrides));
  assert.deepEqual(emptyFinanceState.fixedExpenses, []);
  assert.deepEqual(emptyFinanceState.installments, []);
  assert.deepEqual(emptyFinanceState.revenues, []);
});

test('emptyFinanceState has settings with theme', () => {
  assert.ok(emptyFinanceState.settings);
  assert.equal(emptyFinanceState.settings.theme, 'default');
});

test('emptyFinanceState has meta with schema version', () => {
  assert.ok(emptyFinanceState.meta);
  assert.equal(emptyFinanceState.meta.schemaVersion, financeSchemaVersion);
  assert.ok(emptyFinanceState.meta.createdAt);
});

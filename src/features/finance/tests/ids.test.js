import assert from 'node:assert/strict';
import test from 'node:test';
import { createFinanceId } from '../lib/ids.js';

test('createFinanceId generates unique IDs with prefix', () => {
  const id1 = createFinanceId('fixed');
  const id2 = createFinanceId('fixed');

  assert.match(id1, /^fixed_/);
  assert.match(id2, /^fixed_/);
  assert.notEqual(id1, id2);
});

test('createFinanceId generates different prefixes', () => {
  const id1 = createFinanceId('fixed');
  const id2 = createFinanceId('inst');

  assert.match(id1, /^fixed_/);
  assert.match(id2, /^inst_/);
});

test('createFinanceId contains timestamp', () => {
  const id = createFinanceId('rev');

  const parts = id.split('_');
  assert.ok(parts.length >= 2);
  assert.ok(parseInt(parts[1], 36) > 0);
});

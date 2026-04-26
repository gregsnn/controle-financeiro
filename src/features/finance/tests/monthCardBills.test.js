import assert from 'node:assert/strict';
import test from 'node:test';
import { selectMonthCardBills } from '../selectors/monthOverrideSelectors.js';
import { OVERRIDE_TYPES } from '../domain/constants.js';

test('selectMonthCardBills keeps values isolated by month', () => {
  const overrides = [
    {
      id: 'ovr-1',
      type: OVERRIDE_TYPES.CARD_BILL_AMOUNT,
      itemId: 'nubank',
      monthKey: '2026-04',
      amount: 1200,
    },
    {
      id: 'ovr-2',
      type: OVERRIDE_TYPES.CARD_BILL_AMOUNT,
      itemId: 'santander',
      monthKey: '2026-05',
      amount: 900,
    },
  ];

  const aprilBills = selectMonthCardBills(overrides, '2026-04');
  const mayBills = selectMonthCardBills(overrides, '2026-05');

  assert.deepEqual(aprilBills, { nubank: 1200 });
  assert.deepEqual(mayBills, { santander: 900 });
});

test('selectMonthCardBills ignores invalid and non-positive amounts', () => {
  const overrides = [
    {
      id: 'ovr-3',
      type: OVERRIDE_TYPES.CARD_BILL_AMOUNT,
      itemId: 'nubank',
      monthKey: '2026-04',
      amount: 0,
    },
    {
      id: 'ovr-4',
      type: OVERRIDE_TYPES.CARD_BILL_AMOUNT,
      itemId: 'santander',
      monthKey: '2026-04',
      amount: 'foo',
    },
  ];

  const bills = selectMonthCardBills(overrides, '2026-04');
  assert.deepEqual(bills, {});
});

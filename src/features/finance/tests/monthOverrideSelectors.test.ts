import { describe, it, expect } from 'vitest';
import {
  selectMonthFixedExpenseAmounts,
  selectMonthCardBillAmounts,
  selectMonthRevenueAmounts,
} from '../selectors/monthOverrideSelectors';
import { OVERRIDE_TYPES } from '../domain/constants';
import type { MonthOverride } from '../domain/types';

describe('monthOverrideSelectors.ts', () => {
  describe('selectMonthFixedExpenseAmounts', () => {
    it('filters FIXED_EXPENSE amount overrides for correct month', () => {
      const overrides: MonthOverride[] = [
        {
          id: 'o1',
          type: OVERRIDE_TYPES.FIXED_EXPENSE,
          itemId: 'luz',
          monthKey: '2026-04',
          amount: 180,
        },
        {
          id: 'o2',
          type: OVERRIDE_TYPES.FIXED_EXPENSE,
          itemId: 'luz',
          monthKey: '2026-05',
          amount: 220,
        },
        {
          id: 'o3',
          type: OVERRIDE_TYPES.FIXED_EXPENSE_PAYMENT,
          itemId: 'luz',
          monthKey: '2026-04',
          paid: true,
        },
      ];

      expect(selectMonthFixedExpenseAmounts(overrides, '2026-04')).toEqual({ luz: 180 });
    });

    it('allows zero and filters out negative fixed expense amounts', () => {
      const overrides: MonthOverride[] = [
        {
          id: 'o1',
          type: OVERRIDE_TYPES.FIXED_EXPENSE,
          itemId: 'luz',
          monthKey: '2026-04',
          amount: 0,
        },
        {
          id: 'o2',
          type: OVERRIDE_TYPES.FIXED_EXPENSE,
          itemId: 'agua',
          monthKey: '2026-04',
          amount: -10,
        },
      ];

      expect(selectMonthFixedExpenseAmounts(overrides, '2026-04')).toEqual({ luz: 0 });
    });
  });

  describe('selectMonthCardBillAmounts', () => {
    it('returns empty object when no overrides', () => {
      expect(selectMonthCardBillAmounts([], '2026-04')).toEqual({});
    });

    it('filters CARD_BILL_AMOUNT for correct month', () => {
      const overrides: MonthOverride[] = [
        {
          id: 'o1',
          type: OVERRIDE_TYPES.CARD_BILL_AMOUNT,
          itemId: 'nubank',
          monthKey: '2026-04',
          amount: 500,
        },
        {
          id: 'o2',
          type: OVERRIDE_TYPES.CARD_BILL_AMOUNT,
          itemId: 'santander',
          monthKey: '2026-03',
          amount: 300,
        },
        {
          id: 'o3',
          type: OVERRIDE_TYPES.FIXED_EXPENSE,
          itemId: '1',
          monthKey: '2026-04',
          amount: 100,
        },
      ];
      const result = selectMonthCardBillAmounts(overrides, '2026-04');
      expect(result).toEqual({ nubank: 500 });
    });

    it('filters out invalid amounts', () => {
      const overrides: MonthOverride[] = [
        {
          id: 'o1',
          type: OVERRIDE_TYPES.CARD_BILL_AMOUNT,
          itemId: 'nubank',
          monthKey: '2026-04',
          amount: 500,
        },
        {
          id: 'o2',
          type: OVERRIDE_TYPES.CARD_BILL_AMOUNT,
          itemId: 'santander',
          monthKey: '2026-04',
          amount: 0,
        },
        {
          id: 'o3',
          type: OVERRIDE_TYPES.CARD_BILL_AMOUNT,
          itemId: 'outro',
          monthKey: '2026-04',
          amount: -100,
        },
      ];
      const result = selectMonthCardBillAmounts(overrides, '2026-04');
      expect(result).toEqual({ nubank: 500 });
    });

    it('handles null/undefined overrides', () => {
      expect(selectMonthCardBillAmounts(null as any, '2026-04')).toEqual({});
      expect(selectMonthCardBillAmounts(undefined as any, '2026-04')).toEqual({});
    });
  });

  describe('selectMonthRevenueAmounts', () => {
    it('returns empty object when no overrides', () => {
      expect(selectMonthRevenueAmounts([], '2026-04')).toEqual({});
    });

    it('filters REVENUE_AMOUNT for correct month', () => {
      const overrides: MonthOverride[] = [
        {
          id: 'o1',
          type: OVERRIDE_TYPES.REVENUE_AMOUNT,
          itemId: 'r1',
          monthKey: '2026-04',
          amount: 5000,
        },
        {
          id: 'o2',
          type: OVERRIDE_TYPES.REVENUE_AMOUNT,
          itemId: 'r2',
          monthKey: '2026-03',
          amount: 3000,
        },
        { id: 'o3', type: OVERRIDE_TYPES.REVENUE, itemId: 'r1', monthKey: '2026-04', amount: 100 },
      ];
      const result = selectMonthRevenueAmounts(overrides, '2026-04');
      expect(result).toEqual({ r1: 5000 });
    });

    it('allows zero amount', () => {
      const overrides: MonthOverride[] = [
        {
          id: 'o1',
          type: OVERRIDE_TYPES.REVENUE_AMOUNT,
          itemId: 'r1',
          monthKey: '2026-04',
          amount: 0,
        },
      ];
      const result = selectMonthRevenueAmounts(overrides, '2026-04');
      expect(result).toEqual({ r1: 0 });
    });

    it('filters out negative amounts', () => {
      const overrides: MonthOverride[] = [
        {
          id: 'o1',
          type: OVERRIDE_TYPES.REVENUE_AMOUNT,
          itemId: 'r1',
          monthKey: '2026-04',
          amount: -100,
        },
      ];
      const result = selectMonthRevenueAmounts(overrides, '2026-04');
      expect(result).toEqual({});
    });
  });
});

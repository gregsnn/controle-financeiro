import { OVERRIDE_TYPES } from '../domain/constants.js';
import {
  filterByMonthAndType,
  getMonthRevenueAmounts,
  toAmountRecord,
} from '../domain/overrides/facade.js';
import type { MonthOverride } from '../domain/types.js';

export function selectMonthCardBillAmounts(
  monthOverrides: MonthOverride[],
  monthKey: string
): Record<string, number> {
  return toAmountRecord(
    filterByMonthAndType(monthOverrides, monthKey, OVERRIDE_TYPES.CARD_BILL_AMOUNT),
    false
  );
}

export function selectMonthFixedExpenseAmounts(
  monthOverrides: MonthOverride[],
  monthKey: string
): Record<string, number> {
  return toAmountRecord(
    filterByMonthAndType(monthOverrides, monthKey, OVERRIDE_TYPES.FIXED_EXPENSE),
    true
  );
}

export function selectMonthRevenueAmounts(
  monthOverrides: MonthOverride[],
  monthKey: string
): Record<string, number> {
  return getMonthRevenueAmounts(monthOverrides, monthKey);
}

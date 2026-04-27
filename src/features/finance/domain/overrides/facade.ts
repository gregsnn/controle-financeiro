import { OVERRIDE_TYPES } from '../constants';
import type { MonthOverride, OverrideType } from '../types';
import { filterByMonthAndType, findOverride, toAmountRecord } from './repository';

// Re-export for usage in selectors
export { filterByMonthAndType, toAmountRecord };

interface OverrideActions {
  upsertMonthOverride: (params: {
    type: OverrideType;
    itemId: string;
    monthKey: string;
    amount?: number;
    paid?: boolean;
  }) => void;
  clearMonthOverride: (params: { type: OverrideType; itemId: string; monthKey: string }) => void;
}

export function getMonthCardBills(
  monthOverrides: MonthOverride[],
  monthKey: string
): Record<string, number> {
  return toAmountRecord(
    filterByMonthAndType(monthOverrides, monthKey, OVERRIDE_TYPES.CARD_BILL_AMOUNT),
    false
  );
}

export function getMonthRevenueAmounts(monthOverrides: MonthOverride[], monthKey: string) {
  return toAmountRecord(
    filterByMonthAndType(monthOverrides, monthKey, OVERRIDE_TYPES.REVENUE_AMOUNT),
    true
  );
}

export function createOverrideMutations(currentKey: string, actions: OverrideActions) {
  const setAmount = (type: OverrideType, itemId: string, amount: number | null) => {
    if (amount === null) {
      actions.clearMonthOverride({ type, itemId, monthKey: currentKey });
      return;
    }
    actions.upsertMonthOverride({ type, itemId, monthKey: currentKey, amount });
  };

  const setPaid = (type: OverrideType, itemId: string, paid: boolean) => {
    if (!paid) {
      actions.clearMonthOverride({ type, itemId, monthKey: currentKey });
      return;
    }
    actions.upsertMonthOverride({ type, itemId, monthKey: currentKey, paid: true });
  };

  return {
    setCardBill: (card: string, amount: number | null) =>
      setAmount(OVERRIDE_TYPES.CARD_BILL_AMOUNT, card, amount),
    setRevenueAmount: (revenueId: string, amount: number | null) =>
      setAmount(OVERRIDE_TYPES.REVENUE_AMOUNT, revenueId, amount),
    setPaid,
  };
}

export function buildMonthPaymentMap(
  monthOverrides: MonthOverride[],
  monthKey: string,
  type: OverrideType
) {
  return new Map(
    filterByMonthAndType(monthOverrides, monthKey, type).map((override) => [
      override.itemId,
      override,
    ])
  );
}

export function isPaidForMonth(
  monthOverrides: MonthOverride[],
  identity: { type: OverrideType; itemId: string; monthKey: string }
) {
  return findOverride(monthOverrides, identity)?.paid === true;
}

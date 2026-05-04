import { useCallback, useMemo } from 'react';
import {
  createOverrideMutations,
  getMonthCardBills,
  getMonthRevenueAmounts,
} from '../domain/overrides/facade.js';
import type { MonthOverride, OverrideType } from '../domain/types.js';

interface UseMonthOverridesActionsParams {
  monthOverrides: MonthOverride[];
  currentKey: string;
  upsertMonthOverride: (params: {
    type: OverrideType;
    itemId: string;
    monthKey: string;
    amount?: number;
    paid?: boolean;
  }) => void;
  clearMonthOverride: (params: { type: OverrideType; itemId: string; monthKey: string }) => void;
}

export function useMonthOverridesActions({
  monthOverrides,
  currentKey,
  upsertMonthOverride,
  clearMonthOverride,
}: UseMonthOverridesActionsParams) {
  // Combine related computations into single useMemo to avoid multiple iterations
  const { monthCardBills, monthRevenueAmounts } = useMemo(() => {
    return {
      monthCardBills: getMonthCardBills(monthOverrides, currentKey),
      monthRevenueAmounts: getMonthRevenueAmounts(monthOverrides, currentKey),
    };
  }, [currentKey, monthOverrides]);

  const overrideMutations = useMemo(
    () => createOverrideMutations(currentKey, { upsertMonthOverride, clearMonthOverride }),
    [currentKey, upsertMonthOverride, clearMonthOverride]
  );

  const setMonthCardBill = useCallback(
    (card: string, amount: number | null) => {
      overrideMutations.setCardBill(card, amount);
    },
    [overrideMutations]
  );

  const setMonthRevenueAmount = useCallback(
    (revenueId: string, amount: number | null) => {
      overrideMutations.setRevenueAmount(revenueId, amount);
    },
    [overrideMutations]
  );

  const toggleMonthPaid = useCallback(
    (type: OverrideType, itemId: string, paid: boolean) => {
      overrideMutations.setPaid(type, itemId, paid);
    },
    [overrideMutations]
  );

  return {
    monthCardBills,
    monthRevenueAmounts,
    setMonthCardBill,
    setMonthRevenueAmount,
    toggleMonthPaid,
  };
}

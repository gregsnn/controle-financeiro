import { useCallback, useMemo } from 'react';
import { selectMonthCardBills, selectMonthRevenueAmounts } from '../selectors/monthOverrideSelectors.js';
import { OVERRIDE_TYPES } from '../domain/constants';

export function useMonthOverridesActions({
  monthOverrides,
  currentKey,
  upsertMonthOverride,
  clearMonthOverride,
}) {
  const monthCardBills = useMemo(
    () => selectMonthCardBills(monthOverrides, currentKey),
    [currentKey, monthOverrides]
  );

  const monthRevenueAmounts = useMemo(
    () => selectMonthRevenueAmounts(monthOverrides, currentKey),
    [currentKey, monthOverrides]
  );

  const setMonthCardBill = useCallback(
    (card, amount) => {
      if (amount === null) {
        clearMonthOverride({
          type: OVERRIDE_TYPES.CARD_BILL_AMOUNT,
          itemId: card,
          monthKey: currentKey,
        });
        return;
      }

      upsertMonthOverride({
        type: OVERRIDE_TYPES.CARD_BILL_AMOUNT,
        itemId: card,
        monthKey: currentKey,
        amount,
      });
    },
    [currentKey, upsertMonthOverride, clearMonthOverride]
  );

  const setMonthRevenueAmount = useCallback(
    (revenueId, amount) => {
      if (amount === null) {
        clearMonthOverride({
          type: OVERRIDE_TYPES.REVENUE_AMOUNT,
          itemId: revenueId,
          monthKey: currentKey,
        });
        return;
      }

      upsertMonthOverride({
        type: OVERRIDE_TYPES.REVENUE_AMOUNT,
        itemId: revenueId,
        monthKey: currentKey,
        amount,
      });
    },
    [currentKey, upsertMonthOverride, clearMonthOverride]
  );

  const toggleMonthPaid = useCallback(
    (type, itemId, paid) => {
      if (paid) {
        upsertMonthOverride({
          type,
          itemId,
          monthKey: currentKey,
          paid: true,
        });
        return;
      }

      clearMonthOverride({
        type,
        itemId,
        monthKey: currentKey,
      });
    },
    [currentKey, upsertMonthOverride, clearMonthOverride]
  );

  return {
    monthCardBills,
    monthRevenueAmounts,
    setMonthCardBill,
    setMonthRevenueAmount,
    toggleMonthPaid,
  };
}

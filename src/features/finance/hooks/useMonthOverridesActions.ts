import { useCallback, useMemo } from 'react';
import { DEFAULT_CARD_ID, OVERRIDE_TYPES } from '../domain/constants.js';
import {
  createOverrideMutations,
  getMonthCardBills,
  getMonthRevenueAmounts,
} from '../domain/overrides/facade.js';
import type { MonthOverride, MonthView, OverrideType } from '../domain/types.js';
import {
  buildTrackedCardBills,
  getExpenseCard,
  mergeCardBillsWithTrackedExpenses,
} from '../selectors/summarySelectors.js';

interface UseMonthOverridesActionsParams {
  monthOverrides: MonthOverride[];
  monthView: MonthView;
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

export function propagateCardBillPaid(
  monthView: MonthView,
  overrideMutations: ReturnType<typeof createOverrideMutations>,
  cardKey: string,
  paid: boolean
) {
  (monthView.fixedExpenses || []).forEach((expense) => {
    const card = getExpenseCard(expense as any);
    if (card === cardKey) {
      overrideMutations.setPaid(OVERRIDE_TYPES.FIXED_EXPENSE_PAYMENT, expense.id, paid);
    }
  });

  (monthView.installments || []).forEach((inst) => {
    const card = (inst.card || DEFAULT_CARD_ID) as string;
    if (card === cardKey) {
      overrideMutations.setPaid(OVERRIDE_TYPES.INSTALLMENT_PAYMENT, inst.id, paid);
    }
  });
}

export function useMonthOverridesActions({
  monthOverrides,
  monthView,
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

  const trackedCardBills = useMemo(() => buildTrackedCardBills(monthView), [monthView]);
  const effectiveMonthCardBills = useMemo(
    () => mergeCardBillsWithTrackedExpenses(monthCardBills, trackedCardBills),
    [monthCardBills, trackedCardBills]
  );

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

  const setMonthFixedExpenseAmount = useCallback(
    (fixedExpenseId: string, amount: number | null) => {
      overrideMutations.setFixedExpenseAmount(fixedExpenseId, amount);
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
      // Always set the primary override
      overrideMutations.setPaid(type, itemId, paid);

      // If a card bill is marked/unmarked as paid, propagate to related fixed expenses and installments
      if (type === OVERRIDE_TYPES.CARD_BILL_PAYMENT) {
        propagateCardBillPaid(monthView, overrideMutations, itemId, paid);
      }
    },
    [overrideMutations, monthView]
  );

  return {
    monthCardBills: effectiveMonthCardBills,
    monthRevenueAmounts,
    setMonthCardBill,
    setMonthFixedExpenseAmount,
    setMonthRevenueAmount,
    toggleMonthPaid,
  };
}

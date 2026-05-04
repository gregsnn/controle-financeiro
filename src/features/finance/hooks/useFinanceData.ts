import { useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { enrichCardsWithColors } from '../lib/bankColors';

export function useMonthView() {
  const { monthView, currentKey, currentDate } = useFinance();
  return useMemo(
    () => ({
      monthView,
      currentKey,
      currentDate,
    }),
    [monthView, currentKey, currentDate]
  );
}

export function useFinanceData() {
  const { fixedExpenses, installments, revenues, monthOverrides, meta } = useFinance();
  return useMemo(
    () => ({
      fixedExpenses,
      installments,
      revenues,
      monthOverrides,
      meta,
    }),
    [fixedExpenses, installments, revenues, monthOverrides, meta]
  );
}

export function useFinanceSettings() {
  const { settings } = useFinance();

  // Enrich cards with colors if not already defined
  return useMemo(() => {
    if (!settings.cardBills || settings.cardBills.length === 0) {
      return settings;
    }

    return {
      ...settings,
      cardBills: enrichCardsWithColors(settings.cardBills),
    };
  }, [settings]);
}

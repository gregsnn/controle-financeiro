import { useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';

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
  return settings;
}
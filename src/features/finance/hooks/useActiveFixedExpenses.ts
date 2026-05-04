import { useMemo } from 'react';
import type { FixedExpense } from '../domain/types';

export function useActiveFixedExpenses(items: FixedExpense[], currentMonthKey: string) {
  return useMemo(
    () => items.filter((item) => !item.endMonth || item.endMonth >= currentMonthKey),
    [items, currentMonthKey]
  );
}

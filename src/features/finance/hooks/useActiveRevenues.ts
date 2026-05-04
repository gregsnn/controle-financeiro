import { useMemo } from 'react';
import type { Revenue } from '../domain/types';
import { isMonthInRange } from '../lib/utils';

export function useActiveRevenues(items: Revenue[], currentMonthKey: string) {
  return useMemo(
    () =>
      items.filter(
        (item) =>
          item.active !== false && isMonthInRange(currentMonthKey, item.startMonth, item.endMonth)
      ),
    [items, currentMonthKey]
  );
}

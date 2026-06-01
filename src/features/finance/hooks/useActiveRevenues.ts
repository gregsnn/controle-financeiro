import { useMemo } from 'react';
import type { Revenue } from '../domain/types';
import { isMonthInRange } from '../lib/utils';

export function useActiveRevenues(items: Revenue[], currentMonthKey: string) {
  return useMemo(
    () =>
      items.filter((item) => {
        if (item.active === false) return false;
        if (item.recurring === false) return item.startMonth === currentMonthKey;
        return isMonthInRange(currentMonthKey, item.startMonth, item.endMonth);
      }),
    [items, currentMonthKey]
  );
}

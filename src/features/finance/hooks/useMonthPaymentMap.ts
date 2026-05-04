import { useMemo } from 'react';
import { buildMonthPaymentMap } from '../domain/overrides/facade';
import type { MonthOverride, OverrideType } from '../domain/types';

export function useMonthPaymentMap(
  monthOverrides: MonthOverride[],
  currentMonthKey: string,
  type: OverrideType
) {
  return useMemo(
    () => buildMonthPaymentMap(monthOverrides, currentMonthKey, type),
    [monthOverrides, currentMonthKey, type]
  );
}

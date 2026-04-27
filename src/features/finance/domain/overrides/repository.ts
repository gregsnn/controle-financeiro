import type { MonthOverride, OverrideType } from '../types';

interface OverrideIdentity {
  type: OverrideType;
  itemId: string;
  monthKey: string;
}

export function filterByMonthAndType(
  monthOverrides: MonthOverride[],
  monthKey: string,
  type: OverrideType
): MonthOverride[] {
  return (monthOverrides || []).filter(
    (override) => override.type === type && override.monthKey === monthKey
  );
}

export function findOverride(
  monthOverrides: MonthOverride[],
  identity: OverrideIdentity
): MonthOverride | undefined {
  return monthOverrides.find(
    (override) =>
      override.type === identity.type &&
      override.itemId === identity.itemId &&
      override.monthKey === identity.monthKey
  );
}

export function toAmountRecord(
  overrides: MonthOverride[],
  allowZero: boolean
): Record<string, number> {
  return overrides.reduce(
    (acc, override) => {
      const amount = Number(override.amount || 0);
      if (!Number.isFinite(amount)) return acc;
      if (allowZero ? amount < 0 : amount <= 0) return acc;
      acc[override.itemId] = amount;
      return acc;
    },
    {} as Record<string, number>
  );
}

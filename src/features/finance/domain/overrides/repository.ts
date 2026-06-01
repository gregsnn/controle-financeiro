import type { MonthOverride, OverrideType } from '../types';

interface OverrideIdentity {
  type: OverrideType;
  itemId: string;
  monthKey: string;
}

interface OverrideMatch {
  type?: OverrideType;
  itemId?: string;
  monthKey?: string;
}

export function matchOverride(override: MonthOverride, identity: OverrideMatch): boolean {
  if (identity.type !== undefined && override.type !== identity.type) return false;
  if (identity.itemId !== undefined && override.itemId !== identity.itemId) return false;
  if (identity.monthKey !== undefined && override.monthKey !== identity.monthKey) return false;
  return true;
}

export function filterByMonthAndType(
  monthOverrides: MonthOverride[],
  monthKey: string,
  type: OverrideType
): MonthOverride[] {
  return (monthOverrides || []).filter((override) => matchOverride(override, { type, monthKey }));
}

export function findOverride(
  monthOverrides: MonthOverride[],
  identity: OverrideIdentity
): MonthOverride | undefined {
  return monthOverrides.find((override) => matchOverride(override, identity));
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

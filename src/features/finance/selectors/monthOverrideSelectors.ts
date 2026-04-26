import { getMonthCardBills, getMonthRevenueAmounts } from '../domain/overrides/facade.js';
import type { MonthOverride } from '../domain/types.js';

export function selectMonthCardBills(monthOverrides: MonthOverride[], monthKey: string): Record<string, number> {
  return getMonthCardBills(monthOverrides, monthKey);
}

export function selectMonthRevenueAmounts(monthOverrides: MonthOverride[], monthKey: string): Record<string, number> {
  return getMonthRevenueAmounts(monthOverrides, monthKey);
}
import { OVERRIDE_TYPES } from '../domain/constants.js';

export function selectMonthCardBills(monthOverrides, monthKey) {
  return (monthOverrides || [])
    .filter(
      (override) =>
        override.type === OVERRIDE_TYPES.CARD_BILL_AMOUNT && override.monthKey === monthKey
    )
    .reduce((acc, override) => {
      const amount = Number(override.amount || 0);
      if (!Number.isFinite(amount) || amount <= 0) return acc;
      acc[override.itemId] = amount;
      return acc;
    }, {});
}

export function selectMonthRevenueAmounts(monthOverrides, monthKey) {
  return (monthOverrides || [])
    .filter(
      (override) =>
        override.type === OVERRIDE_TYPES.REVENUE_AMOUNT && override.monthKey === monthKey
    )
    .reduce((acc, override) => {
      const amount = Number(override.amount || 0);
      if (!Number.isFinite(amount) || amount < 0) return acc;
      acc[override.itemId] = amount;
      return acc;
    }, {});
}
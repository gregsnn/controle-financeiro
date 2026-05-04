import type {
  CardBillItem,
  FinanceState,
  FixedExpense,
  Installment,
  Meta,
  MonthOverride,
  MonthView,
  Revenue,
  Settings,
} from '../domain/types';

export type { CardBillItem };

export const financeSchemaVersion = 4;

export const DEFAULT_CARD_BILLS: CardBillItem[] = [
  // default to empty — cards are dynamic and user-managed
];

export type {
  FinanceState,
  FixedExpense,
  Installment,
  Meta,
  MonthOverride,
  MonthView,
  Revenue,
  Settings,
};

export function emptyFinanceState(): FinanceState {
  return {
    currentDate: new Date(),
    fixedExpenses: [],
    installments: [],
    revenues: [],
    monthOverrides: [],
    settings: { theme: 'default', cardBills: [] },
    meta: {
      schemaVersion: financeSchemaVersion,
      createdAt: new Date(),
      lastResetAt: null,
    },
  };
}

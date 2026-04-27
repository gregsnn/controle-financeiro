import type {
  FixedExpense,
  Installment,
  Revenue,
  MonthOverride,
  Settings,
  Meta,
  FinanceState,
  MonthView,
  CardBillItem,
} from '../domain/types';

export type { CardBillItem };

export const financeSchemaVersion = 4;

export const DEFAULT_CARD_BILLS: CardBillItem[] = [
  { id: 'santander', name: 'Santander', icon: '🔴' },
  { id: 'nubank', name: 'Nubank', icon: '💙' },
];

export type {
  FixedExpense,
  Installment,
  Revenue,
  MonthOverride,
  Settings,
  Meta,
  FinanceState,
  MonthView,
};

export function emptyFinanceState(): FinanceState {
  return {
    currentDate: new Date(),
    fixedExpenses: [],
    installments: [],
    revenues: [],
    monthOverrides: [],
    settings: { theme: 'default', cardBills: DEFAULT_CARD_BILLS },
    meta: {
      schemaVersion: financeSchemaVersion,
      createdAt: new Date(),
      lastResetAt: null,
    },
  };
}

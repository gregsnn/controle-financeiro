export interface FixedExpense {
  id: string;
  name: string;
  amount: number;
  dueDay: number;
  category: string;
  paymentMethod: string;
  card?: string | null;
  active: boolean;
  startMonth: string;
  endMonth: string | null;
  notes: string;
}

export interface Installment {
  id: string;
  name: string;
  totalInstallments: number;
  currentInstallment: number;
  installmentValue: number;
  card: string;
  category: string;
  startMonth: string;
  active: boolean;
  closedAt: string | null;
}

export interface Revenue {
  id: string;
  name: string;
  baseAmount: number;
  active: boolean;
  startMonth: string;
  endMonth: string | null;
  category: string;
  notes: string;
}

export type OverrideType =
  | 'fixedExpense'
  | 'fixedExpensePayment'
  | 'revenue'
  | 'revenueAmount'
  | 'installmentPayment'
  | 'cardBillAmount'
  | 'cardBillPayment';

export interface MonthOverride {
  id: string;
  type: OverrideType;
  itemId: string;
  monthKey: string;
  amount?: number;
  paid?: boolean;
}

export interface Settings {
  theme: 'default' | 'premium';
  cardBills?: CardBillItem[];
}

export interface Meta {
  schemaVersion: number;
  createdAt: Date;
  lastResetAt: Date | null;
}

export interface FinanceState {
  currentDate: Date;
  fixedExpenses: FixedExpense[];
  installments: Installment[];
  revenues: Revenue[];
  monthOverrides: MonthOverride[];
  settings: Settings;
  meta: Meta;
}

export interface MonthViewFixedExpense extends FixedExpense {
  paid: boolean;
}

export interface MonthViewInstallment extends Installment {
  paid: boolean;
}

export interface MonthView {
  fixedExpenses: MonthViewFixedExpense[];
  installments: MonthViewInstallment[];
  revenues: Revenue[];
  totals: {
    despesasFixas: number;
    receitas: number;
    installments: number;
  };
}

export type FinanceIdPrefix = 'fixed' | 'rev' | 'inst' | 'ovr' | 'test';

export interface CardBillItem {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

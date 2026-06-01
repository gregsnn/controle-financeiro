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

export interface InstallmentItem {
  id: string;
  name: string;
  installmentValue: number;
  totalInstallments: number;
  startMonth: string;
  card: string;
  currentInstallment: number;
}

export interface Revenue {
  id: string;
  name: string;
  baseAmount: number;
  active: boolean;
  startMonth: string;
  paymentDay?: number | null;
  recurring?: boolean;
  endMonth: string | null;
  notes: string;
}

export interface VariableExpense {
  id: string;
  name: string;
  amount: number;
  date: string;
  monthKey: string;
  category: string;
  paymentMethod: string;
  card?: string | null;
  paid: boolean;
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
  variableExpenses: VariableExpense[];
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

export interface MonthViewVariableExpense extends VariableExpense {}

export interface MonthView {
  fixedExpenses: MonthViewFixedExpense[];
  variableExpenses: MonthViewVariableExpense[];
  installments: MonthViewInstallment[];
  revenues: Revenue[];
  totals: {
    despesasFixas: number;
    despesasVariaveis: number;
    receitas: number;
    installments: number;
  };
}

export type FinanceIdPrefix = 'fixed' | 'var' | 'rev' | 'inst' | 'ovr' | 'test';

export interface CardBillItem {
  id: string;
  name: string;
  color?: string;
  dueDay?: number | null;
}

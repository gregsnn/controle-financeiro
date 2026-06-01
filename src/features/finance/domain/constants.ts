export const OVERRIDE_TYPES = {
  FIXED_EXPENSE: 'fixedExpense',
  FIXED_EXPENSE_PAYMENT: 'fixedExpensePayment',
  REVENUE: 'revenue',
  REVENUE_AMOUNT: 'revenueAmount',
  INSTALLMENT_PAYMENT: 'installmentPayment',
  CARD_BILL_AMOUNT: 'cardBillAmount',
  CARD_BILL_PAYMENT: 'cardBillPayment',
} as const;

export type OverrideType = (typeof OVERRIDE_TYPES)[keyof typeof OVERRIDE_TYPES];

export const ALLOWED_PAYMENT_METHODS = ['boleto', 'pix', 'debito', 'cartao'] as const;

export type PaymentMethod = (typeof ALLOWED_PAYMENT_METHODS)[number];

export const DEFAULT_CARD_ID = 'outro';

export const ALLOWED_BILL_CARDS = [DEFAULT_CARD_ID] as const;

export type BillCard = string;

export const PIE_MODES = ['categories', 'cards', 'cardsStatus'] as const;

export type PieMode = (typeof PIE_MODES)[number];

export const PAID_COLOR = '#1D9E75';
export const UNPAID_COLOR = '#D85A30';

export type Theme = 'default' | 'premium';

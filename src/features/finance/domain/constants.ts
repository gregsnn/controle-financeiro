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

export const ALLOWED_PAYMENT_METHODS = [
  'boleto',
  'pix',
  'debito',
  'cartao',
  'santander',
  'nubank',
] as const;

export type PaymentMethod = (typeof ALLOWED_PAYMENT_METHODS)[number];

export const ALLOWED_BILL_CARDS = ['santander', 'nubank', 'outro'] as const;

export type BillCard = (typeof ALLOWED_BILL_CARDS)[number];

export const PIE_MODES = ['categories', 'cards', 'cardsStatus'] as const;

export type PieMode = (typeof PIE_MODES)[number];

export const ICONS: Record<string, string> = {
  boleto: '📄',
  pix: '⚡',
  debito: '💳',
  cartao: '💳',
  santander: '🔴',
  nubank: '💙',
  outro: '💳',
};

export const CARD_ICONS: Record<BillCard, string> = {
  santander: '🔴',
  nubank: '💙',
  outro: '💳',
};

export const CATEGORIES: Record<string, string> = {
  casa: '🏠 CASA',
  telefone: '📱 TELEFONE',
  aluguel: '🏠 ALUGUEL',
  streaming: '🎬 STREAMING',
  seguro: '🔒 SEGURO',
  investimento: '📈 INVESTIMENTO',
  outro: '📦 OUTRO',
};

export const ACTION_ICONS = {
  edit: '✎',
  delete: '🗑',
} as const;

export interface Tab {
  id: string;
  labelKey: string;
}

export const TABS: Tab[] = [
  { id: 'resumo', labelKey: 'tabs.resumo' },
  { id: 'gastos', labelKey: 'tabs.gastos' },
  { id: 'parcelas', labelKey: 'tabs.parcelas' },
  { id: 'receitas', labelKey: 'tabs.receitas' },
];

export interface BillCardConfig {
  key: BillCard;
  label: string;
  icon?: string;
  color?: string;
}

export const BILL_CARDS: BillCardConfig[] = [
  { key: 'santander', label: 'Santander', icon: '🔴', color: '#EC0000' },
  { key: 'nubank', label: 'Nubank', icon: '💙', color: '#820AD1' },
];

export const BILL_CARD_KEYS = BILL_CARDS.map((card) => card.key);

export const CARD_ORDER = ['santander', 'nubank', 'outro'] as const;

export const CATEGORY_LABELS: Record<string, string> = {
  debito: 'DEBITO',
  credito: 'CREDITO',
  casa: 'CASA',
  telefone: 'TELEFONE',
  aluguel: 'ALUGUEL',
  cartao: 'CARTAO',
  streaming: 'STREAMING',
  seguro: 'SEGURO',
  outro: 'OUTRO',
};

export const CARD_LABELS: Record<BillCard, string> = {
  santander: 'SANTANDER',
  nubank: 'NUBANK',
  outro: 'OUTROS',
};

export const CARD_NAMES: Record<BillCard, string> = {
  santander: 'Santander',
  nubank: 'Nubank',
  outro: 'Outro',
};

export type Theme = 'default' | 'premium';

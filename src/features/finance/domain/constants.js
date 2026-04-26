export const OVERRIDE_TYPES = {
  FIXED_EXPENSE: 'fixedExpense',
  FIXED_EXPENSE_PAYMENT: 'fixedExpensePayment',
  REVENUE: 'revenue',
  REVENUE_AMOUNT: 'revenueAmount',
  INSTALLMENT_PAYMENT: 'installmentPayment',
  CARD_BILL_AMOUNT: 'cardBillAmount',
  CARD_BILL_PAYMENT: 'cardBillPayment',
};

export const ALLOWED_PAYMENT_METHODS = ['boleto', 'pix', 'debito', 'santander', 'nubank', 'cartao'];

export const ALLOWED_BILL_CARDS = ['santander', 'nubank', 'outro'];

export const ICONS = {
  boleto: '📄',
  pix: '⚡',
  debito: '💳',
  cartao: '💳',
  santander: '🔴',
  nubank: '💙',
  outro: '💳',
};

export const CARD_ICONS = {
  santander: '🔴',
  nubank: '💙',
  outro: '💳',
};

export const CATEGORIES = {
  debito: '💳 DÉBITO',
  credito: '💳 CRÉDITO',
  casa: '🏠 CASA',
  telefone: '📱 TELEFONE',
  aluguel: '🏠 ALUGUEL',
  cartao: '💳 CARTÃO',
  streaming: '🎬 STREAMING',
  seguro: '🔒 SEGURO',
  outro: '📦 OUTRO',
};

export const ACTION_ICONS = {
  edit: '✎',
  delete: '🗑',
};

export const TABS = [
  { id: 'resumo', labelKey: 'tabs.resumo' },
  { id: 'gastos', labelKey: 'tabs.gastos' },
  { id: 'parcelas', labelKey: 'tabs.parcelas' },
  { id: 'receitas', labelKey: 'tabs.receitas' },
];

export const BILL_CARDS = [
  { key: 'santander', label: 'Santander' },
  { key: 'nubank', label: 'Nubank' },
];

export const BILL_CARD_KEYS = BILL_CARDS.map((card) => card.key);

export const CARD_ORDER = ['santander', 'nubank', 'outro'];

export const CATEGORY_LABELS = {
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

export const CARD_LABELS = {
  santander: 'SANTANDER',
  nubank: 'NUBANK',
  outro: 'OUTROS',
};

export const CARD_NAMES = {
  santander: 'Santander',
  nubank: 'Nubank',
};
import type { CardBillItem, FixedExpense } from '../../../domain/types';
import { parseMoneyInput } from '../../../lib/moneyInput';
import type { FixedExpenseFormState } from './FixedExpenseForm';

const SPECIAL_PAYMENT_METHODS = ['boleto', 'pix', 'debito', 'cartao'] as const;

function resolvePaymentMethod(item: FixedExpense) {
  if (item.paymentMethod === 'cartao' && item.card) return item.card;
  return item.paymentMethod || 'boleto';
}

function isSpecialPaymentMethod(value: string) {
  return SPECIAL_PAYMENT_METHODS.includes(value as (typeof SPECIAL_PAYMENT_METHODS)[number]);
}

export function createFixedExpenseEmptyForm(
  currentMonthKey: string,
  defaultCardId = ''
): FixedExpenseFormState {
  return {
    name: '',
    amount: '',
    dueDay: '',
    startMonth: currentMonthKey,
    paymentMethod: defaultCardId || 'boleto',
    card: defaultCardId,
    category: 'outro',
  };
}

export function createFixedExpenseEditForm(
  item: FixedExpense,
  currentMonthKey: string
): FixedExpenseFormState {
  return {
    name: item.name || '',
    amount: item.amount.toFixed(2).replace('.', ','),
    dueDay: item.dueDay ? String(item.dueDay) : '',
    startMonth: item.startMonth || currentMonthKey,
    paymentMethod:
      item.paymentMethod === 'cartao' ? item.card || 'cartao' : resolvePaymentMethod(item),
    card: item.card || '',
    category: item.category || 'outro',
  };
}

export function buildFixedExpensePayload(
  currentForm: FixedExpenseFormState,
  cards: CardBillItem[]
): {
  name: string;
  amount: number;
  dueDay: number | null;
  startMonth: string;
  paymentMethod: string;
  card: string | null;
  category: string;
} | null {
  const amount = parseMoneyInput(currentForm.amount);
  if (amount === null) return null;

  const selectedCard = cards.find((card) => card.id === currentForm.paymentMethod);
  const legacyCard = !isSpecialPaymentMethod(currentForm.paymentMethod)
    ? currentForm.paymentMethod
    : null;

  return {
    name: currentForm.name,
    amount,
    dueDay: currentForm.dueDay ? Number(currentForm.dueDay) : null,
    startMonth: currentForm.startMonth,
    paymentMethod: selectedCard || legacyCard ? 'cartao' : currentForm.paymentMethod,
    card: selectedCard
      ? selectedCard.id
      : legacyCard
        ? legacyCard
        : currentForm.paymentMethod === 'cartao'
          ? currentForm.card || cards[0]?.id || 'outro'
          : null,
    category: currentForm.category,
  };
}

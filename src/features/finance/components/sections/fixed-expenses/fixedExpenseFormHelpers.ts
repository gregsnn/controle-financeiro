import { ALLOWED_PAYMENT_METHODS, DEFAULT_CARD_ID } from '../../../domain/constants';
import type { CardBillItem, FixedExpense } from '../../../domain/types';
import { parseMoneyInput } from '../../../lib/moneyInput';
import { resolvePaymentMethod } from '../../../lib/utils';
import { createFormHelpers } from '../shared/createFormHelpers';
import type { FixedExpenseFormState } from './FixedExpenseForm';

type FixedExpensePayload = {
  name: string;
  amount: number;
  dueDay: number | null;
  startMonth: string;
  paymentMethod: string;
  card: string | null;
  category: string;
};

function isSpecialPaymentMethod(value: string) {
  return ALLOWED_PAYMENT_METHODS.includes(value as (typeof ALLOWED_PAYMENT_METHODS)[number]);
}

const fixedExpenseFormHelpers = createFormHelpers<
  FixedExpenseFormState,
  FixedExpense,
  FixedExpensePayload,
  [currentMonthKey: string, defaultCardId?: string],
  [currentMonthKey: string],
  [cards: CardBillItem[]]
>({
  createEmptyForm: (currentMonthKey, defaultCardId = '') => ({
    name: '',
    amount: '',
    dueDay: '',
    startMonth: currentMonthKey,
    paymentMethod: defaultCardId || 'boleto',
    card: defaultCardId,
    category: 'outro',
  }),
  createEditForm: (item, currentMonthKey) => ({
    name: item.name || '',
    amount: item.amount.toFixed(2).replace('.', ','),
    dueDay: item.dueDay ? String(item.dueDay) : '',
    startMonth: item.startMonth || currentMonthKey,
    paymentMethod:
      item.paymentMethod === 'cartao' ? item.card || 'cartao' : resolvePaymentMethod(item),
    card: item.card || '',
    category: item.category || 'outro',
  }),
  buildPayload: (currentForm, cards) => {
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
            ? currentForm.card || cards[0]?.id || DEFAULT_CARD_ID
            : null,
      category: currentForm.category,
    };
  },
});

export const createFixedExpenseEmptyForm = fixedExpenseFormHelpers.createEmptyForm;
export const createFixedExpenseEditForm = fixedExpenseFormHelpers.createEditForm;
export const buildFixedExpensePayload = fixedExpenseFormHelpers.buildPayload;

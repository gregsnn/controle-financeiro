import { ALLOWED_PAYMENT_METHODS } from './constants';
import type { FixedExpense, Installment, Revenue } from './types';

export function normalizeFixedExpense(item: Record<string, unknown>): FixedExpense {
  const paymentMethod = item?.paymentMethod as string | undefined;
  const card = item?.card as string | undefined;

  if (paymentMethod === 'cartao' && (card === 'santander' || card === 'nubank')) {
    return { ...item, paymentMethod: card, card: null } as unknown as FixedExpense;
  }

  if (
    !ALLOWED_PAYMENT_METHODS.includes(paymentMethod as (typeof ALLOWED_PAYMENT_METHODS)[number])
  ) {
    return { ...item, paymentMethod: 'boleto', card: null } as unknown as FixedExpense;
  }

  if (paymentMethod !== 'cartao') {
    return { ...item, card: null } as unknown as FixedExpense;
  }

  return { ...item, card: card || 'outro' } as unknown as FixedExpense;
}

export function normalizeInstallment(item: Record<string, unknown>): Installment {
  const card = item?.card as string | undefined;
  const normalizedCard =
    card === 'santander' || card === 'nubank' || card === 'outro' ? card : 'outro';
  return { ...item, card: normalizedCard } as unknown as Installment;
}

export function normalizeRevenue(item: Record<string, unknown>): Revenue {
  const amount = item?.amount as number | undefined;
  const baseAmount = item?.baseAmount as number | undefined;

  if (amount !== undefined && baseAmount === undefined) {
    return { ...item, baseAmount: amount } as unknown as Revenue;
  }

  return item as unknown as Revenue;
}

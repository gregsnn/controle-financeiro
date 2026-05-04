import { createFinanceId } from '../lib/ids';
import { ALLOWED_PAYMENT_METHODS } from './constants';
import type { FixedExpense, Installment, Revenue } from './types';

export function normalizeFixedExpense(item: Record<string, unknown>): FixedExpense {
  const paymentMethod = item?.paymentMethod as string | undefined;
  const card = item?.card as string | undefined;

  if (paymentMethod === 'cartao') {
    const normalizedCard = card?.trim() === '' ? 'outro' : card || 'outro';
    return { ...item, paymentMethod: 'cartao', card: normalizedCard } as unknown as FixedExpense;
  }

  if (
    !ALLOWED_PAYMENT_METHODS.includes(paymentMethod as (typeof ALLOWED_PAYMENT_METHODS)[number])
  ) {
    return { ...item, paymentMethod: 'boleto', card: null } as unknown as FixedExpense;
  }

  // For non-cartao valid payment methods, remove card information
  return { ...item, card: null } as unknown as FixedExpense;
}

export function normalizeInstallment(item: Record<string, unknown>): Installment {
  const raw = item?.card;
  const trimmed =
    typeof raw === 'string'
      ? raw.trim()
      : typeof raw === 'number' && Number.isFinite(raw)
        ? String(raw)
        : '';
  const normalizedCard = trimmed !== '' ? trimmed : 'outro';
  return { ...item, card: normalizedCard } as unknown as Installment;
}

export function normalizeRevenue(item: Record<string, unknown>): Revenue {
  const amount = item?.amount as number | undefined;
  const baseAmount = item?.baseAmount as number | undefined;
  const id = item?.id as string | undefined;

  const updates: Record<string, unknown> = {};

  if (amount !== undefined && baseAmount === undefined) {
    updates.baseAmount = amount;
  }

  if (!id || id.trim() === '') {
    updates.id = createFinanceId('rev');
  }

  if (Object.keys(updates).length > 0) {
    return { ...item, ...updates } as unknown as Revenue;
  }

  return item as unknown as Revenue;
}

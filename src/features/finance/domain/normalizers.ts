import { createFinanceId } from '../lib/ids';
import { ALLOWED_PAYMENT_METHODS, DEFAULT_CARD_ID } from './constants';
import type { FixedExpense, Installment, Revenue, VariableExpense } from './types';

export function normalizeFixedExpense(item: Record<string, unknown>): FixedExpense {
  const paymentMethod = item?.paymentMethod as string | undefined;
  const card = item?.card as string | undefined;

  if (paymentMethod === 'cartao') {
    const normalizedCard = card?.trim() === '' ? DEFAULT_CARD_ID : card || DEFAULT_CARD_ID;
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
  const normalizedCard = trimmed !== '' ? trimmed : DEFAULT_CARD_ID;
  return { ...item, card: normalizedCard } as unknown as Installment;
}

export function normalizeRevenue(item: Record<string, unknown>): Revenue {
  const amount = item?.amount as number | undefined;
  const baseAmount = item?.baseAmount as number | undefined;
  const id = item?.id as string | undefined;

  const updates: Record<string, unknown> = {};
  const rest = { ...item };
  delete rest.category;

  if (amount !== undefined && baseAmount === undefined) {
    updates.baseAmount = amount;
  }

  if (!id || id.trim() === '') {
    updates.id = createFinanceId('rev');
  }

  if (item.recurring === undefined) {
    updates.recurring = true;
  }

  if (item.paymentDay === undefined) {
    updates.paymentDay = null;
  }

  if (Object.keys(updates).length > 0) {
    return { ...rest, ...updates } as unknown as Revenue;
  }

  return rest as unknown as Revenue;
}

export function normalizeVariableExpense(item: Record<string, unknown>): VariableExpense {
  const paymentMethod = item?.paymentMethod as string | undefined;
  const card = item?.card as string | undefined;
  const date = typeof item?.date === 'string' ? item.date : '';
  const monthKey =
    typeof item?.monthKey === 'string' && item.monthKey ? item.monthKey : date.slice(0, 7);

  const normalized: Record<string, unknown> = {
    id: typeof item?.id === 'string' && item.id.trim() !== '' ? item.id : createFinanceId('var'),
    name: typeof item?.name === 'string' ? item.name : '',
    amount: Number(item?.amount || 0),
    date: date || `${monthKey || new Date().toISOString().slice(0, 7)}-01`,
    monthKey: monthKey || new Date().toISOString().slice(0, 7),
    category: typeof item?.category === 'string' && item.category ? item.category : 'outro',
    paymentMethod,
    paid: item?.paid === undefined ? true : item.paid === true,
    notes: typeof item?.notes === 'string' ? item.notes : '',
  };

  if (paymentMethod === 'cartao') {
    normalized.card = card?.trim() === '' ? DEFAULT_CARD_ID : card || DEFAULT_CARD_ID;
    normalized.paymentMethod = 'cartao';
    normalized.paid = item?.paid === undefined ? false : item.paid === true;
    return normalized as VariableExpense;
  }

  if (
    !ALLOWED_PAYMENT_METHODS.includes(paymentMethod as (typeof ALLOWED_PAYMENT_METHODS)[number])
  ) {
    normalized.paymentMethod = 'pix';
    normalized.card = null;
    return normalized as VariableExpense;
  }

  normalized.card = null;
  return normalized as VariableExpense;
}

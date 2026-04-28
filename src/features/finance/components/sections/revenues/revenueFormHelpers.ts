import type { Revenue } from '../../../domain/types';
import { formatMoneyInput, parseMoneyInput } from '../../../lib/moneyInput';
import type { RevenueFormState } from './RevenueForm';

export function createRevenueEmptyForm(currentMonthKey: string): RevenueFormState {
  return { name: '', amount: '', startMonth: currentMonthKey };
}

export function createRevenueEditForm(item: Revenue, currentMonthKey: string): RevenueFormState {
  return {
    name: item.name || '',
    amount: formatMoneyInput(item.baseAmount),
    startMonth: item.startMonth || currentMonthKey,
  };
}

export function buildRevenuePayload(currentForm: RevenueFormState): {
  name: string;
  amount: number;
  startMonth: string;
} | null {
  const amount = parseMoneyInput(currentForm.amount);
  if (amount === null) return null;

  return {
    name: currentForm.name,
    amount,
    startMonth: currentForm.startMonth,
  };
}

export function toRevenueCreateItem(payload: { name: string; amount: number; startMonth: string }) {
  return {
    ...payload,
    baseAmount: payload.amount,
    active: true,
    endMonth: null,
    category: 'outro',
    notes: '',
  };
}

export function toRevenueEditItem(payload: { name: string; amount: number; startMonth: string }) {
  return {
    ...payload,
    baseAmount: payload.amount,
  };
}

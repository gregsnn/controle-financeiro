import type { Revenue } from '../../../domain/types';
import { formatMoneyInput, parseMoneyInput } from '../../../lib/moneyInput';
import { createFormHelpers } from '../shared/createFormHelpers';
import type { RevenueFormState } from './RevenueForm';

type RevenuePayload = {
  name: string;
  amount: number;
  startMonth: string;
  paymentDay: number | null;
  recurring: boolean;
};

const revenueFormHelpers = createFormHelpers<
  RevenueFormState,
  Revenue,
  RevenuePayload,
  [currentMonthKey: string],
  [currentMonthKey: string],
  [currentMonthKey: string]
>({
  createEmptyForm: (_currentMonthKey) => ({
    name: '',
    amount: '',
    startMonth: _currentMonthKey,
    paymentDay: '',
    recurring: true,
  }),
  createEditForm: (item, _currentMonthKey) => ({
    name: item.name || '',
    amount: formatMoneyInput(item.baseAmount),
    startMonth: item.startMonth || _currentMonthKey,
    paymentDay: item.paymentDay ? String(item.paymentDay) : '',
    recurring: item.recurring !== false,
  }),
  buildPayload: (currentForm, currentMonthKey) => {
    const amount = parseMoneyInput(currentForm.amount);
    if (amount === null) return null;
    const paymentDay = currentForm.paymentDay ? Number(currentForm.paymentDay) : null;

    return {
      name: currentForm.name,
      amount,
      startMonth: currentForm.startMonth || currentMonthKey,
      paymentDay:
        paymentDay !== null && Number.isFinite(paymentDay)
          ? Math.min(31, Math.max(1, paymentDay))
          : null,
      recurring: currentForm.recurring,
    };
  },
});

export const createRevenueEmptyForm = revenueFormHelpers.createEmptyForm;
export const createRevenueEditForm = revenueFormHelpers.createEditForm;
export const buildRevenuePayload = revenueFormHelpers.buildPayload;

export function toRevenueCreateItem(payload: RevenuePayload) {
  return {
    ...payload,
    baseAmount: payload.amount,
    paymentDay: payload.paymentDay,
    recurring: payload.recurring,
    active: true,
    endMonth: null,
    notes: '',
  };
}

export function toRevenueEditItem(payload: RevenuePayload) {
  return {
    ...payload,
    baseAmount: payload.amount,
    paymentDay: payload.paymentDay,
    recurring: payload.recurring,
  };
}

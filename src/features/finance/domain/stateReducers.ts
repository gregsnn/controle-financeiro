import { createFinanceId } from '../lib/ids';
import { previousMonthKey } from '../lib/utils';
import { OVERRIDE_TYPES } from './constants';
import type { FinanceState, FixedExpense, Installment, OverrideType, Revenue } from './types';

export function changeMonth(state: FinanceState, step: number): FinanceState {
  const next = new Date(state.currentDate);
  next.setMonth(next.getMonth() + step);
  return { ...state, currentDate: next };
}

export function resetDatabaseState(): null {
  return null;
}

export function importState(_prev: FinanceState | null, nextState: FinanceState): FinanceState {
  return nextState;
}

export function setTheme(state: FinanceState, theme: 'default' | 'premium'): FinanceState {
  return { ...state, settings: { ...state.settings, theme } };
}

export function setCardBills(
  state: FinanceState,
  cardBills: FinanceState['settings']['cardBills']
): FinanceState {
  return { ...state, settings: { ...state.settings, cardBills } };
}

export function addFixedExpense(state: FinanceState, data: Partial<FixedExpense>): FinanceState {
  return {
    ...state,
    fixedExpenses: [
      ...state.fixedExpenses,
      {
        id: createFinanceId('fixed'),
        active: true,
        notes: '',
        endMonth: null,
        ...data,
      } as FixedExpense,
    ],
  };
}

export function addRevenue(state: FinanceState, data: Partial<Revenue>): FinanceState {
  return {
    ...state,
    revenues: [
      ...state.revenues,
      {
        id: createFinanceId('rev'),
        active: true,
        notes: '',
        endMonth: null,
        ...data,
      } as Revenue,
    ],
  };
}

export function addInstallment(state: FinanceState, data: Partial<Installment>): FinanceState {
  return {
    ...state,
    installments: [
      ...state.installments,
      {
        id: createFinanceId('inst'),
        active: true,
        closedAt: null,
        currentInstallment: 1,
        ...data,
      } as Installment,
    ],
  };
}

export function updateFixedExpense(
  state: FinanceState,
  id: string,
  updates: Partial<FixedExpense>
): FinanceState {
  return {
    ...state,
    fixedExpenses: state.fixedExpenses.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    ),
  };
}

export function removeFixedExpense(state: FinanceState, id: string): FinanceState {
  const closingMonth = previousMonthKey(new Date(state.currentDate).toISOString().slice(0, 7));
  return {
    ...state,
    fixedExpenses: state.fixedExpenses.map((item) =>
      item.id === id
        ? {
            ...item,
            endMonth: item.endMonth && item.endMonth < closingMonth ? item.endMonth : closingMonth,
          }
        : item
    ),
  };
}

export function updateRevenue(
  state: FinanceState,
  id: string,
  updates: Partial<Revenue>
): FinanceState {
  return {
    ...state,
    revenues: state.revenues.map((item) => (item.id === id ? { ...item, ...updates } : item)),
  };
}

export function removeRevenue(state: FinanceState, id: string): FinanceState {
  const closingMonth = previousMonthKey(new Date(state.currentDate).toISOString().slice(0, 7));
  return {
    ...state,
    revenues: state.revenues.map((item) =>
      item.id === id
        ? {
            ...item,
            endMonth: item.endMonth && item.endMonth < closingMonth ? item.endMonth : closingMonth,
          }
        : item
    ),
  };
}

export function updateInstallment(
  state: FinanceState,
  id: string,
  updates: Partial<Installment>
): FinanceState {
  return {
    ...state,
    installments: state.installments.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    ),
  };
}

export function removeInstallment(state: FinanceState, id: string): FinanceState {
  const currentMonthKey = new Date(state.currentDate).toISOString().slice(0, 7);
  const closingMonth = previousMonthKey(currentMonthKey);
  return {
    ...state,
    installments: state.installments.map((item) =>
      item.id === id
        ? {
            ...item,
            closedAt: item.closedAt && item.closedAt < closingMonth ? item.closedAt : closingMonth,
          }
        : item
    ),
    monthOverrides: state.monthOverrides.filter(
      (override) =>
        !(override.type === OVERRIDE_TYPES.INSTALLMENT_PAYMENT && override.itemId === id)
    ),
  };
}

export interface UpsertOverrideParams {
  type: OverrideType;
  itemId: string;
  monthKey: string;
  amount?: number;
  name?: string;
  hidden?: boolean;
  paid?: boolean;
}

export function upsertMonthOverride(
  state: FinanceState,
  params: UpsertOverrideParams
): FinanceState {
  const { type, itemId, monthKey: overrideMonthKey, amount, name, hidden, paid } = params;

  const idx = state.monthOverrides.findIndex(
    (override) =>
      override.type === type && override.itemId === itemId && override.monthKey === overrideMonthKey
  );

  const cleaned = {
    ...(amount !== undefined ? { amount: Number(amount) } : {}),
    ...(name !== undefined ? { name } : {}),
    ...(hidden !== undefined ? { hidden } : {}),
    ...(typeof paid === 'boolean' ? { paid } : {}),
  };

  if (idx === -1) {
    return {
      ...state,
      monthOverrides: [
        ...state.monthOverrides,
        {
          id: createFinanceId('ovr'),
          type,
          itemId,
          monthKey: overrideMonthKey,
          ...cleaned,
        },
      ],
    };
  }

  const nextOverrides = [...state.monthOverrides];
  nextOverrides[idx] = { ...nextOverrides[idx], ...cleaned };
  return { ...state, monthOverrides: nextOverrides };
}

export function clearMonthOverride(
  state: FinanceState,
  params: { type: OverrideType; itemId: string; monthKey: string }
): FinanceState {
  const { type, itemId, monthKey: overrideMonthKey } = params;
  return {
    ...state,
    monthOverrides: state.monthOverrides.filter(
      (override) =>
        !(
          override.type === type &&
          override.itemId === itemId &&
          override.monthKey === overrideMonthKey
        )
    ),
  };
}

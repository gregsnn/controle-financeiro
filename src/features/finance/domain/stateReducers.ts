import { createFinanceId } from '../lib/ids';
import { softDeleteItem } from '../lib/utils';
import { OVERRIDE_TYPES } from './constants';
import {
  createDefaultFixedExpense,
  createDefaultInstallment,
  createDefaultRevenue,
  createDefaultVariableExpense,
} from './factories';
import { matchOverride } from './overrides/repository';
import type {
  CardBillItem,
  FinanceState,
  FixedExpense,
  Installment,
  OverrideType,
  Revenue,
  VariableExpense,
} from './types';

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
  const normalizedCardBills = (cardBills || []).map((card) => {
    const normalized: CardBillItem = { id: card.id, name: card.name };
    if (card.color) normalized.color = card.color;
    if (card.dueDay !== undefined) normalized.dueDay = card.dueDay;
    return normalized;
  });

  return { ...state, settings: { ...state.settings, cardBills: normalizedCardBills } };
}

export function addFixedExpense(state: FinanceState, data: Partial<FixedExpense>): FinanceState {
  return {
    ...state,
    fixedExpenses: [...state.fixedExpenses, createDefaultFixedExpense(data)],
  };
}

export function addRevenue(state: FinanceState, data: Partial<Revenue>): FinanceState {
  return {
    ...state,
    revenues: [...state.revenues, createDefaultRevenue(data)],
  };
}

export function addVariableExpense(
  state: FinanceState,
  data: Partial<VariableExpense>
): FinanceState {
  return {
    ...state,
    variableExpenses: [...(state.variableExpenses || []), createDefaultVariableExpense(data)],
  };
}

export function addInstallment(state: FinanceState, data: Partial<Installment>): FinanceState {
  return {
    ...state,
    installments: [...state.installments, createDefaultInstallment(data)],
  };
}

export function updateVariableExpense(
  state: FinanceState,
  id: string,
  updates: Partial<VariableExpense>
): FinanceState {
  return {
    ...state,
    variableExpenses: (state.variableExpenses || []).map((item) =>
      item.id === id ? { ...item, ...updates } : item
    ),
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

export function removeVariableExpense(state: FinanceState, id: string): FinanceState {
  return {
    ...state,
    variableExpenses: (state.variableExpenses || []).filter((item) => item.id !== id),
  };
}

export function removeFixedExpense(state: FinanceState, id: string): FinanceState {
  return {
    ...state,
    fixedExpenses: state.fixedExpenses.map((item) =>
      item.id === id ? softDeleteItem(item, state.currentDate) : item
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
  return {
    ...state,
    revenues: state.revenues.map((item) =>
      item.id === id ? softDeleteItem(item, state.currentDate) : item
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
  return {
    ...state,
    installments: state.installments.map((item) =>
      item.id === id ? softDeleteItem(item, state.currentDate, 'closedAt') : item
    ),
    monthOverrides: state.monthOverrides.filter(
      (override) =>
        !matchOverride(override, { type: OVERRIDE_TYPES.INSTALLMENT_PAYMENT, itemId: id })
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

  const idx = state.monthOverrides.findIndex((override) =>
    matchOverride(override, { type, itemId, monthKey: overrideMonthKey })
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
      (override) => !matchOverride(override, { type, itemId, monthKey: overrideMonthKey })
    ),
  };
}

import type { Dispatch, SetStateAction } from 'react';
import { financeRepository } from '../lib/storage';
import {
  addFixedExpense as addFixedExpenseReducer,
  addInstallment as addInstallmentReducer,
  addRevenue as addRevenueReducer,
  changeMonth as changeMonthReducer,
  clearMonthOverride as clearMonthOverrideReducer,
  importState as importStateReducer,
  removeFixedExpense as removeFixedExpenseReducer,
  removeInstallment as removeInstallmentReducer,
  removeRevenue as removeRevenueReducer,
  resetDatabaseState,
  setCardBills as setCardBillsReducer,
  setTheme as setThemeReducer,
  updateFixedExpense as updateFixedExpenseReducer,
  updateInstallment as updateInstallmentReducer,
  updateRevenue as updateRevenueReducer,
  upsertMonthOverride as upsertMonthOverrideReducer,
} from './stateReducers';
import type { FinanceState, FixedExpense, Installment, OverrideType, Revenue } from './types';
import type { UpsertOverrideParams } from './stateReducers';

type SetStateFunc = Dispatch<SetStateAction<FinanceState | null>>;

function withState(
  state: FinanceState | null,
  reducer: (state: FinanceState) => FinanceState
): FinanceState | null {
  if (!state) return state;
  return reducer(state);
}

export function createActions(_state: FinanceState, setState: SetStateFunc, _currentDate: Date) {
  return {
    changeMonth: (step: number) => {
      setState((prev) => withState(prev, (s) => changeMonthReducer(s, step)));
    },
    resetDatabase: async () => {
      await financeRepository.reset();
      setState(resetDatabaseState());
    },
    importFinanceState: (nextState: FinanceState) => {
      setState((_prev) => importStateReducer(_prev, nextState));
    },
    setTheme: (theme: 'default' | 'premium') =>
      setState((prev) => withState(prev, (s) => setThemeReducer(s, theme))),
    setCardBills: (cardBills: FinanceState['settings']['cardBills']) =>
      setState((prev) => withState(prev, (s) => setCardBillsReducer(s, cardBills))),
    addFixedExpense: (data: Partial<FixedExpense>) =>
      setState((prev) => withState(prev, (s) => addFixedExpenseReducer(s, data))),
    addRevenue: (data: Partial<Revenue>) =>
      setState((prev) => withState(prev, (s) => addRevenueReducer(s, data))),
    addInstallment: (data: Partial<Installment>) =>
      setState((prev) => withState(prev, (s) => addInstallmentReducer(s, data))),
    updateFixedExpense: (id: string, updates: Partial<FixedExpense>) =>
      setState((prev) => withState(prev, (s) => updateFixedExpenseReducer(s, id, updates))),
    removeFixedExpense: (id: string) =>
      setState((prev) => withState(prev, (s) => removeFixedExpenseReducer(s, id))),
    updateRevenue: (id: string, updates: Partial<Revenue>) =>
      setState((prev) => withState(prev, (s) => updateRevenueReducer(s, id, updates))),
    removeRevenue: (id: string) =>
      setState((prev) => withState(prev, (s) => removeRevenueReducer(s, id))),
    updateInstallment: (id: string, updates: Partial<Installment>) =>
      setState((prev) => withState(prev, (s) => updateInstallmentReducer(s, id, updates))),
    removeInstallment: (id: string) =>
      setState((prev) => withState(prev, (s) => removeInstallmentReducer(s, id))),
    upsertMonthOverride: (params: UpsertOverrideParams) =>
      setState((prev) => withState(prev, (s) => upsertMonthOverrideReducer(s, params))),
    clearMonthOverride: (params: { type: OverrideType; itemId: string; monthKey: string }) =>
      setState((prev) => withState(prev, (s) => clearMonthOverrideReducer(s, params))),
  };
}

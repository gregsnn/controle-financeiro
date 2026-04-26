import { useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { createFinanceId } from '../lib/ids';
import type { FixedExpense, Installment, Revenue } from '../domain/types';

export function useFinanceActions() {
  const {
    addFixedExpense: _addFixedExpense,
    addRevenue: _addRevenue,
    addInstallment: _addInstallment,
    updateFixedExpense: _updateFixedExpense,
    updateRevenue: _updateRevenue,
    updateInstallment: _updateInstallment,
    removeFixedExpense: _removeFixedExpense,
    removeRevenue: _removeRevenue,
    removeInstallment: _removeInstallment,
    upsertMonthOverride: _upsertMonthOverride,
    clearMonthOverride: _clearMonthOverride,
    changeMonth: _changeMonth,
resetDatabase: _resetDatabase,
    setTheme: _setTheme,
    setCardBills: _setCardBills,
  } = useFinance();

  const actions = useMemo(
    () => ({
      addFixedExpense: (data: Partial<FixedExpense>) =>
        _addFixedExpense({
          id: createFinanceId('fixed'),
          active: true,
          notes: '',
          endMonth: null,
          ...data,
        }),
      addRevenue: (data: Partial<Revenue>) => {
          const { amount, ...rest } = data;
          return _addRevenue({
            id: createFinanceId('rev'),
            active: true,
            notes: '',
            endMonth: null,
            baseAmount: amount || 0,
            ...rest,
          });
        },
      addInstallment: (data: Partial<Installment>) =>
        _addInstallment({
          id: createFinanceId('inst'),
          active: true,
          closedAt: null,
          currentInstallment: 1,
          ...data,
        }),
      updateFixedExpense: _updateFixedExpense,
updateRevenue: (id: string, data: Partial<Revenue>) => {
          const { amount, ...rest } = data;
          return _updateRevenue(id, {
            ...rest,
            ...(amount !== undefined && { baseAmount: amount }),
          });
        },
      updateInstallment: _updateInstallment,
      removeFixedExpense: _removeFixedExpense,
      removeRevenue: _removeRevenue,
      removeInstallment: _removeInstallment,
      upsertMonthOverride: _upsertMonthOverride,
      clearMonthOverride: _clearMonthOverride,
      changeMonth: _changeMonth,
      resetDatabase: _resetDatabase,
      setTheme: _setTheme,
      setCardBills: _setCardBills,
    }),
    [
      _addFixedExpense,
      _addRevenue,
      _addInstallment,
      _updateFixedExpense,
      _updateRevenue,
      _updateInstallment,
      _removeFixedExpense,
      _removeRevenue,
      _removeInstallment,
      _upsertMonthOverride,
      _clearMonthOverride,
      _changeMonth,
      _resetDatabase,
      _setTheme,
      _setCardBills,
    ]
  );

  return actions;
}
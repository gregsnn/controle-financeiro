import { useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { createFinanceId } from '../lib/ids';
import { OVERRIDE_TYPES } from '../domain/constants';

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
  } = useFinance();

  const actions = useMemo(
    () => ({
      addFixedExpense: (data) =>
        _addFixedExpense({
          id: createFinanceId('fixed'),
          active: true,
          notes: '',
          endMonth: null,
          ...data,
        }),
      addRevenue: (data) =>
        _addRevenue({
          id: createFinanceId('rev'),
          active: true,
          notes: '',
          endMonth: null,
          ...data,
        }),
      addInstallment: (data) =>
        _addInstallment({
          id: createFinanceId('inst'),
          active: true,
          closedAt: null,
          currentInstallment: 1,
          ...data,
        }),
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
    ]
  );

  return actions;
}

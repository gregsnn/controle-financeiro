import { useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import {
  createDefaultFixedExpense,
  createDefaultInstallment,
  createDefaultRevenue,
  createDefaultVariableExpense,
} from '../domain/factories';
import type { FixedExpense, Installment, Revenue, VariableExpense } from '../domain/types';

export function useFinanceActions() {
  const {
    addFixedExpense: _addFixedExpense,
    addVariableExpense: _addVariableExpense,
    addRevenue: _addRevenue,
    addInstallment: _addInstallment,
    updateFixedExpense: _updateFixedExpense,
    updateVariableExpense: _updateVariableExpense,
    updateRevenue: _updateRevenue,
    updateInstallment: _updateInstallment,
    removeFixedExpense: _removeFixedExpense,
    removeVariableExpense: _removeVariableExpense,
    removeRevenue: _removeRevenue,
    removeInstallment: _removeInstallment,
    upsertMonthOverride: _upsertMonthOverride,
    clearMonthOverride: _clearMonthOverride,
    changeMonth: _changeMonth,
    resetDatabase: _resetDatabase,
    importFinanceState: _importFinanceState,
    setTheme: _setTheme,
    setCardBills: _setCardBills,
  } = useFinance();

  const actions = useMemo(
    () => ({
      addFixedExpense: (data: Partial<FixedExpense>) =>
        _addFixedExpense(createDefaultFixedExpense(data)),
      addVariableExpense: (data: Partial<VariableExpense>) =>
        _addVariableExpense(createDefaultVariableExpense(data)),
      addRevenue: (data: Partial<Revenue>) => _addRevenue(createDefaultRevenue(data)),
      addInstallment: (data: Partial<Installment>) =>
        _addInstallment(createDefaultInstallment(data)),
      updateFixedExpense: _updateFixedExpense,
      updateVariableExpense: _updateVariableExpense,
      updateRevenue: _updateRevenue,
      updateInstallment: _updateInstallment,
      removeFixedExpense: _removeFixedExpense,
      removeVariableExpense: _removeVariableExpense,
      removeRevenue: _removeRevenue,
      removeInstallment: _removeInstallment,
      upsertMonthOverride: _upsertMonthOverride,
      clearMonthOverride: _clearMonthOverride,
      changeMonth: _changeMonth,
      resetDatabase: _resetDatabase,
      importFinanceState: _importFinanceState,
      setTheme: _setTheme,
      setCardBills: _setCardBills,
    }),
    [
      _addFixedExpense,
      _addVariableExpense,
      _addRevenue,
      _addInstallment,
      _updateFixedExpense,
      _updateVariableExpense,
      _updateRevenue,
      _updateInstallment,
      _removeFixedExpense,
      _removeVariableExpense,
      _removeRevenue,
      _removeInstallment,
      _upsertMonthOverride,
      _clearMonthOverride,
      _changeMonth,
      _resetDatabase,
      _importFinanceState,
      _setTheme,
      _setCardBills,
    ]
  );

  return actions;
}

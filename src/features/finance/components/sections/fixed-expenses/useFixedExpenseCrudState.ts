import { useMemo, useState } from 'react';
import type { FixedExpense } from '../../../domain/types';
import type { FixedExpenseFormState } from './FixedExpenseForm';
import { createFixedExpenseEditForm, createFixedExpenseEmptyForm } from './fixedExpenseFormHelpers';

interface UseFixedExpenseCrudStateParams {
  currentMonthKey: string;
  defaultCardId?: string;
  onDelete?: (id: string) => Promise<void> | void;
}

export function useFixedExpenseCrudState({
  currentMonthKey,
  defaultCardId = '',
  onDelete,
}: UseFixedExpenseCrudStateParams) {
  const [form, setForm] = useState<FixedExpenseFormState>(
    createFixedExpenseEmptyForm(currentMonthKey, defaultCardId)
  );

  const canSubmit = useMemo(
    () => !!(form.name.trim() && form.amount !== '' && form.startMonth.trim()),
    [form]
  );

  const openCreateForm = () => {
    setForm(createFixedExpenseEmptyForm(currentMonthKey, defaultCardId));
  };

  const openEditForm = (item: FixedExpense) => {
    setForm(createFixedExpenseEditForm(item, currentMonthKey));
  };

  const resetForm = () => {
    setForm(createFixedExpenseEmptyForm(currentMonthKey, defaultCardId));
  };

  const handleDelete = async (item: FixedExpense) => {
    if (onDelete) await onDelete(item.id);
  };

  return {
    form,
    setForm,
    canSubmit,
    openCreateForm,
    openEditForm,
    resetForm,
    handleDelete,
  };
}

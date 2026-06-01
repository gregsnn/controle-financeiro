import type { FixedExpense } from '../../../domain/types';
import type { FixedExpenseFormState } from './FixedExpenseForm';
import { useCrudState } from '../shared/useCrudState';
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
  return useCrudState<FixedExpenseFormState, FixedExpense>({
    createEmptyForm: () => createFixedExpenseEmptyForm(currentMonthKey, defaultCardId),
    createEditForm: (item) => createFixedExpenseEditForm(item, currentMonthKey),
    canSubmit: (form) => !!(form.name.trim() && form.amount !== '' && form.startMonth.trim()),
    onDelete,
  });
}

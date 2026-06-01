import type { Revenue } from '../../../domain/types';
import type { RevenueFormState } from './RevenueForm';
import { useCrudState } from '../shared/useCrudState';
import { createRevenueEditForm, createRevenueEmptyForm } from './revenueFormHelpers';

interface UseRevenueCrudStateParams {
  currentMonthKey: string;
  onDelete: (id: string) => Promise<void> | void;
}

export function useRevenueCrudState({ currentMonthKey, onDelete }: UseRevenueCrudStateParams) {
  return useCrudState<RevenueFormState, Revenue>({
    createEmptyForm: () => createRevenueEmptyForm(currentMonthKey),
    createEditForm: (item) => createRevenueEditForm(item, currentMonthKey),
    canSubmit: (form) => !!(form.name.trim() && form.amount !== ''),
    onDelete,
  });
}

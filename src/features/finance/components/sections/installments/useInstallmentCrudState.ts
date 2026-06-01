import type { InstallmentFormState } from './InstallmentForm';
import { useCrudState } from '../shared/useCrudState';
import { createInstallmentEditForm, createInstallmentEmptyForm } from './installmentFormHelpers';

interface UseInstallmentCrudStateParams {
  defaultCardId?: string;
  onDelete: (id: string) => Promise<void> | void;
}

export function useInstallmentCrudState({
  defaultCardId = '',
  onDelete,
}: UseInstallmentCrudStateParams) {
  return useCrudState<InstallmentFormState, { id: string; name: string }>({
    createEmptyForm: () => createInstallmentEmptyForm(defaultCardId),
    createEditForm: (item) => createInstallmentEditForm(item as any),
    canSubmit: (form) =>
      !!(
        form.name.trim() &&
        form.installmentValue !== '' &&
        form.totalInstallments !== '' &&
        form.startMonth.trim()
      ),
    onDelete,
  });
}

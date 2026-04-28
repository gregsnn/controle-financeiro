import { useMemo, useState } from 'react';
import type { InstallmentFormState } from './InstallmentForm';
import { createInstallmentEditForm, createInstallmentEmptyForm } from './installmentFormHelpers';

interface UseInstallmentCrudStateParams {
  defaultCardId?: string;
  onDelete: (id: string) => Promise<void> | void;
}

export function useInstallmentCrudState({
  defaultCardId = '',
  onDelete,
}: UseInstallmentCrudStateParams) {
  const [form, setForm] = useState<InstallmentFormState>(createInstallmentEmptyForm(defaultCardId));

  const canSubmit = useMemo(
    () =>
      !!(
        form.name.trim() &&
        form.installmentValue !== '' &&
        form.totalInstallments !== '' &&
        form.startMonth.trim()
      ),
    [form]
  );

  const openCreateForm = () => {
    setForm(createInstallmentEmptyForm(defaultCardId));
  };

  const openEditForm = (item: { id: string; name: string }) => {
    setForm(createInstallmentEditForm(item as any));
  };

  const resetForm = () => {
    setForm(createInstallmentEmptyForm(defaultCardId));
  };

  const handleDelete = async (id: string) => {
    await onDelete(id);
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

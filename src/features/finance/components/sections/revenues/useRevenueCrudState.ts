import { useMemo, useState } from 'react';
import type { Revenue } from '../../../domain/types';
import type { RevenueFormState } from './RevenueForm';
import { createRevenueEditForm, createRevenueEmptyForm } from './revenueFormHelpers';

interface UseRevenueCrudStateParams {
  currentMonthKey: string;
  onDelete: (id: string) => Promise<void> | void;
}

export function useRevenueCrudState({ currentMonthKey, onDelete }: UseRevenueCrudStateParams) {
  const [form, setForm] = useState<RevenueFormState>(createRevenueEmptyForm(currentMonthKey));

  const canSubmit = useMemo(
    () => !!(form.name.trim() && form.amount !== '' && form.startMonth.trim()),
    [form]
  );

  const openCreateForm = () => {
    setForm(createRevenueEmptyForm(currentMonthKey));
  };

  const openEditForm = (item: Revenue) => {
    setForm(createRevenueEditForm(item, currentMonthKey));
  };

  const resetForm = () => {
    setForm(createRevenueEmptyForm(currentMonthKey));
  };

  const handleDelete = async (item: Revenue) => {
    await onDelete(item.id);
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

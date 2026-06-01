import { useMemo, useState } from 'react';

interface UseCrudStateOptions<TForm, TItem> {
  createEmptyForm: () => TForm;
  createEditForm: (item: TItem) => TForm;
  canSubmit: (form: TForm) => boolean;
  onDelete?: (id: string) => Promise<void> | void;
  getDeleteId?: (item: TItem) => string;
}

export function useCrudState<TForm, TItem>({
  createEmptyForm,
  createEditForm,
  canSubmit: resolveCanSubmit,
  onDelete,
  getDeleteId = (item) => (item as { id: string }).id,
}: UseCrudStateOptions<TForm, TItem>) {
  const [form, setForm] = useState<TForm>(() => createEmptyForm());

  const canSubmit = useMemo(() => resolveCanSubmit(form), [form, resolveCanSubmit]);

  const openCreateForm = () => {
    setForm(createEmptyForm());
  };

  const openEditForm = (item: TItem) => {
    setForm(createEditForm(item));
  };

  const resetForm = () => {
    setForm(createEmptyForm());
  };

  const handleDelete = async (item: TItem) => {
    if (onDelete) await onDelete(getDeleteId(item));
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

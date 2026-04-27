import type { FormEvent } from 'react';
import { useCallback } from 'react';

interface CrudModalState {
  mode: 'create' | 'edit';
  itemId: string | null;
}

interface UseCrudFormFlowParams<TForm, TPayload> {
  modal: CrudModalState;
  form: TForm;
  canSubmit: boolean;
  closeModal: () => void;
  resetForm: () => void;
  buildPayload: (form: TForm) => TPayload | null;
  onAdd: (payload: TPayload) => Promise<void> | void;
  onEdit: (id: string, payload: TPayload) => Promise<void> | void;
}

export function useCrudFormFlow<TForm, TPayload>({
  modal,
  form,
  canSubmit,
  closeModal,
  resetForm,
  buildPayload,
  onAdd,
  onEdit,
}: UseCrudFormFlowParams<TForm, TPayload>) {
  return useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      if (!canSubmit) return;

      const payload = buildPayload(form);
      if (!payload) return;
      if (modal.mode === 'edit' && modal.itemId) {
        await onEdit(modal.itemId, payload);
      } else {
        await onAdd(payload);
      }

      closeModal();
      resetForm();
    },
    [buildPayload, canSubmit, closeModal, form, modal.itemId, modal.mode, onAdd, onEdit, resetForm]
  );
}

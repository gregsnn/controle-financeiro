import { useState } from 'react';

export type CrudMode = 'create' | 'edit';

export interface CrudModalState {
  open: boolean;
  mode: CrudMode;
  itemId: string | null;
}

interface ConfirmState<T> {
  open: boolean;
  item: T | null;
}

const closedModalState: CrudModalState = { open: false, mode: 'create', itemId: null };

export function useCrudModalState<T>() {
  const [modal, setModal] = useState<CrudModalState>(closedModalState);
  const [confirm, setConfirm] = useState<ConfirmState<T>>({ open: false, item: null });

  const openCreateModal = () => setModal({ open: true, mode: 'create', itemId: null });
  const openEditModal = (itemId: string) => setModal({ open: true, mode: 'edit', itemId });
  const closeModal = () => setModal(closedModalState);

  const openDeleteConfirm = (item: T) => setConfirm({ open: true, item });
  const closeDeleteConfirm = () => setConfirm({ open: false, item: null });

  return {
    modal,
    confirm,
    setModal,
    openCreateModal,
    openEditModal,
    closeModal,
    openDeleteConfirm,
    closeDeleteConfirm,
  };
}

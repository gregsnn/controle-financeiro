import { useState } from 'react';

type CrudMode = 'create' | 'edit';

interface ModalState {
  open: boolean;
  mode: CrudMode;
  itemId: string | null;
}

interface ConfirmState<T> {
  open: boolean;
  item: T | null;
}

const closedModalState: ModalState = { open: false, mode: 'create', itemId: null };

export function useCrudModalState<T>() {
  const [modal, setModal] = useState<ModalState>(closedModalState);
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

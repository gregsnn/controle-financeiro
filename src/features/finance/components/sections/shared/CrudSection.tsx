import type { ReactNode } from 'react';
import RuleSection from '../../RuleSection';
import { ConfirmModal, RuleModal } from '../../modals';
import { useCrudFormFlow } from './useCrudFormFlow';
import { useCrudModalState } from './useCrudModalState';

type SortMode = 'name' | 'value-asc' | 'value-desc';

interface CrudSectionLabels {
  title: string;
  description: string;
  addLabel: string;
  emptyText: string;
  columns: readonly string[];
  modal: {
    create: { title: string; submitLabel: string };
    edit: { title: string; submitLabel: string };
  };
  delete: {
    title: string;
    message: (name: string) => string;
  };
}

interface CrudSectionItem {
  id: string;
  name: string;
  amount?: number;
  installmentValue?: number;
}

interface CrudSectionControls<TItem> {
  openEdit: (item: TItem) => void;
  openDelete: (item: TItem) => void;
}

interface CrudSectionProps<TItem extends CrudSectionItem, TForm, TPayload> {
  labels: CrudSectionLabels;
  items: TItem[];
  form: TForm;
  canSubmit: boolean;
  resetForm: () => void;
  openCreateForm: () => void;
  openEditForm: (item: TItem) => void;
  buildPayload: (form: TForm) => TPayload | null;
  onAdd: (payload: TPayload) => Promise<void> | void;
  onEdit: (id: string, payload: TPayload) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
  renderItem: (
    item: TItem,
    money: (value: number) => string,
    controls: CrudSectionControls<TItem>
  ) => ReactNode;
  renderForm: () => ReactNode;
  sortBy?: SortMode;
  topContent?: ReactNode;
  className?: string;
}

export function CrudSection<TItem extends CrudSectionItem, TForm, TPayload>({
  labels,
  items,
  form,
  canSubmit,
  resetForm,
  openCreateForm,
  openEditForm,
  buildPayload,
  onAdd,
  onEdit,
  onDelete,
  renderItem,
  renderForm,
  sortBy = 'value-desc',
  topContent,
  className,
}: CrudSectionProps<TItem, TForm, TPayload>) {
  const {
    modal,
    confirm,
    closeModal,
    openCreateModal: openCreateBase,
    openEditModal: openEditBase,
    openDeleteConfirm,
    closeDeleteConfirm,
  } = useCrudModalState<TItem>();

  const handleSubmit = useCrudFormFlow({
    modal,
    form,
    canSubmit,
    closeModal,
    resetForm,
    buildPayload,
    onAdd: (payload) => onAdd(payload),
    onEdit: (id, payload) => onEdit(id, payload),
  });

  const openCreateModal = () => {
    openCreateForm();
    openCreateBase();
  };

  const openEdit = (item: TItem) => {
    openEditForm(item);
    openEditBase(item.id);
  };

  return (
    <>
      <RuleSection
        title={labels.title}
        description={labels.description}
        addLabel={labels.addLabel}
        onAddClick={openCreateModal}
        items={items}
        emptyText={labels.emptyText}
        sortBy={sortBy}
        columns={[...labels.columns]}
        className={className}
        renderItem={(item, money) =>
          renderItem(item, money, {
            openEdit,
            openDelete: openDeleteConfirm,
          })
        }
        topContent={topContent}
      />

      <ConfirmModal
        open={confirm.open}
        title={labels.delete.title}
        message={labels.delete.message(confirm.item?.name || '')}
        onConfirm={async () => {
          if (confirm.item) await onDelete(confirm.item.id);
          closeDeleteConfirm();
        }}
        onCancel={closeDeleteConfirm}
      />

      <RuleModal
        open={modal.open}
        title={modal.mode === 'edit' ? labels.modal.edit.title : labels.modal.create.title}
        onClose={closeModal}
        onSubmit={handleSubmit}
        submitLabel={
          modal.mode === 'edit' ? labels.modal.edit.submitLabel : labels.modal.create.submitLabel
        }
      >
        {renderForm()}
      </RuleModal>
    </>
  );
}

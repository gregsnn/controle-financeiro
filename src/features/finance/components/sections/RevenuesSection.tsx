import type { Revenue } from '../../domain/types';
import { useActiveRevenues } from '../../hooks/useActiveRevenues';
import RuleSection from '../RuleSection';
import { ConfirmModal, RuleModal } from '../modals';
import { RevenueForm } from './revenues/RevenueForm';
import { RevenueRow } from './revenues/RevenueRow';
import {
  buildRevenuePayload,
  toRevenueCreateItem,
  toRevenueEditItem,
} from './revenues/revenueFormHelpers';
import { REVENUE_LABELS } from './revenues/revenueSectionLabels';
import { useRevenueCrudState } from './revenues/useRevenueCrudState';
import type { CrudSectionCommonProps } from './shared/types';
import { useCrudFormFlow } from './shared/useCrudFormFlow';
import { useCrudModalState } from './shared/useCrudModalState';
import { useRevenueMonthAmountInput } from './shared/useRevenueMonthAmountInput';

type RevenuePayload = { name: string; amount: number; startMonth: string };
type RevenuesSectionProps = CrudSectionCommonProps<Revenue, RevenuePayload> & {
  currentMonthKey: string;
  monthRevenueAmounts: Record<string, number>;
  onMonthRevenueAmount?: (itemId: string, amount: number | null) => void;
};

export function RevenuesSection({
  items,
  currentMonthKey,
  monthRevenueAmounts,
  onAdd,
  onEdit,
  onDelete,
  onMonthRevenueAmount,
}: RevenuesSectionProps) {
  const { form, setForm, canSubmit, openCreateForm, openEditForm, resetForm } = useRevenueCrudState(
    {
      currentMonthKey,
      onDelete,
    }
  );

  const {
    modal,
    confirm,
    closeModal,
    openCreateModal: openCreateBase,
    openEditModal: openEditBase,
    openDeleteConfirm,
    closeDeleteConfirm,
  } = useCrudModalState<Revenue>();

  const activeItems = useActiveRevenues(items, currentMonthKey);

  const buildPayload = (currentForm: any) => buildRevenuePayload(currentForm);

  const handleSubmit = useCrudFormFlow({
    modal,
    form,
    canSubmit,
    closeModal,
    resetForm,
    buildPayload,
    onAdd: (payload) => {
      return onAdd(toRevenueCreateItem(payload!));
    },
    onEdit: (id, payload) => {
      return onEdit(id, toRevenueEditItem(payload!));
    },
  });

  const openCreateModal = () => {
    openCreateForm();
    openCreateBase();
  };

  const {
    tempInputValues,
    handleMonthAmountChange,
    handleMonthAmountInput,
    handleMonthAmountBlur,
  } = useRevenueMonthAmountInput(onMonthRevenueAmount);

  return (
    <>
      <RuleSection
        title={REVENUE_LABELS.title}
        description={REVENUE_LABELS.description}
        addLabel={REVENUE_LABELS.addLabel}
        onAddClick={openCreateModal}
        items={activeItems as any}
        emptyText={REVENUE_LABELS.emptyText}
        sortBy="value-desc"
        columns={[...REVENUE_LABELS.columns]}
        renderItem={(item: any, money: (value: number) => string) => {
          const hasOverride = monthRevenueAmounts && monthRevenueAmounts[item.id] !== undefined;

          return (
            <RevenueRow
              key={item.id}
              item={item}
              money={money}
              displayAmount={hasOverride ? monthRevenueAmounts[item.id] : item.baseAmount}
              tempValue={tempInputValues[item.id]}
              hasOverride={hasOverride}
              onMonthAmountInput={handleMonthAmountInput}
              onMonthAmountBlur={handleMonthAmountBlur}
              onMonthAmountChange={handleMonthAmountChange}
              onEdit={() => {
                openEditForm(item);
                openEditBase(item.id);
              }}
              onDelete={() => openDeleteConfirm(item)}
            />
          );
        }}
      />

      <ConfirmModal
        open={confirm.open}
        title={REVENUE_LABELS.delete.title}
        message={REVENUE_LABELS.delete.message((confirm.item as Revenue | null)?.name || '')}
        onConfirm={async () => {
          const item = confirm.item as Revenue | null;
          if (item) await onDelete(item.id);
          closeDeleteConfirm();
        }}
        onCancel={closeDeleteConfirm}
      />

      <RuleModal
        open={modal.open}
        title={
          modal.mode === 'edit'
            ? REVENUE_LABELS.modal.edit.title
            : REVENUE_LABELS.modal.create.title
        }
        onClose={closeModal}
        onSubmit={handleSubmit}
        submitLabel={
          modal.mode === 'edit'
            ? REVENUE_LABELS.modal.edit.submitLabel
            : REVENUE_LABELS.modal.create.submitLabel
        }
      >
        <RevenueForm form={form} setForm={setForm} />
      </RuleModal>
    </>
  );
}

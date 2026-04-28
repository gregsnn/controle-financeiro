import { OVERRIDE_TYPES } from '../../domain/constants';
import type { CardBillItem, FixedExpense } from '../../domain/types';
import { ConfirmModal, RuleModal } from '../modals';
import RuleSection from '../RuleSection';
import { FixedExpenseForm } from './fixed-expenses/FixedExpenseForm';
import { buildFixedExpensePayload } from './fixed-expenses/fixedExpenseFormHelpers';
import { FixedExpenseRow } from './fixed-expenses/FixedExpenseRow';
import { FIXED_EXPENSE_LABELS } from './fixed-expenses/fixedExpenseSectionLabels';
import { useActiveFixedExpenses } from './fixed-expenses/useActiveFixedExpenses';
import { useFixedExpenseCrudState } from './fixed-expenses/useFixedExpenseCrudState';
import type { CrudSectionCommonProps, MonthPaidSectionProps } from './shared/types';
import { useCrudFormFlow } from './shared/useCrudFormFlow';
import { useCrudModalState } from './shared/useCrudModalState';
import { useMonthPaymentMap } from './shared/useMonthPaymentMap';

type FixedExpensePayload = {
  name: string;
  amount: number;
  dueDay: number | null;
  startMonth: string;
  paymentMethod: string;
  card: string | null;
  category: string;
};

type FixedExpensesSectionProps = CrudSectionCommonProps<FixedExpense, FixedExpensePayload> &
  MonthPaidSectionProps & {
    cardList?: CardBillItem[];
  };

export function FixedExpensesSection({
  items,
  currentMonthKey,
  monthOverrides,
  onAdd,
  onEdit,
  onDelete,
  onTogglePaid,
  cardList,
}: FixedExpensesSectionProps) {
  const cards = cardList ?? [];

  const activeItems = useActiveFixedExpenses(items, currentMonthKey);

  const { form, setForm, canSubmit, openCreateForm, openEditForm, resetForm } = useFixedExpenseCrudState({
    currentMonthKey,
    defaultCardId: cards[0]?.id || '',
    onDelete,
  });

  const {
    modal,
    confirm,
    closeModal,
    openCreateModal: openCreateBase,
    openEditModal: openEditBase,
    openDeleteConfirm,
    closeDeleteConfirm,
  } = useCrudModalState<FixedExpense>();

  const monthPaymentMap = useMonthPaymentMap(
    monthOverrides,
    currentMonthKey,
    OVERRIDE_TYPES.FIXED_EXPENSE_PAYMENT
  );

  const buildPayload = (currentForm: any) =>
    buildFixedExpensePayload(currentForm, cards);

  const handleSubmit = useCrudFormFlow({
    modal,
    form,
    canSubmit,
    closeModal,
    resetForm,
    buildPayload,
    onAdd: (payload) => onAdd(payload!),
    onEdit: (id, payload) => onEdit(id, payload!),
  });

  const openCreateModal = () => {
    openCreateForm();
    openCreateBase();
  };

  return (
    <>
      <RuleSection
        title={FIXED_EXPENSE_LABELS.title}
        description={FIXED_EXPENSE_LABELS.description}
        addLabel={FIXED_EXPENSE_LABELS.addLabel}
        onAddClick={openCreateModal}
        items={activeItems}
        emptyText={FIXED_EXPENSE_LABELS.emptyText}
        sortBy="value-desc"
        columns={FIXED_EXPENSE_LABELS.columns}
        renderItem={(item: FixedExpense, money: (value: number) => string) => (
          <FixedExpenseRow
            key={item.id}
            item={item}
            money={money}
            isPaid={monthPaymentMap.get(item.id)?.paid === true}
            onTogglePaid={onTogglePaid}
            onEdit={() => {
              openEditForm(item);
              openEditBase(item.id);
            }}
            onDelete={() => openDeleteConfirm(item)}
          />
        )}
      />

      <ConfirmModal
        open={confirm.open}
        title={FIXED_EXPENSE_LABELS.delete.title}
        message={FIXED_EXPENSE_LABELS.delete.message((confirm.item as FixedExpense | null)?.name || '')}
        onConfirm={async () => {
          const item = confirm.item as FixedExpense | null;
          if (item) await onDelete(item.id);
          closeDeleteConfirm();
        }}
        onCancel={closeDeleteConfirm}
      />

      <RuleModal
        open={modal.open}
        title={modal.mode === 'edit' ? FIXED_EXPENSE_LABELS.modal.edit.title : FIXED_EXPENSE_LABELS.modal.create.title}
        onClose={closeModal}
        onSubmit={handleSubmit}
        submitLabel={modal.mode === 'edit' ? FIXED_EXPENSE_LABELS.modal.edit.submitLabel : FIXED_EXPENSE_LABELS.modal.create.submitLabel}
      >
        <FixedExpenseForm form={form} setForm={setForm} cards={cards} />
      </RuleModal>
    </>
  );
}
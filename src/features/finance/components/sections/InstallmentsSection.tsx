import { useMemo } from 'react';
import { OVERRIDE_TYPES } from '../../domain/constants';
import type { CardBillItem } from '../../domain/types';
import RuleSection from '../RuleSection';
import { ConfirmModal, RuleModal } from '../modals';
import { InstallmentForm } from './installments/InstallmentForm';
import { InstallmentRow } from './installments/InstallmentRow';
import { buildInstallmentPayload } from './installments/installmentFormHelpers';
import { INSTALLMENT_LABELS } from './installments/installmentSectionLabels';
import { useInstallmentCrudState } from './installments/useInstallmentCrudState';
import type { CrudSectionCommonProps, MonthPaidSectionProps } from './shared/types';
import { useCrudFormFlow } from './shared/useCrudFormFlow';
import { useCrudModalState } from './shared/useCrudModalState';
import { useMonthPaymentMap } from '../../hooks/useMonthPaymentMap';

type InstallmentItem = {
  id: string;
  name: string;
  installmentValue: number;
  totalInstallments: number;
  startMonth: string;
  card: string;
  currentInstallment: number;
};

type InstallmentPayload = {
  name: string;
  installmentValue: number;
  totalInstallments: number;
  startMonth: string;
  card: string;
};

type InstallmentsSectionProps = CrudSectionCommonProps<InstallmentItem, InstallmentPayload> &
  MonthPaidSectionProps & {
    cardList?: CardBillItem[];
  };

export function InstallmentsSection({
  items,
  currentMonthKey,
  monthOverrides,
  onAdd,
  onEdit,
  onDelete,
  onTogglePaid,
  cardList,
}: InstallmentsSectionProps) {
  const cards = useMemo(() => cardList ?? [], [cardList]);
  const cardIconMap = useMemo(() => {
    const map: Record<string, string> = {};
    cards.forEach((card) => {
      if (card.icon) {
        map[card.id] = card.icon;
      }
    });
    return map;
  }, [cards]);

  const { form, setForm, canSubmit, openCreateForm, openEditForm, resetForm } =
    useInstallmentCrudState({
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
  } = useCrudModalState<{ id: string; name: string }>();

  const monthPaymentMap = useMonthPaymentMap(
    monthOverrides,
    currentMonthKey,
    OVERRIDE_TYPES.INSTALLMENT_PAYMENT
  );

  const buildPayload = (currentForm: any) => buildInstallmentPayload(currentForm);

  const handleSubmit = useCrudFormFlow({
    modal,
    form,
    canSubmit,
    closeModal,
    resetForm,
    buildPayload,
    onAdd,
    onEdit,
  });

  const openCreateModal = () => {
    openCreateForm();
    openCreateBase();
  };

  return (
    <>
      <RuleSection
        title={INSTALLMENT_LABELS.title}
        description={INSTALLMENT_LABELS.description}
        addLabel={INSTALLMENT_LABELS.addLabel}
        onAddClick={openCreateModal}
        items={items}
        sortBy="value-desc"
        emptyText={INSTALLMENT_LABELS.emptyText}
        columns={INSTALLMENT_LABELS.columns as unknown as string[]}
        renderItem={(item: any, money: (value: number) => string) => (
          <InstallmentRow
            key={item.id}
            item={item}
            money={money}
            isPaid={monthPaymentMap.get(item.id)?.paid === true}
            cardIconMap={cardIconMap}
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
        title={INSTALLMENT_LABELS.delete.title}
        message={INSTALLMENT_LABELS.delete.message(confirm.item?.name || '')}
        onConfirm={async () => {
          if (confirm.item) await onDelete(confirm.item.id);
          closeDeleteConfirm();
        }}
        onCancel={closeDeleteConfirm}
      />

      <RuleModal
        open={modal.open}
        title={
          modal.mode === 'edit'
            ? INSTALLMENT_LABELS.modal.edit.title
            : INSTALLMENT_LABELS.modal.create.title
        }
        onClose={closeModal}
        onSubmit={handleSubmit}
        submitLabel={
          modal.mode === 'edit'
            ? INSTALLMENT_LABELS.modal.edit.submitLabel
            : INSTALLMENT_LABELS.modal.create.submitLabel
        }
      >
        <InstallmentForm form={form} setForm={setForm} cards={cards} />
      </RuleModal>
    </>
  );
}

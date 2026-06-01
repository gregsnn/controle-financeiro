import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { OVERRIDE_TYPES } from '../../domain/constants';
import type { CardBillItem, InstallmentItem } from '../../domain/types';
import { useCardList } from '../../hooks/useCardList';
import { useMonthPaymentMap } from '../../hooks/useMonthPaymentMap';
import { useI18n } from '../../lib/i18n';
import { formatMoney, formatStartMonth } from '../../lib/utils';
import { ConfirmModal, RuleModal } from '../modals';
import { InstallmentForm, type InstallmentFormState } from './installments/InstallmentForm';
import { buildInstallmentPayload } from './installments/installmentFormHelpers';
import { INSTALLMENT_LABELS } from './installments/installmentSectionLabels';
import { useInstallmentCrudState } from './installments/useInstallmentCrudState';
import { RowActions } from './shared/RowActions';
import type { CrudSectionCommonProps, MonthPaidSectionProps } from './shared/types';
import { useCrudFormFlow } from './shared/useCrudFormFlow';
import { useCrudModalState } from './shared/useCrudModalState';

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

type InstallmentViewMode = 'recent' | 'nearEnd' | 'monthlyValue' | 'totalValue' | 'remainingValue';

const INSTALLMENT_VIEW_MODES: Array<{ id: InstallmentViewMode; label: string }> = [
  { id: 'recent', label: 'Recentes' },
  { id: 'nearEnd', label: 'Perto de quitar' },
  { id: 'monthlyValue', label: 'Maior parcela' },
  { id: 'totalValue', label: 'Maior total' },
  { id: 'remainingValue', label: 'Menor restante' },
];

function progressOf(item: InstallmentItem) {
  return Math.min(
    100,
    Math.max(0, Math.round((item.currentInstallment / item.totalInstallments) * 100))
  );
}

function totalAmountOf(item: InstallmentItem) {
  return Number(item.installmentValue || 0) * Number(item.totalInstallments || 0);
}

function paidAmountOf(item: InstallmentItem) {
  return Number(item.installmentValue || 0) * Number(item.currentInstallment || 0);
}

function remainingAmountOf(item: InstallmentItem) {
  return Math.max(0, totalAmountOf(item) - paidAmountOf(item));
}

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
  const { normalizeCardName } = useI18n();
  const [viewMode, setViewMode] = useState<InstallmentViewMode>('recent');
  const cards = useCardList(cardList);
  const cardLabelMap = useMemo(
    () =>
      cards.reduce(
        (acc, card) => {
          acc[card.id] = normalizeCardName(card.name);
          return acc;
        },
        {} as Record<string, string>
      ),
    [cards, normalizeCardName]
  );

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
  } = useCrudModalState<InstallmentItem>();

  const monthPaymentMap = useMonthPaymentMap(
    monthOverrides,
    currentMonthKey,
    OVERRIDE_TYPES.INSTALLMENT_PAYMENT
  );

  const buildPayload = (currentForm: InstallmentFormState) => buildInstallmentPayload(currentForm);
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

  const openEdit = (item: InstallmentItem) => {
    openEditForm(item);
    openEditBase(item.id);
  };

  const sortedItems = useMemo(() => {
    const viewItems =
      viewMode === 'nearEnd' ? items.filter((item) => progressOf(item) >= 75) : items;

    return [...viewItems].sort((a, b) => {
      if (viewMode === 'totalValue') return totalAmountOf(b) - totalAmountOf(a);
      if (viewMode === 'remainingValue') return remainingAmountOf(a) - remainingAmountOf(b);
      if (viewMode === 'nearEnd') return progressOf(b) - progressOf(a);
      if (viewMode === 'recent') return items.indexOf(b) - items.indexOf(a);
      return Number(b.installmentValue || 0) - Number(a.installmentValue || 0);
    });
  }, [items, viewMode]);
  const totalAllMonth = items.reduce((sum, item) => sum + Number(item.installmentValue || 0), 0);

  return (
    <>
      <section className="section installments-section">
        <div className="sec-header section-header--finflow">
          <div>
            <p className="sec-title">{INSTALLMENT_LABELS.title}</p>
            <p className="sec-description">
              {items.length} ativo{items.length === 1 ? '' : 's'} -{' '}
              <span>{formatMoney(totalAllMonth)}/mes</span>
            </p>
          </div>
          <div className="sec-actions">
            <button type="button" className="add-btn add-btn--primary" onClick={openCreateModal}>
              <Plus size={13} strokeWidth={2.4} aria-hidden />
              {INSTALLMENT_LABELS.addLabel.replace(/^\+\s*/, '')}
            </button>
          </div>
        </div>

        {items.length ? (
          <div className="installment-filter-bar" aria-label="Filtros de parcelamentos">
            {INSTALLMENT_VIEW_MODES.map((mode) => (
              <button
                key={mode.id}
                type="button"
                className={viewMode === mode.id ? 'active' : ''}
                onClick={() => setViewMode(mode.id)}
              >
                {mode.label}
              </button>
            ))}
          </div>
        ) : null}

        {sortedItems.length ? (
          <div className="installment-card-list">
            {sortedItems.map((item) => {
              const paid = monthPaymentMap.get(item.id)?.paid === true;
              const progress = progressOf(item);
              const isNearEnd = progress >= 75;
              const cardLabel = cardLabelMap[item.card] || item.card || 'Sem cartao';
              const paidAmount = paidAmountOf(item);
              const totalAmount = totalAmountOf(item);

              return (
                <article className="installment-card" key={item.id}>
                  <div className="installment-card-main">
                    <div className="installment-card-copy">
                      <div className="installment-card-title-row">
                        <h3>{item.name}</h3>
                        {isNearEnd ? (
                          <span className="status-badge status-badge--ok">Perto de quitar</span>
                        ) : null}
                      </div>
                      <p>
                        {cardLabel} - desde {formatStartMonth(item.startMonth)}
                      </p>
                    </div>
                    <div className="installment-card-amount">
                      <strong>
                        {formatMoney(item.installmentValue)}
                        <span>/mes</span>
                      </strong>
                      <small>
                        {item.currentInstallment}/{item.totalInstallments} parcelas
                      </small>
                    </div>
                  </div>

                  <div className="installment-card-progress">
                    <div className="installment-card-progress-meta">
                      <span>
                        {formatMoney(paidAmount)} de {formatMoney(totalAmount)} pagos
                      </span>
                      <span>{progress}%</span>
                    </div>
                    <div className="installment-progress-track">
                      <span style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  <div className="installment-card-footer">
                    <button
                      type="button"
                      className={`installment-paid-toggle ${paid ? 'paid' : 'pending'}`}
                      onClick={() => onTogglePaid(item.id, !paid)}
                      aria-pressed={paid}
                    >
                      {paid ? 'Pago' : 'Pendente'}
                    </button>
                    <RowActions
                      onEdit={() => openEdit(item)}
                      onDelete={() => openDeleteConfirm(item)}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="installments-empty">
            <p>{items.length ? 'Nenhum parcelamento neste filtro' : 'Nenhum parcelamento ativo'}</p>
            <span>
              {items.length
                ? 'Troque o filtro para ver outros parcelamentos.'
                : 'Compras parceladas aparecem aqui quando houver impacto neste mes.'}
            </span>
          </div>
        )}
      </section>

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

import { useMemo, useState } from 'react';
import { applyMoneyMask, formatMoneyInput, parseMoneyInput } from '../../lib/moneyInput';
import { OVERRIDE_TYPES } from '../../domain/constants';
import { formatStartMonth } from '../../lib/utils';
import { CARD_ICONS } from '../../domain/constants';
import RuleSection from '../RuleSection';
import { ConfirmModal, RuleModal } from '../modals';
import { Input } from '../inputs';
import { SelectWithIcon } from '../inputs';
import { useCrudModalState } from './shared/useCrudModalState';
import { useMonthPaymentMap } from './shared/useMonthPaymentMap';
import { RowActions } from './shared/RowActions';
import { useCrudFormFlow } from './shared/useCrudFormFlow';
import type { CrudSectionCommonProps, MonthPaidSectionProps } from './shared/types';

type InstallmentItem = {
  id: string;
  name: string;
  installmentValue: number;
  totalInstallments: number;
  startMonth: string;
  card: 'santander' | 'nubank' | 'outro';
  currentInstallment: number;
};

type InstallmentFormState = {
  name: string;
  installmentValue: string;
  totalInstallments: string;
  startMonth: string;
  card: 'santander' | 'nubank' | 'outro';
};

type InstallmentPayload = {
  name: string;
  installmentValue: number;
  totalInstallments: number;
  startMonth: string;
  card: 'santander' | 'nubank' | 'outro';
};

type InstallmentsSectionProps = CrudSectionCommonProps<InstallmentItem, InstallmentPayload> &
  MonthPaidSectionProps;

const EMPTY_FORM: InstallmentFormState = {
  name: '',
  installmentValue: '',
  totalInstallments: '',
  startMonth: '',
  card: 'santander',
};

export function InstallmentsSection({
  items,
  currentMonthKey,
  monthOverrides,
  onAdd,
  onEdit,
  onDelete,
  onTogglePaid,
}: InstallmentsSectionProps) {
  const [form, setForm] = useState<InstallmentFormState>(EMPTY_FORM);
  const {
    modal,
    confirm,
    closeModal,
    openCreateModal: openCreateBase,
    openEditModal: openEditBase,
    openDeleteConfirm,
    closeDeleteConfirm,
  } = useCrudModalState<{ id: string; name: string }>();

  const canSubmit = useMemo(
    () =>
      form.name.trim() &&
      form.installmentValue !== '' &&
      form.totalInstallments !== '' &&
      form.startMonth.trim(),
    [form]
  );

  const monthPaymentMap = useMonthPaymentMap(
    monthOverrides,
    currentMonthKey,
    OVERRIDE_TYPES.INSTALLMENT_PAYMENT
  );

  const buildPayload = (currentForm: InstallmentFormState): InstallmentPayload | null => {
    const installmentValue = parseMoneyInput(currentForm.installmentValue);
    if (installmentValue === null) return null;
    return {
      name: currentForm.name,
      installmentValue,
      totalInstallments: Number(currentForm.totalInstallments),
      startMonth: currentForm.startMonth,
      card: currentForm.card,
    };
  };

  const resetForm = () => setForm(EMPTY_FORM);

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
    setForm({
      name: '',
      installmentValue: '',
      totalInstallments: '',
      startMonth: '',
      card: 'santander',
    });
    openCreateBase();
  };

  const openEditModal = (item) => {
    setForm({
      name: item.name || '',
      installmentValue: formatMoneyInput(item.installmentValue),
      totalInstallments: String(item.totalInstallments || ''),
      startMonth: item.startMonth || '',
      card: item.card || 'santander',
    });
    openEditBase(item.id);
  };

  const handleDelete = async () => {
    if (!confirm.item) return;
    await onDelete(confirm.item.id);
    closeDeleteConfirm();
  };

  return (
    <>
      <RuleSection
        title="PARCELAMENTOS"
        description="Cada parcela aparece enquanto ainda estiver ativa e some quando o total terminar."
        addLabel="+ Novo parcelamento"
        onAddClick={openCreateModal}
        items={items}
        sortBy="value-desc"
        emptyText="Nenhum parcelamento cadastrado ainda."
        columns={['Nome', 'Parcela', 'Cartão', 'Desde', 'Progresso', 'Pago', 'Ações']}
        renderItem={(item, money) => (
          <tr key={item.id}>
            <td>{item.name}</td>
            <td>{money(item.installmentValue)}</td>
            <td>{CARD_ICONS[item.card]}</td>
            <td>{formatStartMonth(item.startMonth)}</td>
            <td>
              <div
                className="progress-cell"
                data-progress={`${item.currentInstallment}/${item.totalInstallments}`}
              >
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    data-progress={`${item.currentInstallment}/${item.totalInstallments}`}
                    style={{
                      width: `${(item.currentInstallment / item.totalInstallments) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </td>
            <td>
              <input
                type="checkbox"
                checked={monthPaymentMap.get(item.id)?.paid === true}
                onChange={(e) => onTogglePaid(item.id, e.target.checked)}
                aria-label={`Marcar ${item.name} como pago no mês`}
              />
            </td>
            <td>
              <RowActions onEdit={() => openEditModal(item)} onDelete={() => openDeleteConfirm(item)} />
            </td>
          </tr>
        )}
      />

      <ConfirmModal
        open={confirm.open}
        title="Confirmar exclusão"
        message={`Tem certeza que deseja apagar o parcelamento "${confirm.item?.name}"?`}
        onConfirm={handleDelete}
        onCancel={closeDeleteConfirm}
      />

      <RuleModal
        open={modal.open}
        title={modal.mode === 'edit' ? 'Editar parcelamento' : 'Novo parcelamento'}
        onClose={closeModal}
        onSubmit={handleSubmit}
        submitLabel={modal.mode === 'edit' ? 'Salvar alterações' : 'Adicionar parcelamento'}
      >
        <div className="form-grid tri">
          <Input
            label="Nome"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="HBO, Teclado, Kit PC..."
          />
          <Input
            label="Valor da parcela"
            type="text"
            value={form.installmentValue}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, installmentValue: applyMoneyMask(e.target.value) }))
            }
            inputMode="numeric"
            autoComplete="off"
            placeholder="0,00"
          />
          <Input
            label="Total de parcelas"
            type="number"
            value={form.totalInstallments}
            onChange={(e) => setForm((prev) => ({ ...prev, totalInstallments: e.target.value }))}
            placeholder="12"
          />
        </div>
        <div className="form-grid">
          <Input
            label="Mês de início"
            type="month"
            value={form.startMonth}
            onChange={(e) => setForm((prev) => ({ ...prev, startMonth: e.target.value }))}
          />
          <label className="field">
            <span>Cartão</span>
            <SelectWithIcon
              value={form.card}
              onChange={(e) => setForm((prev) => ({ ...prev, card: e.target.value }))}
              options={[
                { value: 'santander', label: 'Santander' },
                { value: 'nubank', label: 'Nubank' },
                { value: 'outro', label: 'Outro' },
              ]}
            />
          </label>
        </div>
      </RuleModal>
    </>
  );
}
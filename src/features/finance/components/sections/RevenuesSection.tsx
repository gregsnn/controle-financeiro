import { useMemo, useState } from 'react';
import type { Revenue } from '../../domain/types';
import { applyMoneyMask, formatMoneyInput, parseMoneyInput } from '../../lib/moneyInput';
import { formatStartMonth, isMonthInRange } from '../../lib/utils';
import RuleSection from '../RuleSection';
import { Input } from '../inputs';
import { ConfirmModal, RuleModal } from '../modals';
import { RowActions } from './shared/RowActions';
import type { CrudSectionCommonProps } from './shared/types';
import { useCrudFormFlow } from './shared/useCrudFormFlow';
import { useCrudModalState } from './shared/useCrudModalState';
import { useRevenueMonthAmountInput } from './shared/useRevenueMonthAmountInput';

type RevenueFormState = { name: string; amount: string; startMonth: string };
type RevenuePayload = { name: string; amount: number; startMonth: string };
type RevenuesSectionProps = CrudSectionCommonProps<Revenue, RevenuePayload> & {
  currentMonthKey: string;
  monthRevenueAmounts: Record<string, number>;
  onMonthRevenueAmount?: (itemId: string, amount: number | null) => void;
};

const EMPTY_FORM: RevenueFormState = { name: '', amount: '', startMonth: '' };

export function RevenuesSection({
  items,
  currentMonthKey,
  monthRevenueAmounts,
  onAdd,
  onEdit,
  onDelete,
  onMonthRevenueAmount,
}: RevenuesSectionProps) {
  const [form, setForm] = useState<RevenueFormState>(EMPTY_FORM);
  const {
    modal,
    confirm,
    closeModal,
    openCreateModal: openCreateBase,
    openEditModal: openEditBase,
    openDeleteConfirm,
    closeDeleteConfirm,
  } = useCrudModalState<Revenue>();
  const canSubmit = useMemo(
    () => !!(form.name.trim() && form.amount !== '' && form.startMonth.trim()),
    [form]
  );

  const activeItems = useMemo(
    () =>
      items.filter(
        (item) =>
          item.active !== false && isMonthInRange(currentMonthKey, item.startMonth, item.endMonth)
      ),
    [items, currentMonthKey]
  );

  const getDisplayAmount = (item) => {
    if (monthRevenueAmounts && monthRevenueAmounts[item.id] !== undefined) {
      return monthRevenueAmounts[item.id];
    }
    return item.amount;
  };

  const buildPayload = (currentForm: RevenueFormState): RevenuePayload | null => {
    const amount = parseMoneyInput(currentForm.amount);
    if (amount === null) return null;
    return {
      name: currentForm.name,
      amount,
      startMonth: currentForm.startMonth,
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
    onAdd: (payload) => {
      return onAdd({
        ...payload!,
        baseAmount: payload!.amount,
        active: true,
        endMonth: null,
        category: 'outro',
        notes: '',
      } as any);
    },
    onEdit: (id, payload) => {
      return onEdit(id, {
        ...payload!,
        baseAmount: payload!.amount,
      } as any);
    },
  });

  const openCreateModal = () => {
    setForm({ name: '', amount: '', startMonth: currentMonthKey });
    openCreateBase();
  };

  const openEditModal = (item) => {
    setForm({
      name: item.name || '',
      amount: formatMoneyInput(item.amount),
      startMonth: item.startMonth || currentMonthKey,
    });
    openEditBase(item.id);
  };

  const handleDelete = async () => {
    const item = confirm.item as Revenue | null;
    if (!item) return;
    await onDelete(item.id);
    closeDeleteConfirm();
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
        title="RECEITAS"
        description="A receita se repete por mês e pode receber ajuste específico depois, se necessário."
        addLabel="+ Nova receita"
        onAddClick={openCreateModal}
        items={activeItems}
        emptyText="Nenhuma receita cadastrada ainda."
        sortBy="value-desc"
        columns={['Nome', 'Valor', 'Desde', 'Ações']}
        renderItem={(item, money) => {
          const displayAmount = getDisplayAmount(item);
          const hasOverride = monthRevenueAmounts && monthRevenueAmounts[item.id] !== undefined;

          return (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>
                <div className="month-amount-cell">
                  <input
                    type="text"
                    className={`month-amount-input ${hasOverride ? 'has-override' : ''}`}
                    value={tempInputValues[item.id] || formatMoneyInput(displayAmount)}
                    onChange={(e) => handleMonthAmountInput(item.id, e.target.value)}
                    onBlur={() => handleMonthAmountBlur(item)}
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder={money(item.amount)}
                  />
                  {hasOverride && (
                    <button
                      type="button"
                      className="clear-override"
                      onClick={() => handleMonthAmountChange(item.id, null)}
                      title="Restaurar valor original"
                    >
                      ×
                    </button>
                  )}
                </div>
              </td>
              <td>{formatStartMonth(item.startMonth)}</td>
              <td>
                <RowActions
                  onEdit={() => openEditModal(item)}
                  onDelete={() => openDeleteConfirm(item)}
                />
              </td>
            </tr>
          );
        }}
      />

      <ConfirmModal
        open={confirm.open}
        title="Confirmar exclusão"
        message={`Tem certeza que deseja apagar a receita "${(confirm.item as Revenue | null)?.name || ''}"?`}
        onConfirm={handleDelete}
        onCancel={closeDeleteConfirm}
      />

      <RuleModal
        open={modal.open}
        title={modal.mode === 'edit' ? 'Editar receita' : 'Nova receita'}
        onClose={closeModal}
        onSubmit={handleSubmit}
        submitLabel={modal.mode === 'edit' ? 'Salvar alterações' : 'Adicionar receita'}
      >
        <div className="form-grid">
          <Input
            label="Nome"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Salário, extra, bônus..."
          />
          <Input
            label="Valor"
            type="text"
            value={form.amount}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, amount: applyMoneyMask(e.target.value) }))
            }
            inputMode="numeric"
            autoComplete="off"
            placeholder="0,00"
          />
        </div>
        <Input
          label="Mês de início"
          type="month"
          value={form.startMonth}
          onChange={(e) => setForm((prev) => ({ ...prev, startMonth: e.target.value }))}
          placeholder=""
        />
      </RuleModal>
    </>
  );
}

import { useMemo, useState } from 'react';
import { CATEGORIES, ICONS, OVERRIDE_TYPES } from '../../domain/constants';
import type { FixedExpense } from '../../domain/types';
import { applyMoneyMask, formatMoneyInput, parseMoneyInput } from '../../lib/moneyInput';
import { formatStartMonth } from '../../lib/utils';
import RuleSection from '../RuleSection';
import { Input, SelectWithIcon } from '../inputs';
import { ConfirmModal, RuleModal } from '../modals';
import { RowActions } from './shared/RowActions';
import type { CrudSectionCommonProps, MonthPaidSectionProps } from './shared/types';
import { useCrudFormFlow } from './shared/useCrudFormFlow';
import { useCrudModalState } from './shared/useCrudModalState';
import { useMonthPaymentMap } from './shared/useMonthPaymentMap';

function resolvePaymentMethod(item) {
  if (item.paymentMethod === 'cartao' && item.card) return item.card;
  return item.paymentMethod || 'boleto';
}

function resolveCardFromPaymentMethod(paymentMethod, currentCard) {
  if (paymentMethod === 'santander' || paymentMethod === 'nubank') return paymentMethod;
  if (paymentMethod === 'cartao') return currentCard || 'outro';
  return null;
}

type FixedExpenseFormState = {
  name: string;
  amount: string;
  dueDay: string;
  startMonth: string;
  paymentMethod: string;
  category: string;
};

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
  MonthPaidSectionProps;

const EMPTY_FORM: FixedExpenseFormState = {
  name: '',
  amount: '',
  dueDay: '',
  startMonth: '',
  paymentMethod: 'boleto',
  category: 'outro',
};

export function FixedExpensesSection({
  items,
  currentMonthKey,
  monthOverrides,
  onAdd,
  onEdit,
  onDelete,
  onTogglePaid,
}: FixedExpensesSectionProps) {
  const [form, setForm] = useState<FixedExpenseFormState>(EMPTY_FORM);
  const {
    modal,
    confirm,
    closeModal,
    openCreateModal: openCreateBase,
    openEditModal: openEditBase,
    openDeleteConfirm,
    closeDeleteConfirm,
  } = useCrudModalState<FixedExpense>();

  const canSubmit = useMemo(
    () => !!(form.name.trim() && form.amount !== '' && form.startMonth.trim()),
    [form]
  );

  const monthPaymentMap = useMonthPaymentMap(
    monthOverrides,
    currentMonthKey,
    OVERRIDE_TYPES.FIXED_EXPENSE_PAYMENT
  );

  const buildPayload = (currentForm: FixedExpenseFormState): FixedExpensePayload | null => {
    const amount = parseMoneyInput(currentForm.amount);
    if (amount === null) return null;
    return {
      name: currentForm.name,
      amount: amount ?? 0,
      dueDay: currentForm.dueDay ? Number(currentForm.dueDay) : null,
      startMonth: currentForm.startMonth,
      paymentMethod: currentForm.paymentMethod,
      card: resolveCardFromPaymentMethod(currentForm.paymentMethod, null),
      category: currentForm.category,
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
    onAdd: (payload) => onAdd(payload!),
    onEdit: (id, payload) => onEdit(id, payload!),
  });

  const openCreateModal = () => {
    setForm({
      name: '',
      amount: '',
      dueDay: '',
      startMonth: currentMonthKey,
      paymentMethod: 'boleto',
      category: 'outro',
    });
    openCreateBase();
  };

  const openEditModal = (item) => {
    setForm({
      name: item.name || '',
      amount: formatMoneyInput(item.amount),
      dueDay: item.dueDay ? String(item.dueDay) : '',
      startMonth: item.startMonth || currentMonthKey,
      paymentMethod: resolvePaymentMethod(item),
      category: item.category || 'outro',
    });
    openEditBase(item.id);
  };

  const handleDelete = async () => {
    const item = confirm.item as FixedExpense | null;
    if (!item) return;
    await onDelete(item.id);
    closeDeleteConfirm();
  };

  return (
    <>
      <RuleSection
        title="GASTOS FIXOS"
        description="Cadastre uma vez e o valor passa a valer em todos os meses ativos."
        addLabel="+ Novo gasto fixo"
        onAddClick={openCreateModal}
        items={items}
        emptyText="Nenhum gasto fixo cadastrado ainda."
        sortBy="value-desc"
        columns={[
          'Nome',
          'Valor',
          'Pagamento',
          'Categoria',
          'Vencimento',
          'Desde',
          'Pago',
          'Ações',
        ]}
        renderItem={(item, money) => (
          <tr key={item.id}>
            <td>{item.name}</td>
            <td>{money(item.amount)}</td>
            <td>{ICONS[resolvePaymentMethod(item)] || '💳'}</td>
            <td>{CATEGORIES[item.category] || '📦 OUTRO'}</td>
            <td>{item.dueDay ? `Dia ${item.dueDay}` : '-'}</td>
            <td>{formatStartMonth(item.startMonth)}</td>
            <td>
              <input
                type="checkbox"
                checked={monthPaymentMap.get(item.id)?.paid === true}
                onChange={(e) => onTogglePaid(item.id, e.target.checked)}
                aria-label={`Marcar ${item.name} como pago no mês`}
              />
            </td>
            <td>
              <RowActions
                onEdit={() => openEditModal(item)}
                onDelete={() => openDeleteConfirm(item)}
              />
            </td>
          </tr>
        )}
      />

      <ConfirmModal
        open={confirm.open}
        title="Confirmar exclusão"
        message={`Tem certeza que deseja apagar o gasto fixo "${(confirm.item as FixedExpense | null)?.name || ''}"?`}
        onConfirm={handleDelete}
        onCancel={closeDeleteConfirm}
      />

      <RuleModal
        open={modal.open}
        title={modal.mode === 'edit' ? 'Editar gasto fixo' : 'Novo gasto fixo'}
        onClose={closeModal}
        onSubmit={handleSubmit}
        submitLabel={modal.mode === 'edit' ? 'Salvar alterações' : 'Adicionar gasto fixo'}
      >
        <div className="form-grid">
          <Input
            label="Nome"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Internet, luz, aluguel..."
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
        <div className="form-grid">
          <Input
            label="Dia de vencimento"
            type="number"
            value={form.dueDay}
            onChange={(e) => setForm((prev) => ({ ...prev, dueDay: e.target.value }))}
            placeholder="10"
          />
          <Input
            label="Mês de início"
            type="month"
            value={form.startMonth}
            onChange={(e) => setForm((prev) => ({ ...prev, startMonth: e.target.value }))}
            placeholder=""
          />
        </div>
        <div className="form-grid">
          <label className="field">
            <span>Forma de pagamento</span>
            <SelectWithIcon
              value={form.paymentMethod}
              onChange={(e) => setForm((prev) => ({ ...prev, paymentMethod: e.target.value }))}
              options={[
                { value: 'boleto', label: 'Boleto' },
                { value: 'pix', label: 'Pix' },
                { value: 'debito', label: 'Débito' },
                { value: 'santander', label: 'Santander' },
                { value: 'nubank', label: 'Nubank' },
              ]}
            />
          </label>
          <label className="field">
            <span>Categoria</span>
            <select
              value={form.category}
              onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
            >
              {Object.entries(CATEGORIES).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </RuleModal>
    </>
  );
}

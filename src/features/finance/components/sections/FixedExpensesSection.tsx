import { useMemo, useState } from 'react';
import { CATEGORIES, ICONS, OVERRIDE_TYPES } from '../../domain/constants';
import type { CardBillItem, FixedExpense } from '../../domain/types';
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

function resolveCardFromPaymentMethod(paymentMethod, currentCard, cards) {
  const cardIds = (cards || []).map((card) => card.id);
  if (paymentMethod === 'cartao') return currentCard || cardIds[0] || 'outro';
  if (cardIds.includes(paymentMethod)) return paymentMethod;
  return null;
}

function isSpecialPaymentMethod(value) {
  return value === 'boleto' || value === 'pix' || value === 'debito' || value === 'cartao';
}

type FixedExpenseFormState = {
  name: string;
  amount: string;
  dueDay: string;
  startMonth: string;
  paymentMethod: string;
  card: string;
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
  MonthPaidSectionProps & {
    cardList?: CardBillItem[];
  };

const EMPTY_FORM: FixedExpenseFormState = {
  name: '',
  amount: '',
  dueDay: '',
  startMonth: '',
  paymentMethod: 'boleto',
  card: '',
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
  cardList,
}: FixedExpensesSectionProps) {
  const [form, setForm] = useState<FixedExpenseFormState>(EMPTY_FORM);
  const cards = cardList ?? [];

  const activeItems = useMemo(
    () =>
      items.filter(
        (item) => !item.endMonth || item.endMonth >= currentMonthKey
      ),
    [items, currentMonthKey]
  );
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
    const selectedCard = cards.find((card) => card.id === currentForm.paymentMethod);
    const legacyCard = !isSpecialPaymentMethod(currentForm.paymentMethod)
      ? currentForm.paymentMethod
      : null;
    return {
      name: currentForm.name,
      amount: amount ?? 0,
      dueDay: currentForm.dueDay ? Number(currentForm.dueDay) : null,
      startMonth: currentForm.startMonth,
      paymentMethod: selectedCard || legacyCard ? 'cartao' : currentForm.paymentMethod,
      card: selectedCard
        ? selectedCard.id
        : legacyCard
          ? legacyCard
          : resolveCardFromPaymentMethod(currentForm.paymentMethod, currentForm.card, cards),
      category: currentForm.category,
    };
  };

  const paymentOptions = [
    { value: 'boleto', label: 'Boleto' },
    { value: 'pix', label: 'Pix' },
    ...cards.map((card) => ({ value: card.id, label: card.name })),
  ];

  if (form.paymentMethod && !paymentOptions.some((opt) => opt.value === form.paymentMethod)) {
    paymentOptions.unshift({
      value: form.paymentMethod,
      label: `${form.paymentMethod} (removido)`,
    });
  }

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
      paymentMethod: cards[0]?.id || 'boleto',
      card: cards[0]?.id || '',
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
      paymentMethod:
        item.paymentMethod === 'cartao' ? item.card || 'cartao' : resolvePaymentMethod(item),
      card: item.card || '',
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
        items={activeItems}
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
              options={paymentOptions}
            />
          </label>
          {form.paymentMethod === 'cartao' ? (
            <label className="field">
              <span>Cartão</span>
              <select
                value={form.card}
                onChange={(e) => setForm((prev) => ({ ...prev, card: e.target.value }))}
              >
                {cards.map((card) => (
                  <option key={card.id} value={card.id}>
                    {card.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
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

import { useMemo, useState } from 'react';
import { applyMoneyMask, formatMoneyInput, parseMoneyInput } from '../../lib/moneyInput';
import { OVERRIDE_TYPES } from '../../domain/constants.js';
import { formatStartMonth } from '../../lib/utils';
import { CATEGORIES, ACTION_ICONS } from '../../domain/constants.js';
import RuleSection from '../RuleSection';
import { ConfirmModal, RuleModal } from '../modals';
import { Input } from '../inputs';
import { SelectWithIcon } from '../inputs';

function resolvePaymentMethod(item) {
  if (item.paymentMethod === 'cartao' && item.card) return item.card;
  return item.paymentMethod || 'boleto';
}

function resolveCardFromPaymentMethod(paymentMethod, currentCard) {
  if (paymentMethod === 'santander' || paymentMethod === 'nubank') return paymentMethod;
  if (paymentMethod === 'cartao') return currentCard || 'outro';
  return null;
}

export function FixedExpensesSection({
  items,
  currentMonthKey,
  monthOverrides,
  onAdd,
  onEdit,
  onDelete,
  onTogglePaid,
}) {
  const [form, setForm] = useState({
    name: '',
    amount: '',
    dueDay: '',
    startMonth: '',
    paymentMethod: 'boleto',
    category: 'outro',
  });
  const [modal, setModal] = useState({ open: false, mode: 'create', itemId: null });
  const [confirm, setConfirm] = useState({ open: false, item: null });

  const canSubmit = useMemo(
    () => form.name.trim() && form.amount !== '' && form.startMonth.trim(),
    [form]
  );

  const monthPaymentMap = useMemo(() => {
    const map = new Map();
    monthOverrides
      .filter(
        (override) =>
          override.type === OVERRIDE_TYPES.FIXED_EXPENSE_PAYMENT &&
          override.monthKey === currentMonthKey
      )
      .forEach((override) => map.set(override.itemId, override));
    return map;
  }, [currentMonthKey, monthOverrides]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    const amount = parseMoneyInput(form.amount);
    if (amount === null) return;
    const payload = {
      name: form.name,
      amount,
      dueDay: form.dueDay ? Number(form.dueDay) : null,
      startMonth: form.startMonth,
      paymentMethod: form.paymentMethod,
      card: resolveCardFromPaymentMethod(form.paymentMethod, null),
      category: form.category,
    };

    if (modal.mode === 'edit' && modal.itemId) {
      await onEdit(modal.itemId, payload);
    } else {
      await onAdd(payload);
    }

    setModal({ open: false, mode: 'create', itemId: null });
    setForm({
      name: '',
      amount: '',
      dueDay: '',
      startMonth: '',
      paymentMethod: 'boleto',
      category: 'outro',
    });
  };

  const openCreateModal = () => {
    setForm({
      name: '',
      amount: '',
      dueDay: '',
      startMonth: currentMonthKey,
      paymentMethod: 'boleto',
      category: 'outro',
    });
    setModal({ open: true, mode: 'create', itemId: null });
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
    setModal({ open: true, mode: 'edit', itemId: item.id });
  };

  const closeModal = () => {
    setModal({ open: false, mode: 'create', itemId: null });
  };

  const openDeleteConfirm = (item) => {
    setConfirm({ open: true, item });
  };

  const closeDeleteConfirm = () => {
    setConfirm({ open: false, item: null });
  };

  const handleDelete = async () => {
    if (!confirm.item) return;
    await onDelete(confirm.item.id);
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
        columns={['Nome', 'Valor', 'Pagamento', 'Categoria', 'Vencimento', 'Desde', 'Ativo', 'Pago', 'Ações']}
        renderItem={(item, money) => (
          <tr key={item.id}>
            <td>{item.name}</td>
            <td>{money(item.amount)}</td>
            <td>{item.card ? ACTION_ICONS[item.card] || '💳' : ACTION_ICONS[resolvePaymentMethod(item)] || '💳'}</td>
            <td>{CATEGORIES[item.category] || '📦 OUTRO'}</td>
            <td>{item.dueDay ? `Dia ${item.dueDay}` : '-'}</td>
            <td>{formatStartMonth(item.startMonth)}</td>
            <td>{item.active === false ? 'Inativo' : 'Ativo'}</td>
            <td>
              <input
                type="checkbox"
                checked={monthPaymentMap.get(item.id)?.paid === true}
                onChange={(e) => onTogglePaid(item.id, e.target.checked)}
                aria-label={`Marcar ${item.name} como pago no mês`}
              />
            </td>
            <td>
              <div className="row-actions">
                <button type="button" className="edit" onClick={() => openEditModal(item)}>
                  {ACTION_ICONS.edit}
                </button>
                <button type="button" className="del" onClick={() => openDeleteConfirm(item)}>
                  {ACTION_ICONS.delete}
                </button>
              </div>
            </td>
          </tr>
        )}
      />

      <ConfirmModal
        open={confirm.open}
        title="Confirmar exclusão"
        message={`Tem certeza que deseja apagar o gasto fixo "${confirm.item?.name}"?`}
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
            onChange={(e) => setForm((prev) => ({ ...prev, amount: applyMoneyMask(e.target.value) }))}
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
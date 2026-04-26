import { useMemo, useState } from 'react';
import { applyMoneyMask, formatMoneyInput, parseMoneyInput } from '../../lib/moneyInput';
import { formatStartMonth, isMonthInRange } from '../../lib/utils';
import { ACTION_ICONS } from '../../domain/constants.js';
import RuleSection from '../RuleSection';
import { ConfirmModal, RuleModal } from '../modals';
import { Input } from '../inputs';

export function RevenuesSection({
  items,
  currentMonthKey,
  monthRevenueAmounts,
  onAdd,
  onEdit,
  onDelete,
  onMonthRevenueAmount,
}) {
  const [form, setForm] = useState({ name: '', amount: '', startMonth: '' });
  const [modal, setModal] = useState({ open: false, mode: 'create', itemId: null });
  const [confirm, setConfirm] = useState({ open: false, item: null });
  const canSubmit = useMemo(
    () => form.name.trim() && form.amount !== '' && form.startMonth.trim(),
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    const amount = parseMoneyInput(form.amount);
    if (amount === null) return;
    const payload = {
      name: form.name,
      amount,
      startMonth: form.startMonth,
    };

    if (modal.mode === 'edit' && modal.itemId) {
      await onEdit(modal.itemId, payload);
    } else {
      await onAdd(payload);
    }

    setModal({ open: false, mode: 'create', itemId: null });
    setForm({ name: '', amount: '', startMonth: '' });
  };

  const openCreateModal = () => {
    setForm({ name: '', amount: '', startMonth: currentMonthKey });
    setModal({ open: true, mode: 'create', itemId: null });
  };

  const openEditModal = (item) => {
    setForm({
      name: item.name || '',
      amount: formatMoneyInput(item.amount),
      startMonth: item.startMonth || currentMonthKey,
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

  const [tempInputValues, setTempInputValues] = useState({});

  const handleMonthAmountChange = (itemId, newAmount) => {
    if (onMonthRevenueAmount) {
      if (newAmount === null) {
        onMonthRevenueAmount(itemId, null);
        setTempInputValues((prev) => {
          const next = { ...prev };
          delete next[itemId];
          return next;
        });
      } else {
        const parsed = parseMoneyInput(newAmount);
        if (parsed !== null) {
          onMonthRevenueAmount(itemId, parsed);
        }
      }
    }
  };

  const handleMonthAmountInput = (itemId, value) => {
    const masked = applyMoneyMask(value);
    setTempInputValues((prev) => ({ ...prev, [itemId]: masked }));
  };

  const handleMonthAmountBlur = (item) => {
    const currentInputValue = tempInputValues[item.id];
    if (onMonthRevenueAmount) {
      const parsed = parseMoneyInput(currentInputValue);
      const originalAmount = item.amount;
      if (parsed === null || parsed === originalAmount) {
        onMonthRevenueAmount(item.id, null);
      } else {
        onMonthRevenueAmount(item.id, parsed);
      }
    }
    setTempInputValues((prev) => {
      const next = { ...prev };
      delete next[item.id];
      return next;
    });
  };

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
        columns={['Nome', 'Valor', 'Desde', 'Status', 'Ações']}
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
              <td>{item.active === false ? 'Inativa' : 'Ativa'}</td>
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
          );
        }}
      />

      <ConfirmModal
        open={confirm.open}
        title="Confirmar exclusão"
        message={`Tem certeza que deseja apagar a receita "${confirm.item?.name}"?`}
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
        />
      </RuleModal>
    </>
  );
}
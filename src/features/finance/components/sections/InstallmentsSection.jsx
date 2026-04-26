import { useMemo, useState } from 'react';
import { applyMoneyMask, formatMoneyInput, parseMoneyInput } from '../../lib/moneyInput';
import { OVERRIDE_TYPES } from '../../domain/constants.js';
import { formatStartMonth } from '../../lib/utils';
import { CARD_ICONS, ACTION_ICONS } from '../../domain/constants.js';
import RuleSection from '../RuleSection';
import { ConfirmModal, RuleModal } from '../modals';
import { Input } from '../inputs';
import { SelectWithIcon } from '../inputs';

export function InstallmentsSection({
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
    installmentValue: '',
    totalInstallments: '',
    startMonth: '',
    card: 'santander',
  });
  const [modal, setModal] = useState({ open: false, mode: 'create', itemId: null });
  const [confirm, setConfirm] = useState({ open: false, item: null });

  const canSubmit = useMemo(
    () =>
      form.name.trim() &&
      form.installmentValue !== '' &&
      form.totalInstallments !== '' &&
      form.startMonth.trim(),
    [form]
  );

  const monthPaymentMap = useMemo(() => {
    const map = new Map();
    monthOverrides
      .filter(
        (override) =>
          override.type === OVERRIDE_TYPES.INSTALLMENT_PAYMENT &&
          override.monthKey === currentMonthKey
      )
      .forEach((override) => map.set(override.itemId, override));
    return map;
  }, [currentMonthKey, monthOverrides]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    const installmentValue = parseMoneyInput(form.installmentValue);
    if (installmentValue === null) return;
    const payload = {
      name: form.name,
      installmentValue,
      totalInstallments: Number(form.totalInstallments),
      startMonth: form.startMonth,
      card: form.card,
    };

    if (modal.mode === 'edit' && modal.itemId) {
      await onEdit(modal.itemId, payload);
    } else {
      await onAdd(payload);
    }

    setModal({ open: false, mode: 'create', itemId: null });
    setForm({
      name: '',
      installmentValue: '',
      totalInstallments: '',
      startMonth: '',
      card: 'santander',
    });
  };

  const openCreateModal = () => {
    setForm({
      name: '',
      installmentValue: '',
      totalInstallments: '',
      startMonth: '',
      card: 'santander',
    });
    setModal({ open: true, mode: 'create', itemId: null });
  };

  const openEditModal = (item) => {
    setForm({
      name: item.name || '',
      installmentValue: formatMoneyInput(item.installmentValue),
      totalInstallments: String(item.totalInstallments || ''),
      startMonth: item.startMonth || '',
      card: item.card || 'santander',
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
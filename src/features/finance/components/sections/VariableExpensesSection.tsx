import { Plus } from 'lucide-react';
import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import type { CardBillItem, VariableExpense } from '../../domain/types';
import { useCardList } from '../../hooks/useCardList';
import { useI18n } from '../../lib/i18n';
import { applyMoneyMask, parseMoneyInput } from '../../lib/moneyInput';
import { formatMoney } from '../../lib/utils';
import { CATEGORIES, CATEGORY_LABELS } from '../../ui/constants';
import { Input } from '../inputs';
import { ConfirmModal, RuleModal } from '../modals';
import { RowActions } from './shared/RowActions';

type VariableExpensePayload = {
  name: string;
  amount: number;
  date: string;
  monthKey: string;
  category: string;
  paymentMethod: string;
  card: string | null;
  paid: boolean;
  notes: string;
};

type VariableExpenseFormState = {
  name: string;
  amount: string;
  date: string;
  category: string;
  paymentMethod: string;
  card: string;
  paid: string;
};

type VariableExpensePreferences = {
  category?: string;
  paymentMethod?: string;
  card?: string;
};

interface VariableExpensesSectionProps {
  items: VariableExpense[];
  currentMonthKey: string;
  cardList?: CardBillItem[];
  onAdd: (payload: VariableExpensePayload) => void | Promise<void>;
  onEdit: (id: string, payload: VariableExpensePayload) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
  onTogglePaid: (id: string, paid: boolean) => void | Promise<void>;
}

const VARIABLE_EXPENSE_PREFERENCES_KEY = 'ledger.variableExpensePreferences.v1';
const PAYMENT_METHODS = ['pix', 'debito', 'boleto', 'cartao'];

function defaultDateForMonth(monthKey: string) {
  const today = new Date();
  const currentMonthKey = today.toISOString().slice(0, 7);
  if (monthKey === currentMonthKey) return today.toISOString().slice(0, 10);
  return `${monthKey}-01`;
}

function readVariableExpensePreferences(): VariableExpensePreferences {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(VARIABLE_EXPENSE_PREFERENCES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as VariableExpensePreferences;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveVariableExpensePreferences(payload: VariableExpensePayload) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(
      VARIABLE_EXPENSE_PREFERENCES_KEY,
      JSON.stringify({
        category: payload.category,
        paymentMethod: payload.paymentMethod,
        card: payload.card || '',
      })
    );
  } catch {
    // Preference storage is best-effort; the expense itself must never fail because of it.
  }
}

function resolveDefaultCardId(cards: CardBillItem[], preferences: VariableExpensePreferences) {
  if (preferences.card && cards.some((card) => card.id === preferences.card)) {
    return preferences.card;
  }
  return cards[0]?.id || '';
}

function resolveDefaultPaymentMethod(
  defaultCardId: string,
  preferences: VariableExpensePreferences
) {
  if (
    preferences.paymentMethod &&
    PAYMENT_METHODS.includes(preferences.paymentMethod) &&
    (preferences.paymentMethod !== 'cartao' || defaultCardId)
  ) {
    return preferences.paymentMethod;
  }
  return defaultCardId ? 'cartao' : 'pix';
}

function emptyForm(
  monthKey: string,
  defaultCardId = '',
  preferences: VariableExpensePreferences = {}
): VariableExpenseFormState {
  const paymentMethod = resolveDefaultPaymentMethod(defaultCardId, preferences);
  return {
    name: '',
    amount: '',
    date: defaultDateForMonth(monthKey),
    category: preferences.category || 'outro',
    paymentMethod,
    card: defaultCardId,
    paid: paymentMethod === 'cartao' ? 'false' : 'true',
  };
}

function editForm(item: VariableExpense): VariableExpenseFormState {
  return {
    name: item.name || '',
    amount: Number(item.amount || 0)
      .toFixed(2)
      .replace('.', ','),
    date: item.date || `${item.monthKey}-01`,
    category: item.category || 'outro',
    paymentMethod: item.paymentMethod === 'cartao' ? 'cartao' : item.paymentMethod || 'pix',
    card: item.card || '',
    paid: item.paid ? 'true' : 'false',
  };
}

function buildPayload(
  form: VariableExpenseFormState,
  monthKey: string
): VariableExpensePayload | null {
  const amount = parseMoneyInput(form.amount, { allowZero: false });
  if (amount === null) return null;
  const date = form.date || defaultDateForMonth(monthKey);
  const paymentMethod = form.paymentMethod === 'cartao' ? 'cartao' : form.paymentMethod || 'pix';

  return {
    name: form.name.trim(),
    amount,
    date,
    monthKey: date.slice(0, 7) || monthKey,
    category: form.category || 'outro',
    paymentMethod,
    card: paymentMethod === 'cartao' ? form.card || null : null,
    paid: form.paid === 'true',
    notes: '',
  };
}

export function VariableExpensesSection({
  items,
  currentMonthKey,
  cardList,
  onAdd,
  onEdit,
  onDelete,
  onTogglePaid,
}: VariableExpensesSectionProps) {
  const { normalizeCardName } = useI18n();
  const cards = useCardList(cardList);
  const preferences = useMemo(() => readVariableExpensePreferences(), []);
  const defaultCardId = resolveDefaultCardId(cards, preferences);
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; itemId?: string } | null>(null);
  const [confirm, setConfirm] = useState<VariableExpense | null>(null);
  const [form, setForm] = useState<VariableExpenseFormState>(() =>
    emptyForm(currentMonthKey, defaultCardId, preferences)
  );
  const [quickName, setQuickName] = useState('');
  const [quickAmount, setQuickAmount] = useState('');

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => String(b.date).localeCompare(String(a.date))),
    [items]
  );
  const total = sortedItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
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

  const openCreate = () => {
    setForm(emptyForm(currentMonthKey, defaultCardId, readVariableExpensePreferences()));
    setModal({ mode: 'create' });
  };

  const openEdit = (item: VariableExpense) => {
    setForm(editForm(item));
    setModal({ mode: 'edit', itemId: item.id });
  };

  const closeModal = () => setModal(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = buildPayload(form, currentMonthKey);
    if (!payload || !payload.name) return;
    if (modal?.mode === 'edit' && modal.itemId) {
      await onEdit(modal.itemId, payload);
    } else {
      await onAdd(payload);
    }
    saveVariableExpensePreferences(payload);
    closeModal();
  };

  const handleQuickSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const baseForm = emptyForm(currentMonthKey, defaultCardId, readVariableExpensePreferences());
    const payload = buildPayload(
      {
        ...baseForm,
        name: quickName,
        amount: quickAmount,
      },
      currentMonthKey
    );
    if (!payload || !payload.name) return;
    await onAdd(payload);
    saveVariableExpensePreferences(payload);
    setQuickName('');
    setQuickAmount('');
  };

  const paymentOptions = [
    { value: 'pix', label: 'Pix' },
    { value: 'debito', label: 'Debito' },
    { value: 'boleto', label: 'Boleto' },
    { value: 'cartao', label: 'Cartao' },
  ];

  return (
    <>
      <section className="section expense-content-section variable-expenses-section">
        <div className="sec-header section-header--finflow">
          <div>
            <p className="sec-title">DESPESAS VARIAVEIS</p>
            <p className="sec-description">
              {sortedItems.length} lancamento{sortedItems.length === 1 ? '' : 's'} -{' '}
              <span>{formatMoney(total)}</span>
            </p>
          </div>
          <div className="sec-actions">
            <button type="button" className="add-btn add-btn--primary" onClick={openCreate}>
              <Plus size={13} strokeWidth={2.4} aria-hidden />
              Nova despesa variavel
            </button>
          </div>
        </div>

        <div className="card rule-table-card">
          <form
            className="variable-quick-add"
            aria-label="Adicionar despesa variavel rapido"
            onSubmit={handleQuickSubmit}
          >
            <input
              type="text"
              value={quickName}
              onChange={(event) => setQuickName(event.target.value)}
              placeholder="Descricao rapida"
              aria-label="Descricao rapida"
              autoComplete="off"
            />
            <input
              type="text"
              value={quickAmount}
              onChange={(event) => setQuickAmount(applyMoneyMask(event.target.value))}
              placeholder="0,00"
              aria-label="Valor rapido"
              inputMode="numeric"
              autoComplete="off"
            />
            <button type="submit" disabled={!quickName.trim() || !quickAmount.trim()}>
              Adicionar
            </button>
          </form>
          {sortedItems.length ? (
            <table>
              <thead>
                <tr>
                  <th>Descricao</th>
                  <th>Categoria</th>
                  <th>Pagamento</th>
                  <th>Data</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {sortedItems.map((item) => {
                  const paymentLabel =
                    item.paymentMethod === 'cartao'
                      ? cardLabelMap[item.card || ''] || 'Cartao'
                      : item.paymentMethod === 'pix'
                        ? 'Pix'
                        : item.paymentMethod === 'debito'
                          ? 'Debito'
                          : 'Boleto';

                  return (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{CATEGORY_LABELS[item.category] || item.category.toUpperCase()}</td>
                      <td>{paymentLabel}</td>
                      <td>{item.date ? item.date.split('-').reverse().join('/') : '-'}</td>
                      <td className="variable-expense-value">{formatMoney(item.amount)}</td>
                      <td>
                        <label className={`table-status-toggle ${item.paid ? 'paid' : 'pending'}`}>
                          <input
                            type="checkbox"
                            checked={item.paid}
                            onChange={(event) => onTogglePaid(item.id, event.target.checked)}
                            aria-label={`Marcar ${item.name} como pago`}
                          />
                          <span>{item.paid ? 'Pago' : 'Pendente'}</span>
                        </label>
                      </td>
                      <td>
                        <RowActions
                          onEdit={() => openEdit(item)}
                          onDelete={() => setConfirm(item)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="rule-empty-state variable-expenses-empty">
              <p>Nenhuma despesa variavel lancada ainda.</p>
              <span>Use descricao e valor para registrar um gasto pontual rapidamente.</span>
            </div>
          )}
        </div>
      </section>

      <ConfirmModal
        open={Boolean(confirm)}
        title="Confirmar exclusao"
        message={`Tem certeza que deseja apagar a despesa variavel "${confirm?.name || ''}"?`}
        onConfirm={async () => {
          if (confirm) await onDelete(confirm.id);
          setConfirm(null);
        }}
        onCancel={() => setConfirm(null)}
      />

      <RuleModal
        open={Boolean(modal)}
        title={modal?.mode === 'edit' ? 'Editar despesa variavel' : 'Nova despesa variavel'}
        onClose={closeModal}
        onSubmit={handleSubmit}
        submitLabel={modal?.mode === 'edit' ? 'Salvar alteracoes' : 'Adicionar despesa'}
      >
        <div className="form-grid">
          <Input
            label="Descricao"
            value={form.name}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setForm((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Mercado, farmacia, restaurante..."
            autoFocus
          />
          <Input
            label="Valor"
            type="text"
            value={form.amount}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setForm((prev) => ({ ...prev, amount: applyMoneyMask(e.target.value) }))
            }
            inputMode="numeric"
            autoComplete="off"
            placeholder="0,00"
          />
        </div>
        <div className="form-grid tri">
          <Input
            label="Data"
            type="date"
            value={form.date}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setForm((prev) => ({ ...prev, date: e.target.value }))
            }
          />
          <label className="field">
            <span>Categoria</span>
            <select
              value={form.category}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setForm((prev) => ({ ...prev, category: e.target.value }))
              }
            >
              {Object.entries(CATEGORIES).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Pagamento</span>
            <select
              value={form.paymentMethod}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setForm((prev) => ({
                  ...prev,
                  paymentMethod: e.target.value,
                  paid: e.target.value === 'cartao' ? 'false' : prev.paid,
                }))
              }
            >
              {paymentOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="form-grid">
          {form.paymentMethod === 'cartao' ? (
            <label className="field">
              <span>Cartao</span>
              <select
                value={form.card}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setForm((prev) => ({ ...prev, card: e.target.value }))
                }
              >
                {cards.map((card) => (
                  <option key={card.id} value={card.id}>
                    {normalizeCardName(card.name)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="field">
            <span>Status</span>
            <select
              value={form.paid}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setForm((prev) => ({ ...prev, paid: e.target.value }))
              }
            >
              <option value="true">Pago</option>
              <option value="false">Pendente</option>
            </select>
          </label>
        </div>
      </RuleModal>
    </>
  );
}

import { createFinanceId } from '../lib/ids';
import { OVERRIDE_TYPES, ALLOWED_PAYMENT_METHODS, ALLOWED_BILL_CARDS } from './constants';
import { monthKey } from '../lib/utils';
import { resetFinanceDatabase } from '../lib/storage';

export function parseLegacyCardBill(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value <= 0) return null;
    return value;
  }

  const raw = String(value).trim();
  if (!raw) return null;
  let normalized = raw.replace(/\s/g, '').replace(/[R$]/g, '');
  if (normalized.includes(',')) {
    normalized = normalized.replace(/\./g, '').replace(',', '.');
  }
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

export function normalizeFixedExpense(item) {
  const paymentMethod = item?.paymentMethod;
  const card = item?.card;

  if (paymentMethod === 'cartao' && (card === 'santander' || card === 'nubank')) {
    return { ...item, paymentMethod: card, card: null };
  }

  if (!ALLOWED_PAYMENT_METHODS.includes(paymentMethod)) {
    return { ...item, paymentMethod: 'boleto', card: null };
  }

  if (paymentMethod !== 'cartao') {
    return { ...item, card: null };
  }

  return { ...item, card: card || 'outro' };
}

export function normalizeInstallment(item) {
  const normalizedCard =
    item?.card === 'santander' || item?.card === 'nubank' || item?.card === 'outro'
      ? item.card
      : 'outro';
  return { ...item, card: normalizedCard };
}

export function migrateLegacyCardBills(loadedState) {
  const legacyCardBills = loadedState?.settings?.cardBills || {};
  const { cardBills: _legacyCardBills, ...settingsWithoutLegacyBills } =
    loadedState?.settings || {};
  const hasLegacyCardBills = Object.keys(legacyCardBills).length > 0;
  if (!hasLegacyCardBills) {
    return {
      ...loadedState,
      settings: settingsWithoutLegacyBills,
    };
  }

  const targetMonthKey = monthKey(loadedState.currentDate || new Date());
  const existingOverrides = loadedState.monthOverrides || [];
  const hasCurrentMonthBillOverride = existingOverrides.some(
    (override) =>
      override.type === OVERRIDE_TYPES.CARD_BILL_AMOUNT && override.monthKey === targetMonthKey
  );

  if (hasCurrentMonthBillOverride) {
    return {
      ...loadedState,
      settings: settingsWithoutLegacyBills,
    };
  }

  const migratedEntries = Object.entries(legacyCardBills)
    .filter(([card]) => ALLOWED_BILL_CARDS.includes(card))
    .map(([card, value]) => ({ card, amount: parseLegacyCardBill(value) }))
    .filter((entry) => entry.amount !== null);

  if (migratedEntries.length === 0) {
    return {
      ...loadedState,
      settings: settingsWithoutLegacyBills,
    };
  }

  return {
    ...loadedState,
    monthOverrides: [
      ...existingOverrides,
      ...migratedEntries.map((entry) => ({
        id: createFinanceId('ovr'),
        type: OVERRIDE_TYPES.CARD_BILL_AMOUNT,
        itemId: entry.card,
        monthKey: targetMonthKey,
        amount: entry.amount,
      })),
    ],
    settings: settingsWithoutLegacyBills,
  };
}

export function createActions(state, setState, currentDate) {
  return {
    changeMonth: (step) => {
      const next = new Date(currentDate);
      next.setMonth(next.getMonth() + step);
      setState((prev) => ({ ...prev, currentDate: next }));
    },
    resetDatabase: async () => {
      await resetFinanceDatabase();
      setState(null);
    },
    setTheme: (theme) =>
      setState((prev) => ({
        ...prev,
        settings: { ...prev.settings, theme },
      })),
    addFixedExpense: (data) =>
      setState((prev) => ({
        ...prev,
        fixedExpenses: [
          ...prev.fixedExpenses,
          {
            id: createFinanceId('fixed'),
            active: true,
            notes: '',
            endMonth: null,
            ...data,
          },
        ],
      })),
    addRevenue: (data) =>
      setState((prev) => ({
        ...prev,
        revenues: [
          ...prev.revenues,
          {
            id: createFinanceId('rev'),
            active: true,
            notes: '',
            endMonth: null,
            ...data,
          },
        ],
      })),
    addInstallment: (data) =>
      setState((prev) => ({
        ...prev,
        installments: [
          ...prev.installments,
          {
            id: createFinanceId('inst'),
            active: true,
            closedAt: null,
            currentInstallment: 1,
            ...data,
          },
        ],
      })),
    updateFixedExpense: (id, updates) =>
      setState((prev) => ({
        ...prev,
        fixedExpenses: prev.fixedExpenses.map((item) =>
          item.id === id ? { ...item, ...updates } : item
        ),
      })),
    removeFixedExpense: (id) =>
      setState((prev) => ({
        ...prev,
        fixedExpenses: prev.fixedExpenses.filter((item) => item.id !== id),
        monthOverrides: prev.monthOverrides.filter(
          (override) =>
            !(
              (override.type === OVERRIDE_TYPES.FIXED_EXPENSE ||
                override.type === OVERRIDE_TYPES.FIXED_EXPENSE_PAYMENT) &&
              override.itemId === id
            )
        ),
      })),
    updateRevenue: (id, updates) =>
      setState((prev) => ({
        ...prev,
        revenues: prev.revenues.map((item) => (item.id === id ? { ...item, ...updates } : item)),
      })),
    removeRevenue: (id) =>
      setState((prev) => ({
        ...prev,
        revenues: prev.revenues.filter((item) => item.id !== id),
        monthOverrides: prev.monthOverrides.filter(
          (override) => !(override.type === OVERRIDE_TYPES.REVENUE && override.itemId === id)
        ),
      })),
    updateInstallment: (id, updates) =>
      setState((prev) => ({
        ...prev,
        installments: prev.installments.map((item) =>
          item.id === id ? { ...item, ...updates } : item
        ),
      })),
    removeInstallment: (id) =>
      setState((prev) => ({
        ...prev,
        installments: prev.installments.filter((item) => item.id !== id),
        monthOverrides: prev.monthOverrides.filter(
          (override) =>
            !(override.type === OVERRIDE_TYPES.INSTALLMENT_PAYMENT && override.itemId === id)
        ),
      })),
    upsertMonthOverride: ({ type, itemId, monthKey: overrideMonthKey, amount, name, hidden, paid }) =>
      setState((prev) => {
        const idx = prev.monthOverrides.findIndex(
          (override) =>
            override.type === type &&
            override.itemId === itemId &&
            override.monthKey === overrideMonthKey
        );

        const cleaned = {
          ...(amount !== undefined ? { amount: Number(amount) } : {}),
          ...(name !== undefined ? { name } : {}),
          ...(hidden !== undefined ? { hidden } : {}),
          ...(typeof paid === 'boolean' ? { paid } : {}),
        };

        if (idx === -1) {
          return {
            ...prev,
            monthOverrides: [
              ...prev.monthOverrides,
              {
                id: createFinanceId('ovr'),
                type,
                itemId,
                monthKey: overrideMonthKey,
                ...cleaned,
              },
            ],
          };
        }

        const nextOverrides = [...prev.monthOverrides];
        nextOverrides[idx] = { ...nextOverrides[idx], ...cleaned };
        return { ...prev, monthOverrides: nextOverrides };
      }),
    clearMonthOverride: ({ type, itemId, monthKey: overrideMonthKey }) =>
      setState((prev) => ({
        ...prev,
        monthOverrides: prev.monthOverrides.filter(
          (override) =>
            !(
              override.type === type &&
              override.itemId === itemId &&
              override.monthKey === overrideMonthKey
            )
        ),
      })),
  };
}
import { createFinanceId } from '../lib/ids';
import { monthKey } from '../lib/utils';
import { OVERRIDE_TYPES } from './constants';
import type { FinanceState } from './types';

export function parseLegacyCardBill(value: unknown): number | null {
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

function createEmptyFinanceState(): FinanceState {
  return {
    currentDate: new Date(),
    fixedExpenses: [],
    installments: [],
    revenues: [],
    monthOverrides: [],
    settings: { theme: 'default' },
    meta: {
      schemaVersion: 3,
      createdAt: new Date(),
      lastResetAt: null,
    },
  };
}

export function migrateLegacyCardBills(loadedState: Record<string, unknown>): FinanceState {
  const settings = loadedState?.settings as Record<string, unknown> | undefined;
  const rawCardBills = settings?.cardBills;
  const legacyCardBills =
    rawCardBills && !Array.isArray(rawCardBills) ? (rawCardBills as Record<string, unknown>) : {};
  const legacyTheme = settings?.theme;
  const settingsWithoutLegacyBills = { ...(settings || {}) };
  delete settingsWithoutLegacyBills.cardBills;
  delete settingsWithoutLegacyBills.theme;
  const hasLegacyCardBills = Object.keys(legacyCardBills).length > 0;
  const normalizedSettings = {
    theme: typeof legacyTheme === 'string' ? legacyTheme : 'default',
    ...(settingsWithoutLegacyBills as Record<string, unknown>),
  } as FinanceState['settings'];

  const emptyState = createEmptyFinanceState();

  if (!hasLegacyCardBills) {
    return {
      ...emptyState,
      ...loadedState,
      settings: {
        ...normalizedSettings,
        ...(Array.isArray(rawCardBills) ? { cardBills: rawCardBills } : {}),
      },
    };
  }

  const targetMonthKey = monthKey((loadedState?.currentDate as Date) || new Date());
  const existingOverrides = (loadedState?.monthOverrides as FinanceState['monthOverrides']) || [];
  const hasCurrentMonthBillOverride = existingOverrides.some(
    (override) =>
      override.type === OVERRIDE_TYPES.CARD_BILL_AMOUNT && override.monthKey === targetMonthKey
  );

  if (hasCurrentMonthBillOverride) {
    return {
      ...emptyState,
      ...loadedState,
      settings: {
        ...normalizedSettings,
        ...(Array.isArray(rawCardBills) ? { cardBills: rawCardBills } : {}),
      },
    };
  }

  const migratedEntries = Object.entries(legacyCardBills)
    .filter(([card]) => typeof card === 'string' && card.trim() !== '')
    .flatMap(([card, value]) => {
      const amount = parseLegacyCardBill(value);
      return amount === null ? [] : [{ card, amount }];
    }) as Array<{ card: string; amount: number }>;

  if (migratedEntries.length === 0) {
    return {
      ...emptyState,
      ...loadedState,
      settings: {
        ...normalizedSettings,
        ...(Array.isArray(rawCardBills) ? { cardBills: rawCardBills } : {}),
      },
    };
  }

  return {
    ...emptyState,
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
    settings: {
      ...normalizedSettings,
      ...(Array.isArray(rawCardBills) ? { cardBills: rawCardBills } : {}),
    },
  };
}

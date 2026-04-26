import Dexie, { type Table } from 'dexie';
import { emptyFinanceState, financeSchemaVersion } from './schema.js';
import { monthKey } from './utils.js';
import type { FixedExpense, Installment, Revenue, MonthOverride, Settings, Meta } from '../domain/types.js';

interface SettingsRow {
  key: string;
  value: unknown;
}

interface MetaRow {
  key: string;
  value: unknown;
}

class FinanceDatabase extends Dexie {
  fixedExpenses!: Table<FixedExpense>;
  installments!: Table<Installment>;
  revenues!: Table<Revenue>;
  monthOverrides!: Table<MonthOverride>;
  settings!: Table<SettingsRow>;
  meta!: Table<MetaRow>;

  constructor() {
    super('controle-financeiro-v2-db');
    this.version(1).stores({
      fixedExpenses: 'id,active,startMonth,endMonth',
      installments: 'id,active,startMonth,closedAt',
      revenues: 'id,active,startMonth,endMonth',
      monthOverrides: 'id,type,itemId,monthKey',
      settings: 'key',
      meta: 'key',
    });

    this.version(2).upgrade(() => {
      return this.table('importedTransactions').clear();
    });

    this.version(3).stores({
      fixedExpenses: 'id,active,startMonth,endMonth',
      installments: 'id,active,startMonth,closedAt',
      revenues: 'id,active,startMonth,endMonth',
      monthOverrides: 'id,type,itemId,monthKey',
      settings: 'key',
      meta: 'key',
    });
  }
}

const db = new FinanceDatabase();

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export async function loadFinanceState() {
  const [fixedExpenses, installments, revenues, monthOverrides, settingsRows, metaRows] =
    await Promise.all([
      db.fixedExpenses.toArray(),
      db.installments.toArray(),
      db.revenues.toArray(),
      db.monthOverrides.toArray(),
      db.settings.toArray(),
      db.meta.toArray(),
    ]);

  const settings = settingsRows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {} as Record<string, unknown>);
  const meta = metaRows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {} as Record<string, unknown>);
  const currentMonthKey = (settings.currentMonthKey as string | null) || null;

  const currentDate = currentMonthKey ? new Date(`${currentMonthKey}-01T00:00:00`) : new Date();

  const defaultState = emptyFinanceState();

  return {
    ...clone(defaultState),
    currentDate,
    fixedExpenses,
    installments,
    revenues,
    monthOverrides,
    settings: { ...defaultState.settings, ...settings, currentMonthKey } as Settings,
    meta: {
      ...defaultState.meta,
      schemaVersion: financeSchemaVersion,
      ...meta,
    } as Meta,
  };
}

export async function saveFinanceState(state: ReturnType<typeof emptyFinanceState> | null) {
  const payload = state || emptyFinanceState();
  const currentMonthKey = monthKey(payload.currentDate || new Date());

  await db.transaction('rw', [db.fixedExpenses, db.installments, db.revenues, db.monthOverrides, db.settings, db.meta], async () => {
      await db.fixedExpenses.clear();
      await db.installments.clear();
      await db.revenues.clear();
      await db.monthOverrides.clear();
      await db.settings.clear();
      await db.meta.clear();

      if (payload.fixedExpenses?.length) await db.fixedExpenses.bulkPut(payload.fixedExpenses);
      if (payload.installments?.length) await db.installments.bulkPut(payload.installments);
      if (payload.revenues?.length) await db.revenues.bulkPut(payload.revenues);
      if (payload.monthOverrides?.length) await db.monthOverrides.bulkPut(payload.monthOverrides);

      const settingsEntries = Object.entries(payload.settings || {}).map(([key, value]) => ({
        key,
        value,
      }));
      const mergedSettings = settingsEntries.filter((entry) => entry.key !== 'currentMonthKey');
      mergedSettings.push({ key: 'currentMonthKey', value: currentMonthKey });
      const metaEntries = Object.entries({
        ...payload.meta,
        schemaVersion: financeSchemaVersion,
      }).map(([key, value]) => ({ key, value }));

      if (mergedSettings.length) await db.settings.bulkPut(mergedSettings);
      if (metaEntries.length) await db.meta.bulkPut(metaEntries);
    }
  );
}

export async function resetFinanceDatabase() {
  await db.delete();
}

export { db as financeDb };
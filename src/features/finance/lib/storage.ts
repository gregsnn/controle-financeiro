import Dexie, { type Table } from 'dexie';
import type {
  FixedExpense,
  Installment,
  Meta,
  MonthOverride,
  Revenue,
  Settings,
} from '../domain/types.js';
import { emptyFinanceState, financeSchemaVersion } from './schema.js';
import { monthKey } from './utils.js';

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

    // Version 2: Removed - legacy importedTransactions table cleanup
    // No longer needed as importedTransactions table was deprecated

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

  const settings = settingsRows.reduce(
    (acc, row) => ({ ...acc, [row.key]: row.value }),
    {} as Record<string, unknown>
  );
  const meta = metaRows.reduce(
    (acc, row) => ({ ...acc, [row.key]: row.value }),
    {} as Record<string, unknown>
  );
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
  // Perform incremental writes: update/insert new items and remove deleted ones
  await db.transaction(
    'rw',
    [db.fixedExpenses, db.installments, db.revenues, db.monthOverrides, db.settings, db.meta],
    async () => {
      // Helper to sync a table by id
      async function syncTable<T extends { id: string }>(
        table: Table<T, string>,
        items: T[] | undefined
      ) {
        const desired = items || [];
        const existing = await table.toArray();
        const desiredMap = new Map(desired.map((it) => [it.id, it]));
        const existingIds = existing.map((e) => e.id);

        // Upsert desired items
        if (desired.length > 0) await table.bulkPut(desired as T[]);

        // Delete items that exist but are not desired
        const toDelete = existingIds.filter((id) => !desiredMap.has(id));
        if (toDelete.length) await table.bulkDelete(toDelete as string[]);
      }

      await syncTable(db.fixedExpenses, payload.fixedExpenses);
      await syncTable(db.installments, payload.installments);
      await syncTable(db.revenues, payload.revenues);
      await syncTable(db.monthOverrides, payload.monthOverrides);

      // Sync settings and meta as key/value pairs
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

      if (mergedSettings.length) await db.settings.bulkPut(mergedSettings as unknown as any[]);
      // remove settings keys that are not present
      const existingSettings = await db.settings.toArray();
      const settingsToDelete = existingSettings
        .map((s) => s.key)
        .filter((k) => !mergedSettings.some((e) => e.key === k));
      if (settingsToDelete.length) await db.settings.bulkDelete(settingsToDelete as string[]);

      if (metaEntries.length) await db.meta.bulkPut(metaEntries as unknown as any[]);
      const existingMeta = await db.meta.toArray();
      const metaToDelete = existingMeta
        .map((m) => m.key)
        .filter((k) => !metaEntries.some((e) => e.key === k));
      if (metaToDelete.length) await db.meta.bulkDelete(metaToDelete as string[]);
    }
  );
}

export async function resetFinanceDatabase() {
  await db.delete();
}

export { db as financeDb };

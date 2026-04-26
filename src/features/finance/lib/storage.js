import Dexie from 'dexie';
import { emptyFinanceState, financeSchemaVersion } from './schema.js';
import { monthKey } from './utils.js';

const db = new Dexie('controle-financeiro-v2-db');

db.version(1).stores({
  fixedExpenses: 'id,active,startMonth,endMonth',
  installments: 'id,active,startMonth,closedAt',
  revenues: 'id,active,startMonth,endMonth',
  monthOverrides: 'id,type,itemId,monthKey',
  settings: 'key',
  meta: 'key',
});

db.version(2).upgrade((tx) => {
  return tx.table('importedTransactions').clear();
});

db.version(3).stores({
  fixedExpenses: 'id,active,startMonth,endMonth',
  installments: 'id,active,startMonth,closedAt',
  revenues: 'id,active,startMonth,endMonth',
  monthOverrides: 'id,type,itemId,monthKey',
  settings: 'key',
  meta: 'key',
});

function clone(value) {
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

  const settings = settingsRows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
  const meta = metaRows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
  const currentMonthKey = settings.currentMonthKey || null;

  const currentDate = currentMonthKey ? new Date(`${currentMonthKey}-01T00:00:00`) : new Date();

  return {
    ...clone(emptyFinanceState),
    currentDate,
    fixedExpenses,
    installments,
    revenues,
    monthOverrides,
    settings: { ...emptyFinanceState.settings, ...settings, currentMonthKey },
    meta: {
      ...emptyFinanceState.meta,
      schemaVersion: financeSchemaVersion,
      ...meta,
    },
  };
}

export async function saveFinanceState(state) {
  const payload = state || emptyFinanceState;
  const currentMonthKey = monthKey(payload.currentDate || new Date());

  await db.transaction(
    'rw',
    db.fixedExpenses,
    db.installments,
    db.revenues,
    db.monthOverrides,
    db.settings,
    db.meta,
    async () => {
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

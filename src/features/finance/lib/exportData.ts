import {
  migrateLegacyCardBills,
  normalizeFixedExpense,
  normalizeInstallment,
  normalizeRevenue,
  normalizeVariableExpense,
} from '../domain/actions';
import type { FinanceState } from '../domain/types';
import { emptyFinanceState, financeSchemaVersion } from './schema';
import { loadFinanceState } from './storage';

export interface ExportData {
  version: number;
  exportedAt: string;
  data: {
    fixedExpenses: unknown[];
    variableExpenses: unknown[];
    installments: unknown[];
    revenues: unknown[];
    monthOverrides: unknown[];
    settings: Record<string, unknown>;
    meta: Record<string, unknown>;
  };
}

type ExportDataInput = ExportData | Record<string, unknown>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function toRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function toDate(value: unknown, fallback: Date): Date {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return fallback;
}

function toNullableDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') return null;
  return toDate(value, new Date(NaN));
}

function normalizeBackupData(input: unknown): ExportData['data'] {
  const root = isRecord(input) && isRecord(input.data) ? input.data : toRecord(input);

  return {
    fixedExpenses: toArray(root.fixedExpenses),
    variableExpenses: toArray(root.variableExpenses),
    installments: toArray(root.installments),
    revenues: toArray(root.revenues),
    monthOverrides: toArray(root.monthOverrides),
    settings: toRecord(root.settings),
    meta: toRecord(root.meta),
  };
}

export function buildFinanceStateFromBackup(input: unknown): FinanceState {
  const data = normalizeBackupData(input);
  const base = emptyFinanceState();
  const currentMonthKey =
    typeof data.settings.currentMonthKey === 'string' && data.settings.currentMonthKey
      ? data.settings.currentMonthKey
      : typeof (data as Record<string, unknown>).currentMonthKey === 'string'
        ? ((data as Record<string, unknown>).currentMonthKey as string)
        : '';

  const currentDate = currentMonthKey
    ? new Date(`${currentMonthKey}-01T00:00:00`)
    : toDate((data as Record<string, unknown>).currentDate, base.currentDate);

  const importedState = migrateLegacyCardBills({
    ...base,
    currentDate,
    fixedExpenses: data.fixedExpenses.map((item) =>
      normalizeFixedExpense(item as Record<string, unknown>)
    ),
    variableExpenses: data.variableExpenses.map((item) =>
      normalizeVariableExpense(item as Record<string, unknown>)
    ),
    installments: data.installments.map((item) =>
      normalizeInstallment(item as Record<string, unknown>)
    ),
    revenues: data.revenues.map((item) => normalizeRevenue(item as Record<string, unknown>)),
    monthOverrides: data.monthOverrides as FinanceState['monthOverrides'],
    settings: {
      ...base.settings,
      ...data.settings,
    },
    meta: {
      ...base.meta,
      ...data.meta,
      schemaVersion: financeSchemaVersion,
      createdAt: toDate(data.meta.createdAt, base.meta.createdAt),
      lastResetAt: toNullableDate(data.meta.lastResetAt),
    },
  });

  return {
    ...importedState,
    currentDate,
    meta: {
      ...importedState.meta,
      schemaVersion: financeSchemaVersion,
    },
  };
}

async function exportAllData(): Promise<ExportData> {
  const state = await loadFinanceState();

  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    data: {
      fixedExpenses: state.fixedExpenses,
      variableExpenses: state.variableExpenses,
      installments: state.installments,
      revenues: state.revenues,
      monthOverrides: state.monthOverrides,
      settings: state.settings as unknown as Record<string, unknown>,
      meta: state.meta as unknown as Record<string, unknown>,
    },
  };
}

function encodeStateToHash(state: ExportData): string {
  const json = JSON.stringify(state);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeHashToState(hash: string): ExportData | null {
  try {
    const padded =
      hash.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - (hash.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json) as ExportData;
  } catch (e) {
    console.error('Erro ao decodificar hash:', e);
    return null;
  }
}

async function generateExportLink(): Promise<string> {
  const state = await loadFinanceState();
  const data = {
    version: 2,
    exportedAt: new Date().toISOString(),
    data: {
      fixedExpenses: state.fixedExpenses,
      variableExpenses: state.variableExpenses,
      installments: state.installments,
      revenues: state.revenues,
      monthOverrides: state.monthOverrides,
      settings: state.settings as unknown as Record<string, unknown>,
      meta: state.meta as unknown as Record<string, unknown>,
    },
  };
  const encoded = encodeStateToHash(data);
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}#import=${encoded}`;
}

async function downloadJSON(): Promise<void> {
  const data = await exportAllData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `finance-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

async function importFinanceBackupFile(file: File): Promise<FinanceState> {
  const raw = JSON.parse(await file.text()) as ExportDataInput;
  return buildFinanceStateFromBackup(raw);
}

export {
  decodeHashToState,
  downloadJSON,
  encodeStateToHash,
  exportAllData,
  generateExportLink,
  importFinanceBackupFile,
};

if (typeof window !== 'undefined') {
  (window as any).exportFinanceData = downloadJSON;
  (window as any).importFinanceData = importFinanceBackupFile;
}

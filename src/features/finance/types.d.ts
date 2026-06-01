declare module '*.css';

declare module 'src/features/finance/lib/exportData' {
  export function downloadJSON(): Promise<void>;
  export function exportAllData(): Promise<unknown>;
  export function buildFinanceStateFromBackup(input: unknown): unknown;
  export function importFinanceBackupFile(file: File): Promise<unknown>;
}

declare module 'src/features/finance/lib/chartLoader' {
  export function loadChartModule(): Promise<unknown>;
  export function prefetchChartModule(options?: unknown): boolean;
  export function shouldPrefetchChart(connection?: unknown): boolean;
  export function __resetChartLoaderForTests(): void;
}

declare module 'src/features/finance/lib/chartSeries' {
  export const CHART_COLORS: string[];
  export function buildCategorySeries(monthView: unknown): { labels: string[]; values: number[] };
  export function buildCardSeries(monthView: unknown): { labels: string[]; values: number[] };
  export function buildCardStatusSeries(monthView: unknown): {
    labels: string[];
    paidValues: number[];
    toPayValues: number[];
  };
  export function buildDonutTooltipLabel(context: unknown): string;
}

declare module 'src/features/finance/context/FinanceContext' {
  import type { JSX, ReactNode } from 'react';
  export interface FinanceContextValue {
    isReady: boolean;
    currentDate: Date;
    currentKey: string;
    monthView: unknown;
    fixedExpenses: unknown[];
    installments: unknown[];
    revenues: unknown[];
    monthOverrides: unknown[];
    settings: { theme: string };
    meta: unknown;
    changeMonth: (step: number) => void;
    resetDatabase: () => Promise<void>;
    importFinanceState: (state: unknown) => void;
    setTheme: (theme: string) => void;
    addFixedExpense: (data: unknown) => void;
    addRevenue: (data: unknown) => void;
    addInstallment: (data: unknown) => void;
    updateFixedExpense: (id: string, updates: unknown) => void;
    removeFixedExpense: (id: string) => void;
    updateRevenue: (id: string, updates: unknown) => void;
    removeRevenue: (id: string) => void;
    updateInstallment: (id: string, updates: unknown) => void;
    removeInstallment: (id: string) => void;
    upsertMonthOverride: (params: unknown) => void;
    clearMonthOverride: (params: unknown) => void;
  }
  export function FinanceProvider({ children }: { children: ReactNode }): JSX.Element;
  export function useFinance(): FinanceContextValue;
}

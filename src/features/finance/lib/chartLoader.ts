let chartModulePromise: Promise<unknown> | null = null;
let prefetchScheduled = false;

import { parseCurrencyString } from './currency';

interface Connection {
  saveData?: boolean;
  effectiveType?: string;
}

function readConnection(): Connection | null {
  if (typeof navigator === 'undefined') return null;
  const nav = navigator as unknown as Record<string, Connection | null>;
  return nav.connection || nav.mozConnection || nav.webkitConnection || null;
}

export function shouldPrefetchChart(connection: Connection | null): boolean {
  if (!connection) return true;
  if (connection.saveData === true) return false;

  const effectiveType = String(connection.effectiveType || '').toLowerCase();
  if (effectiveType === '2g' || effectiveType === 'slow-2g') return false;
  return true;
}

export function loadChartModule(): Promise<unknown> {
  if (!chartModulePromise) {
    chartModulePromise = import('chart.js/auto');
  }
  return chartModulePromise;
}

import { createCurrencyFormatter } from './currency';

export function getChartLoader(locale: string) {
  return {
    formatters: {
      currency: createCurrencyFormatter(locale),
    },
    parseCurrency: (value: string): number => {
      return parseCurrencyString(value);
    },
  };
}

interface PrefetchOptions {
  force?: boolean;
  connection?: Connection | null;
  requestIdle?: ((callback: () => void, options?: { timeout?: number }) => void) | null;
  timeoutFn?: typeof setTimeout | null;
  loadModule?: () => Promise<unknown>;
}

export function prefetchChartModule(options: PrefetchOptions = {}): boolean {
  const {
    force = false,
    connection = readConnection(),
    requestIdle = typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function'
      ? window.requestIdleCallback.bind(window)
      : null,
    timeoutFn = typeof setTimeout === 'function' ? setTimeout : null,
    loadModule = loadChartModule,
  } = options;

  if (prefetchScheduled) return false;
  if (!force && !shouldPrefetchChart(connection)) return false;

  prefetchScheduled = true;

  const run = () => {
    Promise.resolve(loadModule()).catch(() => {
      prefetchScheduled = false;
    });
  };

  if (typeof requestIdle === 'function') {
    requestIdle(run, { timeout: 1500 });
    return true;
  }

  if (typeof timeoutFn === 'function') {
    timeoutFn(run, 250);
    return true;
  }

  run();
  return true;
}

export function __resetChartLoaderForTests(): void {
  chartModulePromise = null;
  prefetchScheduled = false;
}

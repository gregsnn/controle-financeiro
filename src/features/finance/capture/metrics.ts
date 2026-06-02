import type { CaptureIntent } from './types';

const CAPTURE_METRICS_KEY = 'ledger.capture.metrics.v1';

export interface CaptureMetrics {
  saved: number;
  reviewed: number;
  cancelled: number;
  intents: Record<string, number>;
}

const EMPTY_METRICS: CaptureMetrics = {
  saved: 0,
  reviewed: 0,
  cancelled: 0,
  intents: {},
};

type CaptureStorage = Pick<Storage, 'getItem' | 'setItem'>;

function getStorage(): CaptureStorage | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}

function isMetrics(value: unknown): value is CaptureMetrics {
  return Boolean(value) && typeof value === 'object';
}

export function loadCaptureMetrics(storage: CaptureStorage | null = getStorage()): CaptureMetrics {
  if (!storage) return EMPTY_METRICS;

  try {
    const raw = storage.getItem(CAPTURE_METRICS_KEY);
    if (!raw) return EMPTY_METRICS;
    const parsed: unknown = JSON.parse(raw);
    if (!isMetrics(parsed)) return EMPTY_METRICS;
    const item = parsed as Partial<CaptureMetrics>;

    return {
      saved: Number(item.saved || 0),
      reviewed: Number(item.reviewed || 0),
      cancelled: Number(item.cancelled || 0),
      intents:
        item.intents && typeof item.intents === 'object' && !Array.isArray(item.intents)
          ? (item.intents as Record<string, number>)
          : {},
    };
  } catch {
    return EMPTY_METRICS;
  }
}

export function recordCaptureMetric(
  event: 'saved' | 'reviewed' | 'cancelled',
  intent: CaptureIntent,
  storage: CaptureStorage | null = getStorage()
) {
  if (!storage) return;
  const metrics = loadCaptureMetrics(storage);
  const nextMetrics: CaptureMetrics = {
    ...metrics,
    [event]: metrics[event] + 1,
    intents: {
      ...metrics.intents,
      [intent]: (metrics.intents[intent] || 0) + 1,
    },
  };

  try {
    storage.setItem(CAPTURE_METRICS_KEY, JSON.stringify(nextMetrics));
  } catch {
    // Métricas locais não podem bloquear captura.
  }
}

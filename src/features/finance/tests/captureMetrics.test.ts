import { describe, expect, it } from 'vitest';
import { loadCaptureMetrics, recordCaptureMetric } from '../capture/metrics';

function storage(initialValue: string | null = null) {
  let value = initialValue;

  return {
    getItem: () => value,
    setItem: (_key: string, nextValue: string) => {
      value = nextValue;
    },
  };
}

describe('capture metrics', () => {
  it('ignores corrupted local metrics', () => {
    expect(loadCaptureMetrics(storage('{bad-json'))).toEqual({
      saved: 0,
      reviewed: 0,
      cancelled: 0,
      intents: {},
    });
  });

  it('records local counters by event and intent', () => {
    const fakeStorage = storage();

    recordCaptureMetric('saved', 'variableExpense', fakeStorage);
    recordCaptureMetric('reviewed', 'installment', fakeStorage);
    recordCaptureMetric('saved', 'variableExpense', fakeStorage);

    expect(loadCaptureMetrics(fakeStorage)).toEqual({
      saved: 2,
      reviewed: 1,
      cancelled: 0,
      intents: {
        variableExpense: 2,
        installment: 1,
      },
    });
  });
});

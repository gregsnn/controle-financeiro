import { describe, it, expect, beforeEach } from 'vitest';
import {
  shouldPrefetchChart,
  loadChartModule,
  prefetchChartModule,
  __resetChartLoaderForTests,
} from '../lib/chartLoader';

describe('chartLoader.ts', () => {
  beforeEach(() => {
    __resetChartLoaderForTests();
  });

  describe('shouldPrefetchChart', () => {
    it('returns true when no connection', () => {
      expect(shouldPrefetchChart(null)).toBe(true);
    });

    it('returns false when saveData is true', () => {
      expect(shouldPrefetchChart({ saveData: true })).toBe(false);
    });

    it('returns false for slow connections', () => {
      expect(shouldPrefetchChart({ effectiveType: '2g' })).toBe(false);
      expect(shouldPrefetchChart({ effectiveType: 'slow-2g' })).toBe(false);
    });

    it('returns true for fast connections', () => {
      expect(shouldPrefetchChart({ effectiveType: '4g' })).toBe(true);
    });
  });

  describe('loadChartModule', () => {
    it('returns a promise', () => {
      const result = loadChartModule();
      expect(result).toBeInstanceOf(Promise);
    });

    it('caches the module', async () => {
      const result1 = loadChartModule();
      const result2 = loadChartModule();
      expect(result1).toBe(result2);
    });
  });

  describe('prefetchChartModule', () => {
    it('returns false when already scheduled', () => {
      const result1 = prefetchChartModule({ force: true });
      const result2 = prefetchChartModule({ force: true });
      expect(result1).toBe(true);
      expect(result2).toBe(false);
    });

    it('returns false when saveData is enabled', () => {
      expect(prefetchChartModule({ connection: { saveData: true } })).toBe(false);
    });

    it('returns false for 2g connection', () => {
      expect(prefetchChartModule({ connection: { effectiveType: '2g' } })).toBe(false);
    });

    it('returns true with force option', () => {
      expect(prefetchChartModule({ force: true })).toBe(true);
    });
  });
});

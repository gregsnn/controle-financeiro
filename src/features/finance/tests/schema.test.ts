import { describe, it, expect } from 'vitest';
import { financeSchemaVersion, emptyFinanceState } from '../lib/schema';

describe('schema.js', () => {
  describe('financeSchemaVersion', () => {
    it('is a positive number', () => {
      expect(financeSchemaVersion).toBeGreaterThan(0);
    });

    it('is greater or equal to 1', () => {
      expect(financeSchemaVersion).toBeGreaterThanOrEqual(1);
    });
  });

  describe('emptyFinanceState', () => {
    it('has currentDate as Date', () => {
      expect(emptyFinanceState().currentDate).toBeInstanceOf(Date);
    });

    it('has fixedExpenses array', () => {
      expect(emptyFinanceState()).toHaveProperty('fixedExpenses');
      expect(Array.isArray(emptyFinanceState().fixedExpenses)).toBe(true);
    });

    it('has installments array', () => {
      expect(emptyFinanceState()).toHaveProperty('installments');
      expect(Array.isArray(emptyFinanceState().installments)).toBe(true);
    });

    it('has revenues array', () => {
      expect(emptyFinanceState()).toHaveProperty('revenues');
      expect(Array.isArray(emptyFinanceState().revenues)).toBe(true);
    });

    it('has monthOverrides array', () => {
      expect(emptyFinanceState()).toHaveProperty('monthOverrides');
      expect(Array.isArray(emptyFinanceState().monthOverrides)).toBe(true);
    });

    it('has settings with theme', () => {
      expect(emptyFinanceState().settings).toHaveProperty('theme');
    });

    it('has meta with schemaVersion', () => {
      expect(emptyFinanceState().meta).toHaveProperty('schemaVersion');
    });

    it('has meta with createdAt', () => {
      expect(emptyFinanceState().meta).toHaveProperty('createdAt');
    });

    it('has meta with lastResetAt null initially', () => {
      expect(emptyFinanceState().meta.lastResetAt).toBeNull();
    });
  });
});

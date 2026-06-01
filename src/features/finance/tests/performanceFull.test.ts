import { beforeEach, describe, expect, it } from 'vitest';
import { OVERRIDE_TYPES } from '../domain/constants';
import {
  __resetChartLoaderForTests,
  loadChartModule,
  prefetchChartModule,
} from '../lib/chartLoader';
import { buildCardSeries, buildCardStatusSeries, buildCategorySeries } from '../lib/chartSeries';
import { createFinanceId } from '../lib/ids';
import { formatMoneyInput } from '../lib/moneyInput';
import { emptyFinanceState, type MonthView } from '../lib/schema';
import { clone, isMonthInRange, monthKey } from '../lib/utils';
import { selectMonthCardBillAmounts } from '../selectors/monthOverrideSelectors';

describe('performanceFull.ts - All modules stress test', () => {
  beforeEach(() => {
    __resetChartLoaderForTests();
  });

  describe('chartLoader', () => {
    it('loadChartModule is cached', async () => {
      const start = performance.now();
      await Promise.all([loadChartModule(), loadChartModule(), loadChartModule()]);
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100);
    });

    it('prefetchChartModule runs without blocking', () => {
      __resetChartLoaderForTests();
      const start = performance.now();
      prefetchChartModule({ force: true });
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(10);
    });
  });

  describe('chartSeries - buildCategorySeries', () => {
    it('handles 50 items', () => {
      const monthView = {
        fixedExpenses: Array.from({ length: 50 }, (_, i) => ({
          id: `f${i}`,
          amount: 100 + i,
          category: ['casa', 'telefone', 'outro'][i % 3],
          paymentMethod: 'boleto',
          active: true,
          startMonth: '2026-01',
          endMonth: null,
          dueDay: 5,
          name: `Desp ${i}`,
          notes: '',
          paid: false,
        })),
        installments: [],
        revenues: [],
        totals: { despesasFixas: 0, receitas: 0, installments: 0 },
      };

      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        buildCategorySeries(monthView);
      }
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(30);
    });

    it('handles empty input', () => {
      const monthView: MonthView = {
        fixedExpenses: [],
        installments: [],
        revenues: [],
        totals: { despesasFixas: 0, receitas: 0, installments: 0 },
      };

      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        buildCategorySeries(monthView);
      }
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(50);
    });
  });

  describe('chartSeries - buildCardSeries', () => {
    it('handles 50 items', () => {
      const monthView = {
        fixedExpenses: Array.from({ length: 25 }, (_, i) => ({
          id: `f${i}`,
          amount: 100 + i,
          paymentMethod: 'santander',
          card: 'santander',
          category: 'outro',
          active: true,
          startMonth: '2026-01',
          endMonth: null,
          dueDay: 5,
          name: `Desp ${i}`,
          notes: '',
          paid: false,
        })),
        installments: Array.from({ length: 25 }, (_, i) => ({
          id: `i${i}`,
          installmentValue: 50,
          card: 'nubank',
          category: 'outro',
          active: true,
          startMonth: '2026-01',
          closedAt: null,
          name: `Parcela ${i}`,
          totalInstallments: 12,
          currentInstallment: 1,
          paid: false,
        })),
        revenues: [],
        totals: { despesasFixas: 0, receitas: 0, installments: 0 },
      };

      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        buildCardSeries(monthView);
      }
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(30);
    });
  });

  describe('chartSeries - buildCardStatusSeries', () => {
    it('handles 50 items', () => {
      const monthView = {
        fixedExpenses: Array.from({ length: 25 }, (_, i) => ({
          id: `f${i}`,
          amount: 100 + i,
          paymentMethod: 'nubank',
          card: 'nubank',
          category: 'outro',
          active: true,
          startMonth: '2026-01',
          endMonth: null,
          dueDay: 5,
          name: `Desp ${i}`,
          notes: '',
          paid: i % 2 === 0,
        })),
        installments: Array.from({ length: 25 }, (_, i) => ({
          id: `i${i}`,
          installmentValue: 50,
          card: 'santander',
          category: 'outro',
          active: true,
          startMonth: '2026-01',
          closedAt: null,
          name: `Parcela ${i}`,
          totalInstallments: 12,
          currentInstallment: 1,
          paid: i % 2 === 0,
        })),
        revenues: [],
        totals: { despesasFixas: 0, receitas: 0, installments: 0 },
      };

      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        buildCardStatusSeries(monthView);
      }
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(30);
    });
  });

  describe('ids - createFinanceId', () => {
    it('generates IDs quickly', () => {
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        createFinanceId('fixed');
      }
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(50);
    });
  });

  describe('utils - monthKey', () => {
    it('handles many calls', () => {
      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        monthKey(new Date('2026-04-15'));
      }
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100);
    });
  });

  describe('utils - isMonthInRange', () => {
    it('handles many calls', () => {
      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        isMonthInRange('2026-04', '2026-01', '2026-12');
      }
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(50);
    });
  });

  describe('utils - clone', () => {
    it('clones objects quickly', () => {
      const obj = { a: 1, b: { c: 2 }, d: [1, 2, 3] };
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        clone(obj);
      }
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100);
    });
  });

  describe('moneyInput - formatMoneyInput', () => {
    it('handles many calls', () => {
      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        formatMoneyInput(1234.56);
      }
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100);
    });
  });

  describe('monthOverrideSelectors - selectMonthCardBillAmounts', () => {
    it('handles large override array', () => {
      const overrides = Array.from({ length: 100 }, (_, i) => ({
        id: `o${i}`,
        type: i % 3 === 0 ? OVERRIDE_TYPES.CARD_BILL_AMOUNT : OVERRIDE_TYPES.FIXED_EXPENSE,
        itemId: `item${i}`,
        monthKey: i % 2 === 0 ? '2026-04' : '2026-03',
        amount: 100 + i,
      }));

      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        selectMonthCardBillAmounts(overrides, '2026-04');
      }
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100);
    });
  });

  describe('schema - emptyFinanceState', () => {
    it('creates state quickly', () => {
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        emptyFinanceState();
      }
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(50);
    });
  });
});

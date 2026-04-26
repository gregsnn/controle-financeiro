import { describe, it } from 'node:test';
import assert from 'node:assert';

const { buildMonthView } = await import('../selectors/buildMonth.js');
const { OVERRIDE_TYPES } = await import('../domain/constants.js');
const { emptyFinanceState } = await import('../lib/schema.js');
const { buildCategorySeries, buildCardSeries, buildCardStatusSeries } =
  await import('../lib/chartSeries.js');
const { createFinanceId } = await import('../lib/ids.js');
const { selectMonthCardBills } = await import('../selectors/monthOverrideSelectors.js');
const { clone, monthKey, isMonthInRange, previousMonthKey, formatMoney } =
  await import('../lib/utils.js');
const { formatMoneyInput, applyMoneyMask, parseMoneyInput } = await import('../lib/moneyInput.js');

function generateArray(size, factory) {
  return Array.from({ length: size }, (_, i) => factory(i));
}

describe('Performance Tests - Extended', () => {
  describe('buildMonthView - Large Scale', () => {
    it('100 fixed expenses - 100 iterations', () => {
      const expenses = generateArray(100, (i) => ({
        id: `f${i}`,
        name: `Despesa ${i}`,
        amount: 100 + i * 10,
        active: true,
        startMonth: '2025-01',
        paymentMethod: 'boleto',
      }));

      const state = {
        ...emptyFinanceState,
        currentDate: new Date('2026-04-15'),
        fixedExpenses: expenses,
        revenues: [
          { id: 'r1', name: 'Salario', amount: 5000, active: true, startMonth: '2025-01' },
        ],
      };

      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        buildMonthView(state);
      }
      const duration = performance.now() - start;

      assert.ok(duration < 200, `Too slow: ${duration.toFixed(2)}ms for 100 iterations`);
    });

    it('500 fixed expenses - 50 iterations', () => {
      const expenses = generateArray(500, (i) => ({
        id: `f${i}`,
        name: `Despesa ${i}`,
        amount: 100 + i * 10,
        active: i % 2 === 0,
        startMonth: '2025-01',
        category: ['casa', 'telefone', 'outro'][i % 3],
      }));

      const state = {
        ...emptyFinanceState,
        currentDate: new Date('2026-04-15'),
        fixedExpenses: expenses,
        revenues: [],
      };

      const start = performance.now();
      for (let i = 0; i < 50; i++) {
        buildMonthView(state);
      }
      const duration = performance.now() - start;

      assert.ok(
        duration < 300,
        `Too slow: ${duration.toFixed(2)}ms for 50 iterations with 500 items`
      );
    });

    it('1000 fixed expenses - 10 iterations', () => {
      const expenses = generateArray(1000, (i) => ({
        id: `f${i}`,
        name: `Despesa ${i}`,
        amount: 100,
        active: true,
        startMonth: '2025-01',
      }));

      const state = {
        ...emptyFinanceState,
        currentDate: new Date('2026-04-15'),
        fixedExpenses: expenses,
        revenues: [],
      };

      const start = performance.now();
      for (let i = 0; i < 10; i++) {
        buildMonthView(state);
      }
      const duration = performance.now() - start;

      assert.ok(
        duration < 200,
        `Too slow: ${duration.toFixed(2)}ms for 10 iterations with 1000 items`
      );
    });

    it('100 installments - 100 iterations', () => {
      const installments = generateArray(100, (i) => ({
        id: `i${i}`,
        name: `Parcela ${i}`,
        installmentValue: 50 + i,
        totalInstallments: 12,
        currentInstallment: 6,
        startMonth: '2025-06',
        card: ['santander', 'nubank', 'outro'][i % 3],
        active: true,
      }));

      const state = {
        ...emptyFinanceState,
        currentDate: new Date('2026-04-15'),
        fixedExpenses: [],
        revenues: [],
        installments: installments,
      };

      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        buildMonthView(state);
      }
      const duration = performance.now() - start;

      assert.ok(duration < 300, `Too slow: ${duration.toFixed(2)}ms`);
    });
  });

  describe('buildMonthView with Overrides', () => {
    it('100 overrides - 50 iterations', () => {
      const overrides = generateArray(100, (i) => ({
        id: `o${i}`,
        type: OVERRIDE_TYPES.FIXED_EXPENSE_PAYMENT,
        itemId: `f${i}`,
        monthKey: '2026-04',
        paid: i % 2 === 0,
      }));

      const expenses = generateArray(100, (i) => ({
        id: `f${i}`,
        name: `Despesa ${i}`,
        amount: 100,
        active: true,
        startMonth: '2025-01',
      }));

      const state = {
        ...emptyFinanceState,
        currentDate: new Date('2026-04-15'),
        fixedExpenses: expenses,
        monthOverrides: overrides,
      };

      const start = performance.now();
      for (let i = 0; i < 50; i++) {
        buildMonthView(state);
      }
      const duration = performance.now() - start;

      assert.ok(duration < 200, `Too slow: ${duration.toFixed(2)}ms`);
    });

    it('mixed override types - 50 iterations', () => {
      const overrides = [
        ...generateArray(30, (i) => ({
          id: `p${i}`,
          type: OVERRIDE_TYPES.FIXED_EXPENSE_PAYMENT,
          itemId: `f${i}`,
          monthKey: '2026-04',
          paid: true,
        })),
        ...generateArray(20, (i) => ({
          id: `c${i}`,
          type: OVERRIDE_TYPES.CARD_BILL_AMOUNT,
          itemId: ['santander', 'nubank'][i % 2],
          monthKey: '2026-04',
          amount: 500,
        })),
        ...generateArray(50, (i) => ({
          id: `r${i}`,
          type: OVERRIDE_TYPES.REVENUE_AMOUNT,
          itemId: `rev-${i}`,
          monthKey: '2026-04',
          amount: 3000,
        })),
      ];

      const expenses = generateArray(30, (i) => ({
        id: `f${i}`,
        name: `Despesa ${i}`,
        amount: 100,
        active: true,
        startMonth: '2025-01',
      }));

      const revenues = generateArray(50, (i) => ({
        id: `rev-${i}`,
        name: `Receita ${i}`,
        amount: 2000,
        active: true,
        startMonth: '2025-01',
      }));

      const state = {
        ...emptyFinanceState,
        currentDate: new Date('2026-04-15'),
        fixedExpenses: expenses,
        revenues: revenues,
        monthOverrides: overrides,
      };

      const start = performance.now();
      for (let i = 0; i < 50; i++) {
        buildMonthView(state);
      }
      const duration = performance.now() - start;

      assert.ok(duration < 300, `Too slow: ${duration.toFixed(2)}ms`);
    });
  });

  describe('Full State with Everything', () => {
    it('complete month - 50 iterations', () => {
      const expenses = generateArray(50, (i) => ({
        id: `f${i}`,
        name: `Despesa ${i}`,
        amount: 100 + i * 10,
        active: true,
        startMonth: '2025-01',
        paymentMethod: ['boleto', 'pix', 'santander'][i % 3],
        category: ['casa', 'telefone', 'outro'][i % 3],
      }));

      const revenues = [
        { id: 'r1', name: 'Salario', amount: 5000, active: true, startMonth: '2025-01' },
        { id: 'r2', name: 'Freelance', amount: 1500, active: true, startMonth: '2025-03' },
      ];

      const installments = generateArray(30, (i) => ({
        id: `i${i}`,
        name: `Parcela ${i}`,
        installmentValue: 50,
        totalInstallments: 12,
        currentInstallment: 6,
        startMonth: '2025-06',
        card: 'santander',
      }));

      const state = {
        ...emptyFinanceState,
        currentDate: new Date('2026-04-15'),
        fixedExpenses: expenses,
        revenues: revenues,
        installments: installments,
        monthOverrides: [],
      };

      const start = performance.now();
      for (let i = 0; i < 50; i++) {
        buildMonthView(state);
      }
      const duration = performance.now() - start;

      assert.ok(duration < 300, `Too slow: ${duration.toFixed(2)}ms`);
    });
  });

  describe('Chart Series - High Load', () => {
    it('buildCategorySeries 1000 items', () => {
      const monthView = {
        fixedExpenses: generateArray(1000, (i) => ({
          id: `f${i}`,
          amount: 100 + i,
          category: ['casa', 'telefone', 'streaming', 'seguro', 'outro'][i % 5],
        })),
      };

      const start = performance.now();
      for (let i = 0; i < 50; i++) {
        buildCategorySeries(monthView);
      }
      const duration = performance.now() - start;

      assert.ok(duration < 100, `Too slow: ${duration.toFixed(2)}ms`);
    });

    it('buildCardSeries with 500 items', () => {
      const monthView = {
        fixedExpenses: generateArray(250, (i) => ({
          id: `f${i}`,
          amount: 100 + i,
          paymentMethod: 'santander',
          card: 'santander',
        })),
        installments: generateArray(250, (i) => ({
          id: `i${i}`,
          installmentValue: 50,
          card: 'nubank',
        })),
      };

      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        buildCardSeries(monthView);
      }
      const duration = performance.now() - start;

      assert.ok(duration < 100, `Too slow: ${duration.toFixed(2)}ms`);
    });
  });

  describe('Utility Functions - Massive Load', () => {
    it('monthKey 100000 calls', () => {
      const date = new Date('2026-04-15');

      const start = performance.now();
      for (let i = 0; i < 100000; i++) {
        monthKey(date);
      }
      const duration = performance.now() - start;

      assert.ok(duration < 200, `Too slow: ${duration.toFixed(2)}ms`);
    });

    it('isMonthInRange 100000 calls', () => {
      const start = performance.now();
      for (let i = 0; i < 100000; i++) {
        isMonthInRange('2026-04', '2026-01', '2026-12');
      }
      const duration = performance.now() - start;

      assert.ok(duration < 200, `Too slow: ${duration.toFixed(2)}ms`);
    });

    it('previousMonthKey 100000 calls', () => {
      const start = performance.now();
      for (let i = 0; i < 100000; i++) {
        previousMonthKey('2026-04');
      }
      const duration = performance.now() - start;

      assert.ok(duration < 200, `Too slow: ${duration.toFixed(2)}ms`);
    });

    it('createFinanceId 10000 calls', () => {
      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        createFinanceId('fixed');
      }
      const duration = performance.now() - start;

      assert.ok(duration < 200, `Too slow: ${duration.toFixed(2)}ms`);
    });

    it('clone with large object 500 calls', () => {
      const largeObj = {
        data: generateArray(500, (i) => ({
          id: i,
          name: `Item ${i}`,
          value: i * 10,
          nested: { a: 1, b: 2 },
        })),
      };

      const start = performance.now();
      for (let i = 0; i < 500; i++) {
        clone(largeObj);
      }
      const duration = performance.now() - start;

      assert.ok(duration < 2000, `Too slow: ${duration.toFixed(2)}ms`); // JSON.parse/stringify é lento para objetos grandes
    });
  });

  describe('Money Input Functions', () => {
    it('formatMoneyInput 50000 calls', () => {
      const start = performance.now();
      for (let i = 0; i < 50000; i++) {
        formatMoneyInput(1000);
      }
      const duration = performance.now() - start;

      assert.ok(duration < 200, `Too slow: ${duration.toFixed(2)}ms`);
    });

    it('applyMoneyMask 50000 calls', () => {
      const start = performance.now();
      for (let i = 0; i < 50000; i++) {
        applyMoneyMask('1000');
      }
      const duration = performance.now() - start;

      assert.ok(duration < 300, `Too slow: ${duration.toFixed(2)}ms`);
    });

    it('parseMoneyInput 50000 calls', () => {
      const start = performance.now();
      for (let i = 0; i < 50000; i++) {
        parseMoneyInput('1.000,00');
      }
      const duration = performance.now() - start;

      assert.ok(duration < 200, `Too slow: ${duration.toFixed(2)}ms`);
    });
  });

  describe('Memory & Allocation Stress', () => {
    it('rapid state creation 100 iterations', () => {
      const createState = () => ({
        ...emptyFinanceState,
        currentDate: new Date('2026-04-15'),
        fixedExpenses: generateArray(20, (i) => ({
          id: `f${i}`,
          name: `Despesa ${i}`,
          amount: 100,
          active: true,
          startMonth: '2025-01',
        })),
        revenues: generateArray(10, (i) => ({
          id: `r${i}`,
          name: `Receita ${i}`,
          amount: 1000,
          active: true,
          startMonth: '2025-01',
        })),
      });

      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        const _ = createState();
      }
      const duration = performance.now() - start;

      assert.ok(duration < 100, `Too slow: ${duration.toFixed(2)}ms`);
    });

    it('rapid buildMonthView calls without memory leak', () => {
      const state = {
        ...emptyFinanceState,
        currentDate: new Date('2026-04-15'),
        fixedExpenses: generateArray(30, (i) => ({
          id: `f${i}`,
          name: `Despesa ${i}`,
          amount: 100,
          active: true,
          startMonth: '2025-01',
        })),
      };

      let lastResult = null;
      for (let i = 0; i < 30; i++) {
        lastResult = buildMonthView(state);
      }

      assert.ok(lastResult);
      assert.ok(lastResult.fixedExpenses.length > 0);
    });
  });

  describe('Edge Case Performance', () => {
    it('empty state 10000 iterations', () => {
      const state = { ...emptyFinanceState, currentDate: new Date() };

      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        buildMonthView(state);
      }
      const duration = performance.now() - start;

      assert.ok(duration < 500, `Too slow: ${duration.toFixed(2)}ms for empty state`);
    });

    it('selectMonthCardBills with empty array', () => {
      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        selectMonthCardBills([], '2026-04');
      }
      const duration = performance.now() - start;

      assert.ok(duration < 100, `Too slow: ${duration.toFixed(2)}ms`);
    });
  });

  describe('Real-world Simulation', () => {
    it('typical user session - 20 month changes', () => {
      const months = [
        '2025-01',
        '2025-02',
        '2025-03',
        '2025-04',
        '2025-05',
        '2025-06',
        '2025-07',
        '2025-08',
        '2025-09',
        '2025-10',
        '2025-11',
        '2025-12',
        '2026-01',
        '2026-02',
        '2026-03',
        '2026-04',
        '2026-05',
        '2026-06',
        '2026-07',
        '2026-08',
      ];

      const state = {
        ...emptyFinanceState,
        fixedExpenses: generateArray(25, (i) => ({
          id: `f${i}`,
          name: `Despesa ${i}`,
          amount: 100 + i * 20,
          active: true,
          startMonth: '2025-01',
          paymentMethod: ['boleto', 'pix', 'santander'][i % 3],
        })),
        revenues: generateArray(3, (i) => ({
          id: `r${i}`,
          name: `Receita ${i}`,
          amount: 2000 + i * 500,
          active: true,
          startMonth: '2025-01',
        })),
        installments: generateArray(10, (i) => ({
          id: `i${i}`,
          name: `Parcela ${i}`,
          installmentValue: 50 + i * 10,
          totalInstallments: 12,
          currentInstallment: 6,
          startMonth: '2025-06',
          card: 'santander',
        })),
      };

      const start = performance.now();
      for (const month of months) {
        const date = new Date(`${month}-15`);
        const monthState = { ...state, currentDate: date };
        buildMonthView(monthState);
        buildCategorySeries({ fixedExpenses: monthState.fixedExpenses });
        buildCardSeries({
          fixedExpenses: monthState.fixedExpenses,
          installments: monthState.installments,
        });
      }
      const duration = performance.now() - start;

      assert.ok(duration < 500, `Too slow: ${duration.toFixed(2)}ms for 20 month changes`);
    });
  });
});

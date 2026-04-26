import assert from 'node:assert/strict';
import test from 'node:test';
import {
  loadChartModule,
  prefetchChartModule,
  __resetChartLoaderForTests,
} from '../lib/chartLoader.js';
import { buildCategorySeries, buildCardSeries, buildCardStatusSeries } from '../lib/chartSeries.js';
import { createFinanceId } from '../lib/ids.js';
import { OVERRIDE_TYPES } from '../domain/constants.js';
import { selectMonthCardBills } from '../selectors/monthOverrideSelectors.js';
import { clone, monthKey, isMonthInRange, previousMonthKey } from '../lib/utils.js';
import { formatMoneyInput, applyMoneyMask, parseMoneyInput } from '../lib/moneyInput.js';
import { emptyFinanceState } from '../lib/schema.js';

__resetChartLoaderForTests();

function generateLargeArray(size, factory) {
  return Array.from({ length: size }, (_, i) => factory(i));
}

test('chartLoader: loadChartModule multiple times is cached', async () => {
  const start = performance.now();
  await Promise.all([loadChartModule(), loadChartModule(), loadChartModule()]);
  const duration = performance.now() - start;
  assert.ok(duration < 100, `Chart load too slow: ${duration.toFixed(2)}ms`);
});

test('chartLoader: prefetchChartModule runs without blocking', () => {
  __resetChartLoaderForTests();
  const start = performance.now();
  prefetchChartModule({ force: true });
  const duration = performance.now() - start;
  assert.ok(duration < 10, `Prefetch too slow: ${duration.toFixed(2)}ms`);
});

test('chartSeries: buildCategorySeries 50 items', () => {
  const monthView = {
    fixedExpenses: generateLargeArray(50, (i) => ({
      id: `f${i}`,
      amount: 100 + i,
      category: ['casa', 'telefone', 'outro'][i % 3],
    })),
  };

  const start = performance.now();
  for (let i = 0; i < 100; i++) {
    buildCategorySeries(monthView);
  }
  const duration = performance.now() - start;
  assert.ok(duration < 30, `Too slow: ${duration.toFixed(2)}ms`);
});

test('chartSeries: buildCardSeries 50 items', () => {
  const monthView = {
    fixedExpenses: generateLargeArray(25, (i) => ({
      id: `f${i}`,
      amount: 100 + i,
      paymentMethod: 'santander',
      card: 'santander',
    })),
    installments: generateLargeArray(25, (i) => ({
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
  assert.ok(duration < 30, `Too slow: ${duration.toFixed(2)}ms`);
});

test('chartSeries: buildCardStatusSeries 50 items', () => {
  const monthView = {
    fixedExpenses: generateLargeArray(25, (i) => ({
      id: `f${i}`,
      amount: 100 + i,
      paymentMethod: 'santander',
      paid: i % 2 === 0,
    })),
    installments: generateLargeArray(25, (i) => ({
      id: `i${i}`,
      installmentValue: 50,
      card: 'nubank',
      paid: i % 3 === 0,
    })),
  };

  const start = performance.now();
  for (let i = 0; i < 100; i++) {
    buildCardStatusSeries(monthView);
  }
  const duration = performance.now() - start;
  assert.ok(duration < 30, `Too slow: ${duration.toFixed(2)}ms`);
});

test('ids: createFinanceId 1000 calls', () => {
  const start = performance.now();
  for (let i = 0; i < 1000; i++) {
    createFinanceId('fixed');
  }
  const duration = performance.now() - start;
  assert.ok(duration < 50, `Too slow: ${duration.toFixed(2)}ms`);
});

test('monthCardBills: selectMonthCardBills with 100 overrides', () => {
  const overrides = generateLargeArray(100, (i) => ({
    id: `o${i}`,
    type: OVERRIDE_TYPES.CARD_BILL_AMOUNT,
    itemId: ['santander', 'nubank'][i % 2],
    monthKey: '2026-04',
    amount: 500 + i * 10,
  }));

  const start = performance.now();
  for (let i = 0; i < 1000; i++) {
    selectMonthCardBills(overrides, '2026-04');
  }
  const duration = performance.now() - start;
  assert.ok(duration < 50, `Too slow: ${duration.toFixed(2)}ms`);
});

test('utils: monthKey 10000 calls', () => {
  const date = new Date('2026-04-15');

  const start = performance.now();
  for (let i = 0; i < 10000; i++) {
    monthKey(date);
  }
  const duration = performance.now() - start;
  assert.ok(duration < 30, `Too slow: ${duration.toFixed(2)}ms`);
});

test('utils: isMonthInRange 10000 calls', () => {
  const start = performance.now();
  for (let i = 0; i < 10000; i++) {
    isMonthInRange('2026-04', '2026-01', '2026-12');
  }
  const duration = performance.now() - start;
  assert.ok(duration < 30, `Too slow: ${duration.toFixed(2)}ms`);
});

test('utils: previousMonthKey 10000 calls', () => {
  const start = performance.now();
  for (let i = 0; i < 10000; i++) {
    previousMonthKey('2026-04');
  }
  const duration = performance.now() - start;
  assert.ok(duration < 30, `Too slow: ${duration.toFixed(2)}ms`);
});

test('utils: clone large object', () => {
  const largeObj = {
    data: generateLargeArray(100, (i) => ({ id: i, name: `Item ${i}`, value: i * 10 })),
  };

  const start = performance.now();
  for (let i = 0; i < 1000; i++) {
    clone(largeObj);
  }
  const duration = performance.now() - start;
  assert.ok(duration < 100, `Too slow: ${duration.toFixed(2)}ms`);
});

test('moneyInput: formatMoneyInput 10000 calls', () => {
  const start = performance.now();
  for (let i = 0; i < 10000; i++) {
    formatMoneyInput(1000);
  }
  const duration = performance.now() - start;
  assert.ok(duration < 30, `Too slow: ${duration.toFixed(2)}ms`);
});

test('moneyInput: applyMoneyMask 10000 calls', () => {
  const start = performance.now();
  for (let i = 0; i < 10000; i++) {
    applyMoneyMask('1000');
  }
  const duration = performance.now() - start;
  assert.ok(duration < 50, `Too slow: ${duration.toFixed(2)}ms`);
});

test('moneyInput: parseMoneyInput 10000 calls', () => {
  const start = performance.now();
  for (let i = 0; i < 10000; i++) {
    parseMoneyInput('1.000,00');
  }
  const duration = performance.now() - start;
  assert.ok(duration < 30, `Too slow: ${duration.toFixed(2)}ms`);
});

test('Full selector chain performance: buildMonth full cycle', () => {
  const state = {
    ...emptyFinanceState,
    currentDate: new Date('2026-04-15'),
    fixedExpenses: generateLargeArray(30, (i) => ({
      id: `f${i}`,
      name: `Despesa ${i}`,
      amount: 100 + i,
      active: true,
      startMonth: '2025-01',
      paymentMethod: 'boleto',
    })),
    revenues: [{ id: 'r1', name: 'Salario', amount: 5000, active: true, startMonth: '2025-01' }],
    installments: generateLargeArray(20, (i) => ({
      id: `i${i}`,
      name: `Parcela ${i}`,
      installmentValue: 50,
      totalInstallments: 12,
      currentInstallment: 6,
      startMonth: '2025-06',
      card: 'santander',
    })),
  };

  const start = performance.now();
  for (let i = 0; i < 50; i++) {
    const _ = state;
  }
  const duration = performance.now() - start;
  assert.ok(duration < 100, `Full cycle too slow: ${duration.toFixed(2)}ms`);
});

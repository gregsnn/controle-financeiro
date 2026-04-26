import assert from 'node:assert/strict';
import test from 'node:test';
import { buildMonthView } from '../selectors/buildMonth.js';
import { OVERRIDE_TYPES } from '../domain/constants.js';
import { emptyFinanceState } from '../lib/schema.js';

function generateFixedExpenses(count) {
  const items = [];
  for (let i = 0; i < count; i++) {
    items.push({
      id: `f${i}`,
      name: `Despesa ${i}`,
      amount: 100 + i * 10,
      active: true,
      startMonth: '2025-01',
      paymentMethod: 'boleto',
    });
  }
  return items;
}

function generateInstallments(count) {
  const items = [];
  for (let i = 0; i < count; i++) {
    items.push({
      id: `i${i}`,
      name: `Parcela ${i}`,
      installmentValue: 50,
      totalInstallments: 12,
      currentInstallment: 6,
      startMonth: '2025-06',
      card: 'santander',
    });
  }
  return items;
}

test('buildMonthView performance: 10 fixed expenses', () => {
  const state = {
    ...emptyFinanceState,
    currentDate: new Date('2026-04-15'),
    fixedExpenses: generateFixedExpenses(10),
    revenues: [{ id: 'r1', name: 'Salario', amount: 5000, active: true, startMonth: '2025-01' }],
  };

  const start = performance.now();
  for (let i = 0; i < 100; i++) {
    buildMonthView(state);
  }
  const duration = performance.now() - start;

  assert.ok(duration < 100, `Too slow: ${duration.toFixed(2)}ms for 100 iterations`);
});

test('buildMonthView performance: 100 fixed expenses', () => {
  const state = {
    ...emptyFinanceState,
    currentDate: new Date('2026-04-15'),
    fixedExpenses: generateFixedExpenses(100),
    revenues: [{ id: 'r1', name: 'Salario', amount: 5000, active: true, startMonth: '2025-01' }],
  };

  const start = performance.now();
  for (let i = 0; i < 100; i++) {
    buildMonthView(state);
  }
  const duration = performance.now() - start;

  assert.ok(duration < 200, `Too slow: ${duration.toFixed(2)}ms for 100 iterations`);
});

test('buildMonthView performance: 50 installments', () => {
  const state = {
    ...emptyFinanceState,
    currentDate: new Date('2026-04-15'),
    fixedExpenses: [],
    revenues: [{ id: 'r1', name: 'Salario', amount: 5000, active: true, startMonth: '2025-01' }],
    installments: generateInstallments(50),
  };

  const start = performance.now();
  for (let i = 0; i < 100; i++) {
    buildMonthView(state);
  }
  const duration = performance.now() - start;

  assert.ok(duration < 150, `Too slow: ${duration.toFixed(2)}ms for 100 iterations`);
});

test('buildMonthView with overrides performance', () => {
  const overrides = [];
  for (let i = 0; i < 20; i++) {
    overrides.push({
      id: `o${i}`,
      type: OVERRIDE_TYPES.FIXED_EXPENSE_PAYMENT,
      itemId: `f${i}`,
      monthKey: '2026-04',
      paid: i % 2 === 0,
    });
  }

  const state = {
    ...emptyFinanceState,
    currentDate: new Date('2026-04-15'),
    fixedExpenses: generateFixedExpenses(20),
    revenues: [{ id: 'r1', name: 'Salario', amount: 5000, active: true, startMonth: '2025-01' }],
    monthOverrides: overrides,
  };

  const start = performance.now();
  for (let i = 0; i < 100; i++) {
    buildMonthView(state);
  }
  const duration = performance.now() - start;

  assert.ok(duration < 100, `Too slow: ${duration.toFixed(2)}ms for 100 iterations`);
});

import { describe, expect, it } from 'vitest';
import { OVERRIDE_TYPES } from '../domain/constants';
import type { FixedExpense, Installment, MonthOverride, Revenue } from '../domain/types';
import { emptyFinanceState } from '../lib/schema';
import { buildMonthView } from '../selectors/buildMonth';

function generateFixedExpenses(count: number): FixedExpense[] {
  const items: FixedExpense[] = [];
  for (let i = 0; i < count; i++) {
    items.push({
      id: `f${i}`,
      name: `Despesa ${i}`,
      amount: 100 + i * 10,
      dueDay: 5,
      category: 'outro',
      paymentMethod: 'boleto',
      active: true,
      startMonth: '2025-01',
      endMonth: null,
      notes: '',
    });
  }
  return items;
}

function generateInstallments(count: number): Installment[] {
  const items: Installment[] = [];
  for (let i = 0; i < count; i++) {
    items.push({
      id: `i${i}`,
      name: `Parcela ${i}`,
      installmentValue: 50,
      totalInstallments: 12,
      currentInstallment: 6,
      startMonth: '2025-06',
      card: 'santander',
      category: 'outro',
      active: true,
      closedAt: null,
    });
  }
  return items;
}

function generateRevenues(count: number): Revenue[] {
  const items: Revenue[] = [];
  for (let i = 0; i < count; i++) {
    items.push({
      id: `r${i}`,
      name: `Receita ${i}`,
      baseAmount: 5000,
      active: true,
      startMonth: '2025-01',
      endMonth: null,
      category: 'outro',
      notes: '',
    });
  }
  return items;
}

function generateOverrides(count: number): MonthOverride[] {
  const overrides: MonthOverride[] = [];
  for (let i = 0; i < count; i++) {
    overrides.push({
      id: `o${i}`,
      type: OVERRIDE_TYPES.FIXED_EXPENSE_PAYMENT,
      itemId: `f${i}`,
      monthKey: '2026-04',
      paid: i % 2 === 0,
    });
  }
  return overrides;
}

describe('performance.ts - buildMonthView', () => {
  it('handles 10 fixed expenses', () => {
    const state = {
      ...emptyFinanceState(),
      currentDate: new Date('2026-04-15'),
      fixedExpenses: generateFixedExpenses(10),
      revenues: generateRevenues(1),
      installments: [],
      monthOverrides: [],
    };

    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      buildMonthView(state);
    }
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(100);
  });

  it('handles 100 fixed expenses', () => {
    const state = {
      ...emptyFinanceState(),
      currentDate: new Date('2026-04-15'),
      fixedExpenses: generateFixedExpenses(100),
      revenues: generateRevenues(1),
      installments: [],
      monthOverrides: [],
    };

    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      buildMonthView(state);
    }
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(200);
  });

  it('handles 50 installments', () => {
    const state = {
      ...emptyFinanceState(),
      currentDate: new Date('2026-04-15'),
      fixedExpenses: [],
      revenues: generateRevenues(1),
      installments: generateInstallments(50),
      monthOverrides: [],
    };

    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      buildMonthView(state);
    }
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(150);
  });

  it('handles 20 month overrides', () => {
    const overrides = generateOverrides(20);
    const state = {
      ...emptyFinanceState(),
      currentDate: new Date('2026-04-15'),
      fixedExpenses: generateFixedExpenses(20),
      revenues: generateRevenues(1),
      installments: [],
      monthOverrides: overrides,
    };

    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      buildMonthView(state);
    }
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(150);
  });

  it('handles large dataset (100 expenses + 50 installments + 10 revenues)', () => {
    const state = {
      ...emptyFinanceState(),
      currentDate: new Date('2026-04-15'),
      fixedExpenses: generateFixedExpenses(100),
      revenues: generateRevenues(10),
      installments: generateInstallments(50),
      monthOverrides: generateOverrides(20),
    };

    const start = performance.now();
    for (let i = 0; i < 50; i++) {
      buildMonthView(state);
    }
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(300);
  });

  it('handles empty state', () => {
    const state = emptyFinanceState();

    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      buildMonthView(state);
    }
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(100);
  });

  it('handles inactive items', () => {
    const fixedExpenses = generateFixedExpenses(50).map((item, i) => ({
      ...item,
      active: i % 2 === 0,
    }));
    const state = {
      ...emptyFinanceState(),
      currentDate: new Date('2026-04-15'),
      fixedExpenses,
      revenues: generateRevenues(1),
      installments: [],
      monthOverrides: [],
    };

    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      buildMonthView(state);
    }
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(150);
  });
});

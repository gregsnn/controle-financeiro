import assert from 'node:assert/strict';
import test from 'node:test';
import { buildMonthView } from '../selectors/buildMonth.js';
import { OVERRIDE_TYPES } from '../domain/constants.js';
import { emptyFinanceState } from '../lib/schema.js';

test('buildMonthView calculates totals correctly', () => {
  const state = {
    ...emptyFinanceState,
    currentDate: new Date('2026-04-15'),
    fixedExpenses: [
      {
        id: 'f1',
        name: 'Luz',
        amount: 200,
        active: true,
        startMonth: '2026-01',
        paymentMethod: 'boleto',
      },
    ],
    revenues: [{ id: 'r1', name: 'Salario', amount: 5000, active: true, startMonth: '2026-01' }],
  };

  const view = buildMonthView(state);

  assert.equal(view.totals.receitas, 5000);
  assert.equal(view.totals.fixedExpenses, 200);
  assert.equal(view.totals.despesas, 200);
  assert.equal(view.totals.saldo, 4800);
});

test('buildMonthView filters inactive items', () => {
  const state = {
    ...emptyFinanceState,
    currentDate: new Date('2026-04-15'),
    fixedExpenses: [
      { id: 'f1', name: 'Ativo', amount: 100, active: true, startMonth: '2026-01' },
      { id: 'f2', name: 'Inativo', amount: 200, active: false, startMonth: '2026-01' },
    ],
  };

  const view = buildMonthView(state);

  assert.equal(view.fixedExpenses.length, 1);
  assert.equal(view.fixedExpenses[0].name, 'Ativo');
});

test('buildMonthView applies overrides to amounts', () => {
  const state = {
    ...emptyFinanceState,
    currentDate: new Date('2026-04-15'),
    fixedExpenses: [{ id: 'f1', name: 'Luz', amount: 200, active: true, startMonth: '2026-01' }],
    monthOverrides: [
      {
        id: 'o1',
        type: OVERRIDE_TYPES.FIXED_EXPENSE,
        itemId: 'f1',
        monthKey: '2026-04',
        amount: 250,
      },
    ],
  };

  const view = buildMonthView(state);

  assert.equal(view.fixedExpenses[0].amount, 250);
});

test('buildMonthView calculates installment progress', () => {
  const state = {
    ...emptyFinanceState,
    currentDate: new Date('2026-04-15'),
    installments: [
      {
        id: 'i1',
        name: 'TV',
        installmentValue: 100,
        totalInstallments: 12,
        currentInstallment: 1,
        startMonth: '2025-06',
      },
    ],
  };

  const view = buildMonthView(state);

  assert.equal(view.installments[0].currentInstallment, 11);
  assert.equal(view.totals.installments, 100);
});

test('buildMonthView marks paid items', () => {
  const state = {
    ...emptyFinanceState,
    currentDate: new Date('2026-04-15'),
    fixedExpenses: [{ id: 'f1', name: 'Luz', amount: 200, active: true, startMonth: '2026-01' }],
    monthOverrides: [
      {
        id: 'o1',
        type: OVERRIDE_TYPES.FIXED_EXPENSE_PAYMENT,
        itemId: 'f1',
        monthKey: '2026-04',
        paid: true,
      },
    ],
  };

  const view = buildMonthView(state);

  assert.equal(view.fixedExpenses[0].paid, true);
});

test('buildMonthView has summary with formatted values', () => {
  const state = {
    ...emptyFinanceState,
    currentDate: new Date('2026-04-15'),
    fixedExpenses: [{ id: 'f1', name: 'Luz', amount: 200, active: true, startMonth: '2026-01' }],
    revenues: [{ id: 'r1', name: 'Salario', amount: 5000, active: true, startMonth: '2026-01' }],
  };

  const view = buildMonthView(state);

  assert.ok(view.summary.receitasLabel.includes('5.000'));
  assert.ok(view.summary.despesasLabel.includes('200'));
  assert.ok(view.summary.saldoLabel.includes('4.800'));
});

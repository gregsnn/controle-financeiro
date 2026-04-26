import assert from 'node:assert/strict';
import test from 'node:test';
import { buildMonthView } from '../selectors/buildMonth.js';
import { emptyFinanceState } from '../lib/schema.js';
import { OVERRIDE_TYPES } from '../domain/constants.js';
import { monthKey } from '../lib/utils.js';

function createState(overrides = {}) {
  return {
    ...emptyFinanceState,
    currentDate: new Date('2026-04-15'),
    ...overrides,
  };
}

test('buildMonthView: mês vazio retorna valores zerados', () => {
  const state = createState();
  const view = buildMonthView(state);

  assert.equal(view.fixedExpenses.length, 0);
  assert.equal(view.installments.length, 0);
  assert.equal(view.revenues.length, 0);
  assert.equal(view.totals.despesas, 0);
  assert.equal(view.totals.receitas, 0);
});

test('buildMonthView: calcula total de despesas fixas', () => {
  const state = createState({
    fixedExpenses: [
      {
        id: 'e1',
        name: 'Internet',
        amount: 120,
        active: 1,
        startMonth: '2026-01',
        endMonth: null,
        paymentMethod: 'boleto',
      },
      {
        id: 'e2',
        name: 'Luz',
        amount: 150,
        active: 1,
        startMonth: '2026-01',
        endMonth: null,
        paymentMethod: 'boleto',
      },
    ],
  });

  const view = buildMonthView(state);

  assert.equal(view.totals.fixedExpenses, 270);
});

test('buildMonthView: calcula total de receitas', () => {
  const state = createState({
    revenues: [
      { id: 'r1', name: 'Salário', amount: 5000, active: 1, startMonth: '2026-01', endMonth: null },
      {
        id: 'r2',
        name: 'Freelance',
        amount: 1000,
        active: 1,
        startMonth: '2026-01',
        endMonth: null,
      },
    ],
  });

  const view = buildMonthView(state);

  assert.equal(view.totals.receitas, 6000);
});

test('buildMonthView: despesas inativas não contam', () => {
  const state = createState({
    fixedExpenses: [
      {
        id: 'e1',
        name: 'Internet',
        amount: 120,
        active: false,
        startMonth: '2026-01',
        endMonth: null,
      },
      { id: 'e2', name: 'Luz', amount: 150, active: true, startMonth: '2026-01', endMonth: null },
    ],
  });

  const view = buildMonthView(state);

  assert.equal(view.totals.fixedExpenses, 150);
});

test('buildMonthView: considera startMonth e endMonth', () => {
  const state = createState({
    fixedExpenses: [
      { id: 'e1', name: 'Atual', amount: 100, active: 1, startMonth: '2026-01', endMonth: null },
      { id: 'e2', name: 'Futuro', amount: 200, active: 1, startMonth: '2026-05', endMonth: null },
      {
        id: 'e3',
        name: 'Passado',
        amount: 300,
        active: 1,
        startMonth: '2025-01',
        endMonth: '2025-12',
      },
    ],
  });

  const view = buildMonthView(state);

  assert.equal(view.totals.fixedExpenses, 100);
});

test('buildMonthView: calcula parcelas', () => {
  const state = createState({
    installments: [
      {
        id: 'i1',
        name: 'TV',
        totalInstallments: 12,
        currentInstallment: 5,
        installmentValue: 150,
        active: 1,
        startMonth: '2026-01',
        closedAt: null,
        card: 'nubank',
      },
    ],
  });

  const view = buildMonthView(state);

  assert.equal(view.totals.installments, 150);
  assert.equal(view.installments.length, 1);
});

test('buildMonthView: overrides de pagamento', () => {
  const state = createState({
    fixedExpenses: [
      {
        id: 'e1',
        name: 'Internet',
        amount: 120,
        active: true,
        startMonth: '2026-01',
        endMonth: null,
        paymentMethod: 'boleto',
      },
    ],
    monthOverrides: [
      {
        id: 'o1',
        type: OVERRIDE_TYPES.FIXED_EXPENSE_PAYMENT,
        itemId: 'e1',
        monthKey: '2026-04',
        paid: true,
      },
    ],
  });

  const view = buildMonthView(state);

  const internet = view.fixedExpenses.find((e) => e.id === 'e1');
  assert.equal(internet.paid, true);
});

test('buildMonthView: Override de fatura do cartão', () => {
  const state = createState({
    fixedExpenses: [
      {
        id: 'e1',
        name: 'Cartão',
        amount: 500,
        active: 1,
        startMonth: '2026-01',
        endMonth: null,
        paymentMethod: 'nubank',
      },
    ],
    monthOverrides: [
      { id: 'o1', type: 'CARD_BILL_AMOUNT', itemId: 'nubank', monthKey: '2026-04', amount: 800 },
    ],
  });

  const view = buildMonthView(state);

  assert.equal(view.totals.fixedExpenses, 500);
});

test('buildMonthView: considera paymentMethod nos totais', () => {
  const state = createState({
    fixedExpenses: [
      {
        id: 'e1',
        name: 'Amazon',
        amount: 200,
        paymentMethod: 'nubank',
        active: 1,
        startMonth: '2026-01',
        endMonth: null,
      },
      {
        id: 'e2',
        name: 'Spotify',
        amount: 30,
        paymentMethod: 'santander',
        active: 1,
        startMonth: '2026-01',
        endMonth: null,
      },
    ],
    installments: [
      {
        id: 'i1',
        name: 'TV',
        installmentValue: 150,
        card: 'nubank',
        active: 1,
        startMonth: '2026-01',
        closedAt: null,
        totalInstallments: 12,
        currentInstallment: 1,
      },
    ],
  });

  const view = buildMonthView(state);

  assert.equal(view.totals.fixedExpenses, 230);
  assert.equal(view.totals.installments, 150);
});

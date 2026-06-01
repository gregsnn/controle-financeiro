import { describe, expect, it } from 'vitest';
import { createDefaultVariableExpense } from '../domain/factories';
import { normalizeVariableExpense } from '../domain/normalizers';
import {
  addVariableExpense,
  removeVariableExpense,
  updateVariableExpense,
} from '../domain/stateReducers';
import { emptyFinanceState } from '../lib/schema';

describe('variable expense domain', () => {
  it('creates a default variable expense with low-friction defaults', () => {
    const item = createDefaultVariableExpense({ name: 'Mercado', amount: 120 });

    expect(item.id).toMatch(/^var_/);
    expect(item.name).toBe('Mercado');
    expect(item.amount).toBe(120);
    expect(item.category).toBe('outro');
    expect(item.paymentMethod).toBe('pix');
    expect(item.card).toBeNull();
    expect(item.paid).toBe(true);
  });

  it('normalizes card variable expenses as pending by default', () => {
    const item = normalizeVariableExpense({
      name: 'Farmacia',
      amount: 80,
      date: '2026-05-10',
      paymentMethod: 'cartao',
      card: '',
    });

    expect(item.monthKey).toBe('2026-05');
    expect(item.paymentMethod).toBe('cartao');
    expect(item.card).toBe('outro');
    expect(item.paid).toBe(false);
  });

  it('normalizes unknown payment methods to pix without card', () => {
    const item = normalizeVariableExpense({
      name: 'Cafe',
      amount: 12,
      date: '2026-05-11',
      paymentMethod: 'cheque',
      card: 'itau',
    });

    expect(item.paymentMethod).toBe('pix');
    expect(item.card).toBeNull();
  });

  it('adds, updates and removes variable expenses through reducers', () => {
    const state = emptyFinanceState();
    const withExpense = addVariableExpense(state, {
      id: 'var-1',
      name: 'Mercado',
      amount: 120,
      date: '2026-05-10',
      monthKey: '2026-05',
    });

    expect(withExpense.variableExpenses).toHaveLength(1);
    expect(withExpense.variableExpenses[0]).toMatchObject({
      id: 'var-1',
      name: 'Mercado',
      amount: 120,
    });

    const updated = updateVariableExpense(withExpense, 'var-1', { amount: 150, paid: false });
    expect(updated.variableExpenses[0]).toMatchObject({ amount: 150, paid: false });

    const removed = removeVariableExpense(updated, 'var-1');
    expect(removed.variableExpenses).toHaveLength(0);
  });
});

import { describe, it } from 'node:test';
import assert from 'node:assert';

const { OVERRIDE_TYPES } = await import('../domain/constants.js');
const { monthKey, previousMonthKey, isMonthInRange } = await import('../lib/utils.js');

describe('overrideTypes.js', () => {
  it('deve ter todos os tipos de override necessarios', () => {
    assert.ok(OVERRIDE_TYPES.FIXED_EXPENSE);
    assert.ok(OVERRIDE_TYPES.FIXED_EXPENSE_PAYMENT);
    assert.ok(OVERRIDE_TYPES.REVENUE);
    assert.ok(OVERRIDE_TYPES.REVENUE_AMOUNT);
    assert.ok(OVERRIDE_TYPES.INSTALLMENT_PAYMENT);
    assert.ok(OVERRIDE_TYPES.CARD_BILL_AMOUNT);
    assert.ok(OVERRIDE_TYPES.CARD_BILL_PAYMENT);
  });

  it('todos os valores devem ser strings unicas', () => {
    const values = Object.values(OVERRIDE_TYPES);
    const unique = new Set(values);
    assert.strictEqual(unique.size, values.length);
  });
});

describe('utils.js - monthKey', () => {
  it('deve gerar chave no formato YYYY-MM', () => {
    assert.strictEqual(monthKey(new Date('2024-03-15')), '2024-03');
    assert.strictEqual(monthKey(new Date('2024-01-01')), '2024-01');
    assert.strictEqual(monthKey(new Date('2024-12-31')), '2024-12');
  });

  it('deve gerar chave para data atual', () => {
    const key = monthKey();
    const now = new Date();
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    assert.strictEqual(key, expected);
  });
});

describe('utils.js - previousMonthKey', () => {
  it('deve retornar mes anterior', () => {
    assert.strictEqual(previousMonthKey('2024-03'), '2024-02');
    assert.strictEqual(previousMonthKey('2024-01'), '2023-12');
    assert.strictEqual(previousMonthKey('2025-01'), '2024-12');
  });
});

describe('utils.js - isMonthInRange', () => {
  it('deve verificar se mes esta no intervalo', () => {
    assert.strictEqual(isMonthInRange('2024-03', '2024-01', '2024-12'), true);
    assert.strictEqual(isMonthInRange('2024-01', '2024-01', '2024-12'), true);
    assert.strictEqual(isMonthInRange('2024-12', '2024-01', '2024-12'), true);
    assert.strictEqual(isMonthInRange('2023-12', '2024-01', '2024-12'), false);
    assert.strictEqual(isMonthInRange('2025-01', '2024-01', '2024-12'), false);
  });

  it('deve retornar true quando só tem startMonth', () => {
    assert.strictEqual(isMonthInRange('2024-05', '2024-01', null), true);
    assert.strictEqual(isMonthInRange('2023-05', '2024-01', null), false);
  });
});

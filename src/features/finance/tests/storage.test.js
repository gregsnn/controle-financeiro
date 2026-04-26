import { describe, it } from 'node:test';
import assert from 'node:assert';

const { emptyFinanceState, financeSchemaVersion } = await import('../lib/schema.js');
const { monthKey } = await import('../lib/utils.js');

describe('schema.js', () => {
  describe('financeSchemaVersion', () => {
    it('deve ter versao positiva', () => {
      assert.ok(financeSchemaVersion > 0);
    });

    it('deve ser maior ou igual a 1', () => {
      assert.ok(financeSchemaVersion >= 1);
    });
  });

  describe('emptyFinanceState', () => {
    it('deve ter currentDate como Date', () => {
      assert.ok(emptyFinanceState.currentDate instanceof Date);
    });

    it('deve ter array fixedExpenses', () => {
      assert.ok(Array.isArray(emptyFinanceState.fixedExpenses));
      assert.deepStrictEqual(emptyFinanceState.fixedExpenses, []);
    });

    it('deve ter array installments', () => {
      assert.ok(Array.isArray(emptyFinanceState.installments));
      assert.deepStrictEqual(emptyFinanceState.installments, []);
    });

    it('deve ter array revenues', () => {
      assert.ok(Array.isArray(emptyFinanceState.revenues));
      assert.deepStrictEqual(emptyFinanceState.revenues, []);
    });

    it('deve ter array monthOverrides', () => {
      assert.ok(Array.isArray(emptyFinanceState.monthOverrides));
      assert.deepStrictEqual(emptyFinanceState.monthOverrides, []);
    });

    it('deve ter settings com theme', () => {
      assert.ok(emptyFinanceState.settings);
      assert.strictEqual(emptyFinanceState.settings.theme, 'default');
    });

    it('deve ter meta com schemaVersion', () => {
      assert.ok(emptyFinanceState.meta);
      assert.strictEqual(emptyFinanceState.meta.schemaVersion, financeSchemaVersion);
    });

    it('deve ter meta com createdAt', () => {
      assert.ok(emptyFinanceState.meta.createdAt);
      assert.ok(typeof emptyFinanceState.meta.createdAt === 'string');
    });

    it('deve ter meta com lastResetAt null inicialmente', () => {
      assert.strictEqual(emptyFinanceState.meta.lastResetAt, null);
    });
  });
});

describe('utils.js - monthKey', () => {
  it('deve gerar chave no formato YYYY-MM para data especifica', () => {
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

  it('deve funcionar com meses de inicio de ano', () => {
    assert.strictEqual(monthKey(new Date('2024-01-01')), '2024-01');
  });

  it('deve funcionar com meses de fim de ano', () => {
    assert.strictEqual(monthKey(new Date('2024-12-31')), '2024-12');
  });
});

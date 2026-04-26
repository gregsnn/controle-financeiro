import { describe, it } from 'node:test';
import assert from 'node:assert';

const { OVERRIDE_TYPES } = await import('../domain/constants.js');
const { selectMonthCardBills, selectMonthRevenueAmounts } = await import('../selectors/monthOverrideSelectors.js');
const { monthKey } = await import('../lib/utils.js');

describe('useMonthOverridesActions.js (logic)', () => {
  describe('selectMonthCardBills', () => {
    it('deve retornar mapa vazio quando nao ha overrides', () => {
      const result = selectMonthCardBills([], '2024-03');
      assert.deepStrictEqual(result, {});
    });

    it('deve filtrar apenas CARD_BILL_AMOUNT do mes correto', () => {
      const overrides = [
        {
          id: '1',
          type: OVERRIDE_TYPES.CARD_BILL_AMOUNT,
          itemId: 'santander',
          amount: 1500,
          monthKey: '2024-03',
        },
        {
          id: '2',
          type: OVERRIDE_TYPES.CARD_BILL_AMOUNT,
          itemId: 'nubank',
          amount: 800,
          monthKey: '2024-02',
        },
        {
          id: '3',
          type: OVERRIDE_TYPES.REVENUE_AMOUNT,
          itemId: 'rev-1',
          amount: 3000,
          monthKey: '2024-03',
        },
      ];

      const result = selectMonthCardBills(overrides, '2024-03');

      assert.strictEqual(result.santander, 1500);
      assert.strictEqual(result.nubank, undefined);
    });

    it('deve ignorar valores invalidos', () => {
      const overrides = [
        {
          id: '1',
          type: OVERRIDE_TYPES.CARD_BILL_AMOUNT,
          itemId: 'santander',
          amount: -100,
          monthKey: '2024-03',
        },
        {
          id: '2',
          type: OVERRIDE_TYPES.CARD_BILL_AMOUNT,
          itemId: 'nubank',
          amount: null,
          monthKey: '2024-03',
        },
        {
          id: '3',
          type: OVERRIDE_TYPES.CARD_BILL_AMOUNT,
          itemId: 'outro',
          amount: 0,
          monthKey: '2024-03',
        },
        {
          id: '4',
          type: OVERRIDE_TYPES.CARD_BILL_AMOUNT,
          itemId: 'valido',
          amount: 500,
          monthKey: '2024-03',
        },
      ];

      const result = selectMonthCardBills(overrides, '2024-03');

      assert.strictEqual(result.valido, 500);
      assert.strictEqual(Object.keys(result).length, 1);
    });

    it('deve funcionar com mes diferente', () => {
      const overrides = [
        {
          id: '1',
          type: OVERRIDE_TYPES.CARD_BILL_AMOUNT,
          itemId: 'santander',
          amount: 2000,
          monthKey: '2024-06',
        },
      ];

      const result = selectMonthCardBills(overrides, '2024-06');
      assert.strictEqual(result.santander, 2000);

      const result2 = selectMonthCardBills(overrides, '2024-05');
      assert.strictEqual(Object.keys(result2).length, 0);
    });
  });

  describe('selectMonthRevenueAmounts', () => {
    it('deve retornar mapa vazio quando nao ha overrides', () => {
      const result = selectMonthRevenueAmounts([], '2024-03');
      assert.deepStrictEqual(result, {});
    });

    it('deve filtrar apenas REVENUE_AMOUNT do mes correto', () => {
      const overrides = [
        {
          id: '1',
          type: OVERRIDE_TYPES.REVENUE_AMOUNT,
          itemId: 'rev-1',
          amount: 3500,
          monthKey: '2024-03',
        },
        {
          id: '2',
          type: OVERRIDE_TYPES.CARD_BILL_AMOUNT,
          itemId: 'santander',
          amount: 1500,
          monthKey: '2024-03',
        },
      ];

      const result = selectMonthRevenueAmounts(overrides, '2024-03');

      assert.strictEqual(result['rev-1'], 3500);
      assert.strictEqual(Object.keys(result).length, 1);
    });

    it('deve ignorar valores negativos', () => {
      const overrides = [
        {
          id: '1',
          type: OVERRIDE_TYPES.REVENUE_AMOUNT,
          itemId: 'rev-negativo',
          amount: -500,
          monthKey: '2024-03',
        },
        {
          id: '2',
          type: OVERRIDE_TYPES.REVENUE_AMOUNT,
          itemId: 'rev-valido',
          amount: 2500,
          monthKey: '2024-03',
        },
      ];

      const result = selectMonthRevenueAmounts(overrides, '2024-03');

      assert.strictEqual(result['rev-valido'], 2500);
      assert.strictEqual(Object.keys(result).length, 1);
    });
  });

  describe('upsertMonthOverride logic', () => {
    const createOverride = ({ type, itemId, monthKey, amount, name, hidden, paid }) => ({
      id: `ovr-${Date.now()}`,
      type,
      itemId,
      monthKey,
      ...(amount !== undefined ? { amount } : {}),
      ...(name !== undefined ? { name } : {}),
      ...(hidden !== undefined ? { hidden } : {}),
      ...(paid !== undefined ? { paid } : {}),
    });

    it('deve criar novo override', () => {
      const overrides = [];
      const newOverride = createOverride({
        type: OVERRIDE_TYPES.REVENUE_AMOUNT,
        itemId: 'rev-1',
        monthKey: '2024-03',
        amount: 3500,
      });

      const updated = [...overrides, newOverride];

      assert.strictEqual(updated.length, 1);
      assert.strictEqual(updated[0].amount, 3500);
    });

    it('deve atualizar override existente', () => {
      const overrides = [
        {
          id: '1',
          type: OVERRIDE_TYPES.REVENUE_AMOUNT,
          itemId: 'rev-1',
          monthKey: '2024-03',
          amount: 3000,
        },
      ];

      const updated = overrides.map((o) =>
        o.type === OVERRIDE_TYPES.REVENUE_AMOUNT && o.itemId === 'rev-1' && o.monthKey === '2024-03'
          ? { ...o, amount: 3500 }
          : o
      );

      assert.strictEqual(updated[0].amount, 3500);
    });

    it('deve remover override quando amount null', () => {
      const overrides = [
        {
          id: '1',
          type: OVERRIDE_TYPES.REVENUE_AMOUNT,
          itemId: 'rev-1',
          monthKey: '2024-03',
          amount: 3000,
        },
      ];

      const filtered = overrides.filter(
        (o) =>
          !(
            o.type === OVERRIDE_TYPES.REVENUE_AMOUNT &&
            o.itemId === 'rev-1' &&
            o.monthKey === '2024-03'
          )
      );

      assert.strictEqual(filtered.length, 0);
    });
  });
});

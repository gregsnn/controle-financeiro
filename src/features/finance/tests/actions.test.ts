import { describe, expect, it } from 'vitest';
import {
  createActions,
  migrateLegacyCardBills,
  normalizeFixedExpense,
  normalizeInstallment,
  parseLegacyCardBill,
} from '../domain/actions';
import { OVERRIDE_TYPES } from '../domain/constants';

function createTestState() {
  return {
    currentDate: new Date('2026-08-15'),
    fixedExpenses: [
      {
        id: 'f1',
        name: 'Internet',
        amount: 120,
        dueDay: 5,
        category: 'telefone',
        paymentMethod: 'pix',
        active: true,
        startMonth: '2026-01',
        endMonth: null,
        notes: '',
      },
    ],
    installments: [],
    revenues: [
      {
        id: 'r1',
        name: 'Salario',
        baseAmount: 5000,
        active: true,
        startMonth: '2026-01',
        endMonth: null,
        category: 'outro',
        notes: '',
      },
    ],
    monthOverrides: [
      {
        id: 'o1',
        type: OVERRIDE_TYPES.FIXED_EXPENSE_PAYMENT,
        itemId: 'f1',
        monthKey: '2026-07',
        paid: true,
      },
      {
        id: 'o2',
        type: OVERRIDE_TYPES.REVENUE_AMOUNT,
        itemId: 'r1',
        monthKey: '2026-07',
        amount: 5300,
      },
    ],
    settings: { theme: 'default' },
    meta: { schemaVersion: 3, createdAt: new Date('2026-01-01'), lastResetAt: null },
  };
}

describe('actions.ts', () => {
  describe('parseLegacyCardBill', () => {
    it('parses null/undefined/empty', () => {
      expect(parseLegacyCardBill(null)).toBeNull();
      expect(parseLegacyCardBill(undefined)).toBeNull();
      expect(parseLegacyCardBill('')).toBeNull();
    });

    it('parses valid numbers', () => {
      expect(parseLegacyCardBill(500)).toBe(500);
      expect(parseLegacyCardBill(0)).toBeNull();
      expect(parseLegacyCardBill(-100)).toBeNull();
    });

    it('parses BRL formatted strings', () => {
      expect(parseLegacyCardBill('R$ 500,00')).toBe(500);
      expect(parseLegacyCardBill('1.234,56')).toBe(1234.56);
      expect(parseLegacyCardBill('500')).toBe(500);
    });

    it('rejects invalid values', () => {
      expect(parseLegacyCardBill('abc')).toBeNull();
      expect(parseLegacyCardBill(NaN)).toBeNull();
    });
  });

  describe('normalizeFixedExpense', () => {
    it('converts cartao with valid card', () => {
      const result = normalizeFixedExpense({ name: 'TV', paymentMethod: 'cartao', card: 'nubank' });
      expect(result.paymentMethod).toBe('nubank');
    });

    it('converts cartao with santander', () => {
      const result = normalizeFixedExpense({
        name: 'Seguro',
        paymentMethod: 'cartao',
        card: 'santander',
      });
      expect(result.paymentMethod).toBe('santander');
    });

    it('defaults invalid payment method to boleto', () => {
      const result = normalizeFixedExpense({ name: 'Test', paymentMethod: 'invalid' });
      expect(result.paymentMethod).toBe('boleto');
    });

    it('removes card for non-cartao methods', () => {
      const result = normalizeFixedExpense({ name: 'Test', paymentMethod: 'pix', card: 'nubank' });
      expect((result as any).card).toBeNull();
    });

    it('defaults missing card to outro', () => {
      const result = normalizeFixedExpense({ name: 'Test', paymentMethod: 'cartao' });
      expect((result as any).card).toBe('outro');
    });
  });

  describe('normalizeInstallment', () => {
    it('normalizes valid cards', () => {
      expect(normalizeInstallment({ card: 'santander' }).card).toBe('santander');
      expect(normalizeInstallment({ card: 'nubank' }).card).toBe('nubank');
      expect(normalizeInstallment({ card: 'outro' }).card).toBe('outro');
    });

    it('defaults invalid card to outro', () => {
      expect(normalizeInstallment({ card: 'invalid' }).card).toBe('outro');
      expect(normalizeInstallment({ card: '' }).card).toBe('outro');
      expect(normalizeInstallment({}).card).toBe('outro');
    });
  });

  describe('migrateLegacyCardBills', () => {
    it('returns state unchanged if no legacy cardBills', () => {
      const state = { settings: {}, currentDate: new Date('2026-04-15') };
      const result = migrateLegacyCardBills(state as any);
      expect(result.monthOverrides).toHaveLength(0);
    });

    it('skips migration if overrides already exist for current month', () => {
      const state = {
        settings: { cardBills: { nubank: '200' } },
        currentDate: new Date('2026-04-15'),
        monthOverrides: [
          {
            id: 'o1',
            type: OVERRIDE_TYPES.CARD_BILL_AMOUNT,
            itemId: 'nubank',
            monthKey: '2026-04',
            amount: 100,
          },
        ],
      };
      const result = migrateLegacyCardBills(state as any);
      expect(result.monthOverrides).toHaveLength(1);
    });

    it('migrates valid legacy card bills', () => {
      const state = {
        settings: { cardBills: { nubank: '500', santander: '300' }, other: 'value' },
        currentDate: new Date('2026-04-15'),
        monthOverrides: [],
      };
      const result = migrateLegacyCardBills(state as any);
      expect(result.monthOverrides).toHaveLength(2);
      const nubank = result.monthOverrides.find((o: any) => o.itemId === 'nubank');
      const santander = result.monthOverrides.find((o: any) => o.itemId === 'santander');
      expect(nubank?.amount).toBe(500);
      expect(santander?.amount).toBe(300);
    });

    it('filters invalid card bills', () => {
      const state = {
        settings: { cardBills: { nubank: 'invalid', santander: '200' } },
        currentDate: new Date('2026-04-15'),
        monthOverrides: [],
      };
      const result = migrateLegacyCardBills(state as any);
      expect(result.monthOverrides).toHaveLength(1);
      expect(result.monthOverrides[0]?.itemId).toBe('santander');
    });

    it('removes cardBills from settings', () => {
      const state = {
        settings: { cardBills: { nubank: '200' }, theme: 'default' },
        currentDate: new Date('2026-04-15'),
        monthOverrides: [],
      };
      const result = migrateLegacyCardBills(state as any);
      expect((result.settings as any)?.cardBills).toBeUndefined();
    });
  });

  describe('remove actions', () => {
    it('closes fixed expenses at the previous month without dropping history', () => {
      let state = createTestState();
      const actions = createActions(
        state as any,
        (updater: any) => {
          state = typeof updater === 'function' ? updater(state) : updater;
        },
        state.currentDate
      );

      actions.removeFixedExpense('f1');

      expect(state.fixedExpenses[0].endMonth).toBe('2026-07');
      expect(state.monthOverrides).toHaveLength(2);
      expect(state.monthOverrides.some((override: any) => override.itemId === 'f1')).toBe(true);
    });

    it('closes revenues at the previous month without dropping history', () => {
      let state = createTestState();
      const actions = createActions(
        state as any,
        (updater: any) => {
          state = typeof updater === 'function' ? updater(state) : updater;
        },
        state.currentDate
      );

      actions.removeRevenue('r1');

      expect(state.revenues[0].endMonth).toBe('2026-07');
      expect(state.monthOverrides).toHaveLength(2);
      expect(state.monthOverrides.some((override: any) => override.itemId === 'r1')).toBe(true);
    });
  });
});

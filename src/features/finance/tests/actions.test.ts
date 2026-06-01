import { describe, expect, it } from 'vitest';
import {
  createActions,
  migrateLegacyCardBills,
  normalizeFixedExpense,
  normalizeInstallment,
  parseLegacyCardBill,
} from '../domain/actions';
import { OVERRIDE_TYPES } from '../domain/constants';
import { markBillAsPaid } from '../selectors/summarySelectors';

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
    it('keeps cartao with any card', () => {
      const result = normalizeFixedExpense({ name: 'TV', paymentMethod: 'cartao', card: 'nubank' });
      expect(result.paymentMethod).toBe('cartao');
      expect((result as any).card).toBe('nubank');
    });

    it('keeps cartao for custom card ids', () => {
      const result = normalizeFixedExpense({
        name: 'Seguro',
        paymentMethod: 'cartao',
        card: 'santander',
      });
      expect(result.paymentMethod).toBe('cartao');
      expect((result as any).card).toBe('santander');
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

    it('preserves custom card ids with cartao', () => {
      const result = normalizeFixedExpense({ name: 'Test', paymentMethod: 'cartao', card: 'itau' });
      expect(result.paymentMethod).toBe('cartao');
      expect((result as any).card).toBe('itau');
    });

    it('handles cartao with outro card', () => {
      const result = normalizeFixedExpense({
        name: 'Test',
        paymentMethod: 'cartao',
        card: 'outro',
      });
      expect(result.paymentMethod).toBe('cartao');
      expect((result as any).card).toBe('outro');
    });
  });

  describe('normalizeInstallment', () => {
    it('normalizes valid cards', () => {
      expect(normalizeInstallment({ card: 'santander' }).card).toBe('santander');
      expect(normalizeInstallment({ card: 'nubank' }).card).toBe('nubank');
      expect(normalizeInstallment({ card: 'outro' }).card).toBe('outro');
    });

    it('preserves custom card ids (user-added cards)', () => {
      expect(normalizeInstallment({ card: 'itau' }).card).toBe('itau');
      expect(normalizeInstallment({ card: 'meu-banco' }).card).toBe('meu-banco');
    });

    it('defaults empty or missing card to outro', () => {
      expect(normalizeInstallment({ card: '' }).card).toBe('outro');
      expect(normalizeInstallment({}).card).toBe('outro');
      expect(normalizeInstallment({ card: '   ' }).card).toBe('outro');
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

    it('does not override earlier endMonth when removing fixed expense', () => {
      let state = createTestState();
      (state as any).fixedExpenses[0].endMonth = '2026-05'; // Already has earlier endMonth
      const actions = createActions(
        state as any,
        (updater: any) => {
          state = typeof updater === 'function' ? updater(state) : updater;
        },
        state.currentDate
      );

      actions.removeFixedExpense('f1');

      expect(state.fixedExpenses[0].endMonth).toBe('2026-05'); // Should keep earlier date
    });

    it('only removes one item by id even with same name', () => {
      let state = {
        ...createTestState(),
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
          {
            id: 'r2',
            name: 'Salario',
            baseAmount: 3000,
            active: true,
            startMonth: '2026-01',
            endMonth: null,
            category: 'outro',
            notes: '',
          },
        ],
      };
      const actions = createActions(
        state as any,
        (updater: any) => {
          state = typeof updater === 'function' ? updater(state) : updater;
        },
        state.currentDate
      );

      actions.removeRevenue('r1');

      expect(state.revenues).toHaveLength(2); // Should still have 2 items
      expect(state.revenues[0].endMonth).toBe('2026-07'); // r1 should have endMonth
      expect(state.revenues[1].endMonth).toBeNull(); // r2 should not be affected
    });

    it('handles removing non-existent fixed expense', () => {
      let state = createTestState();
      const actions = createActions(
        state as any,
        (updater: any) => {
          state = typeof updater === 'function' ? updater(state) : updater;
        },
        state.currentDate
      );

      actions.removeFixedExpense('non-existent');

      // State should remain unchanged for non-existent items
      expect(state.fixedExpenses).toHaveLength(1);
    });
  });

  describe('markBillAsPaid', () => {
    it('should mark fixed expenses and installments as paid for a given card', () => {
      const cardKey = 'card1';
      const cardBills = { card1: 1000 };
      const fixedExpenses = [
        { id: 'f1', name: 'Internet', amount: 120, paid: false, card: 'card1' },
      ];
      const installments = [{ id: 'i1', card: 'card1', installmentValue: 500, paid: false }];
      const billPaymentMap = { card1: false };

      markBillAsPaid(
        cardKey,
        cardBills,
        fixedExpenses as any as import('../domain/types').MonthViewFixedExpense[],
        installments as any as import('../domain/types').MonthViewInstallment[],
        billPaymentMap
      );

      expect(fixedExpenses[0].paid).toBe(true);
      expect(installments[0].paid).toBe(true);
      expect(billPaymentMap[cardKey]).toBe(true);
    });

    it('should not mark already paid items again', () => {
      const cardKey = 'card1';
      const cardBills = { card1: 1000 };
      const fixedExpenses = [
        { id: 'f1', name: 'Internet', amount: 120, paid: true, card: 'card1' },
      ];
      const installments = [{ id: 'i1', card: 'card1', installmentValue: 500, paid: true }];
      const billPaymentMap = { card1: false };

      markBillAsPaid(
        cardKey,
        cardBills,
        fixedExpenses as any as import('../domain/types').MonthViewFixedExpense[],
        installments as any as import('../domain/types').MonthViewInstallment[],
        billPaymentMap
      );

      expect(fixedExpenses[0].paid).toBe(true);
      expect(installments[0].paid).toBe(true);
      expect(billPaymentMap[cardKey]).toBe(true);
    });
  });
});

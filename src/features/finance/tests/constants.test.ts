import { describe, expect, it } from 'vitest';
import { ALLOWED_BILL_CARDS, ALLOWED_PAYMENT_METHODS, OVERRIDE_TYPES } from '../domain/constants';
import {
  BILL_CARDS,
  BILL_CARD_KEYS,
  CARD_LABELS,
  CARD_ORDER,
  CATEGORIES,
  CATEGORY_LABELS,
  TABS,
} from '../ui/constants';

describe('constants.ts', () => {
  describe('OVERRIDE_TYPES', () => {
    it('has all required override types', () => {
      expect(OVERRIDE_TYPES.FIXED_EXPENSE).toBe('fixedExpense');
      expect(OVERRIDE_TYPES.FIXED_EXPENSE_PAYMENT).toBe('fixedExpensePayment');
      expect(OVERRIDE_TYPES.REVENUE).toBe('revenue');
      expect(OVERRIDE_TYPES.REVENUE_AMOUNT).toBe('revenueAmount');
      expect(OVERRIDE_TYPES.INSTALLMENT_PAYMENT).toBe('installmentPayment');
      expect(OVERRIDE_TYPES.CARD_BILL_AMOUNT).toBe('cardBillAmount');
      expect(OVERRIDE_TYPES.CARD_BILL_PAYMENT).toBe('cardBillPayment');
    });
  });

  describe('ALLOWED_PAYMENT_METHODS', () => {
    it('includes expected payment methods', () => {
      expect(ALLOWED_PAYMENT_METHODS).toContain('boleto');
      expect(ALLOWED_PAYMENT_METHODS).toContain('pix');
      expect(ALLOWED_PAYMENT_METHODS).toContain('debito');
      expect(ALLOWED_PAYMENT_METHODS).toContain('cartao');
    });
  });

  describe('ALLOWED_BILL_CARDS', () => {
    it('includes only fallback card', () => {
      expect(ALLOWED_BILL_CARDS).toContain('outro');
      expect(ALLOWED_BILL_CARDS).toHaveLength(1);
    });
  });

  describe('BILL_CARDS', () => {
    it('is empty (cards are dynamic)', () => {
      expect(BILL_CARDS).toHaveLength(0);
    });
  });

  describe('BILL_CARD_KEYS', () => {
    it('is empty (cards are dynamic)', () => {
      expect(BILL_CARD_KEYS).toHaveLength(0);
    });
  });

  describe('CARD_ORDER', () => {
    it('has only fallback', () => {
      expect(CARD_ORDER).toEqual(['outro']);
    });
  });

  describe('CATEGORIES', () => {
    it('has all categories', () => {
      expect(CATEGORIES.casa).toBeDefined();
      expect(CATEGORIES.aluguel).toBeDefined();
      expect(CATEGORIES.telefone).toBeDefined();
    });
  });

  describe('CATEGORY_LABELS', () => {
    it('has uppercase labels', () => {
      expect(CATEGORY_LABELS.casa).toBe('CASA');
      expect(CATEGORY_LABELS.telefone).toBe('TELEFONE');
    });
  });

  describe('CARD_LABELS', () => {
    it('has fallback card label', () => {
      expect(CARD_LABELS.outro).toBe('OUTROS');
    });
  });

  describe('TABS', () => {
    it('has all tabs', () => {
      expect(TABS).toHaveLength(4);
      expect(TABS.find((t) => t.id === 'resumo')).toBeDefined();
      expect(TABS.find((t) => t.id === 'gastos')).toBeDefined();
      expect(TABS.find((t) => t.id === 'parcelas')).toBeDefined();
      expect(TABS.find((t) => t.id === 'receitas')).toBeDefined();
    });

    it('keeps stable ids while pointing to the new product labels', () => {
      expect(TABS.find((t) => t.id === 'gastos')?.labelKey).toBe('tabs.gastos');
      expect(TABS.find((t) => t.id === 'parcelas')?.labelKey).toBe('tabs.parcelas');
    });
  });
});

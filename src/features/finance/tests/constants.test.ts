import { describe, it, expect } from 'vitest';
import {
  OVERRIDE_TYPES,
  ALLOWED_PAYMENT_METHODS,
  ALLOWED_BILL_CARDS,
  BILL_CARDS,
  BILL_CARD_KEYS,
  CARD_ORDER,
  CATEGORIES,
  CATEGORY_LABELS,
  CARD_LABELS,
  ICONS,
  CARD_ICONS,
  TABS,
} from '../domain/constants';

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
      expect(ALLOWED_PAYMENT_METHODS).toContain('santander');
      expect(ALLOWED_PAYMENT_METHODS).toContain('nubank');
      expect(ALLOWED_PAYMENT_METHODS).toContain('cartao');
    });
  });

  describe('ALLOWED_BILL_CARDS', () => {
    it('includes expected cards', () => {
      expect(ALLOWED_BILL_CARDS).toContain('santander');
      expect(ALLOWED_BILL_CARDS).toContain('nubank');
      expect(ALLOWED_BILL_CARDS).toContain('outro');
    });
  });

  describe('BILL_CARDS', () => {
    it('has correct structure', () => {
      expect(BILL_CARDS).toHaveLength(2);
      expect(BILL_CARDS[0]).toHaveProperty('key');
      expect(BILL_CARDS[0]).toHaveProperty('label');
    });
  });

  describe('BILL_CARD_KEYS', () => {
    it('extracts card keys', () => {
      expect(BILL_CARD_KEYS).toContain('santander');
      expect(BILL_CARD_KEYS).toContain('nubank');
    });
  });

  describe('CARD_ORDER', () => {
    it('has expected order', () => {
      expect(CARD_ORDER).toEqual(['santander', 'nubank', 'outro']);
    });
  });

  describe('CATEGORIES', () => {
    it('has all categories', () => {
      expect(CATEGORIES.debito).toBeDefined();
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
    it('has card labels', () => {
      expect(CARD_LABELS.santander).toBe('SANTANDER');
      expect(CARD_LABELS.nubank).toBe('NUBANK');
      expect(CARD_LABELS.outro).toBe('OUTROS');
    });
  });

  describe('ICONS', () => {
    it('has icons for payment methods', () => {
      expect(ICONS.boleto).toBeDefined();
      expect(ICONS.pix).toBeDefined();
      expect(ICONS.santander).toBeDefined();
      expect(ICONS.nubank).toBeDefined();
    });
  });

  describe('CARD_ICONS', () => {
    it('has icons for cards', () => {
      expect(CARD_ICONS.santander).toBeDefined();
      expect(CARD_ICONS.nubank).toBeDefined();
      expect(CARD_ICONS.outro).toBeDefined();
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
  });
});

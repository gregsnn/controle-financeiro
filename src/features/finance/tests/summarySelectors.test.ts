import { describe, it, expect } from 'vitest';
import {
  readCardBill,
  getExpenseCard,
  buildTrackedCardBills,
  mergeCardBillsWithTrackedExpenses,
  buildBillPaymentMap,
  buildSummaryData,
} from '../selectors/summarySelectors';
import { OVERRIDE_TYPES } from '../domain/constants';
import type { MonthOverride, MonthView } from '../domain/types';

describe('summarySelectors.ts', () => {
  describe('readCardBill', () => {
    it('returns 0 for unknown card', () => {
      expect(readCardBill({}, 'unknown')).toBe(0);
    });

    it('reads bill value', () => {
      expect(readCardBill({ nubank: 500 }, 'nubank')).toBe(500);
    });

    it('handles null/undefined', () => {
      expect(readCardBill(null, 'nubank')).toBe(0);
      expect(readCardBill(undefined, 'nubank')).toBe(0);
    });

    it('handles invalid values', () => {
      expect(readCardBill({ nubank: NaN }, 'nubank')).toBe(0);
    });
  });

  describe('getExpenseCard', () => {
    it('returns card for paymentMethod santander', () => {
      expect(getExpenseCard({ paymentMethod: 'santander' })).toBe('santander');
    });

    it('returns card for paymentMethod nubank', () => {
      expect(getExpenseCard({ paymentMethod: 'nubank' })).toBe('nubank');
    });

    it('returns card for cartao paymentMethod', () => {
      expect(getExpenseCard({ paymentMethod: 'cartao', card: 'nubank' })).toBe('nubank');
    });

    it('returns outro for cartao without card', () => {
      expect(getExpenseCard({ paymentMethod: 'cartao' })).toBe('outro');
    });

    it('returns null for other payment methods', () => {
      expect(getExpenseCard({ paymentMethod: 'boleto' })).toBeNull();
      expect(getExpenseCard({ paymentMethod: 'pix' })).toBeNull();
    });
  });

  describe('buildBillPaymentMap', () => {
    it('builds payment map for current month', () => {
      const overrides: MonthOverride[] = [
        {
          id: 'o1',
          type: OVERRIDE_TYPES.CARD_BILL_PAYMENT,
          itemId: 'nubank',
          monthKey: '2026-04',
          paid: true,
        },
        {
          id: 'o2',
          type: OVERRIDE_TYPES.CARD_BILL_PAYMENT,
          itemId: 'santander',
          monthKey: '2026-04',
          paid: false,
        },
        {
          id: 'o3',
          type: OVERRIDE_TYPES.CARD_BILL_PAYMENT,
          itemId: 'nubank',
          monthKey: '2026-03',
          paid: true,
        },
      ];
      const result = buildBillPaymentMap(overrides, '2026-04');
      expect(result.nubank).toBe(true);
      expect(result.santander).toBe(false);
    });
  });

  describe('card bill tracking', () => {
    const monthView: MonthView = {
      fixedExpenses: [
        {
          id: 'fixed-1',
          name: 'Internet',
          amount: 60,
          dueDay: 10,
          category: 'telefone',
          paymentMethod: 'cartao',
          card: 'nubank',
          active: true,
          startMonth: '2026-01',
          endMonth: null,
          notes: '',
          paid: false,
        },
      ],
      variableExpenses: [],
      installments: [
        {
          id: 'inst-1',
          name: 'Notebook',
          totalInstallments: 10,
          currentInstallment: 1,
          installmentValue: 60,
          card: 'nubank',
          category: 'eletronicos',
          startMonth: '2026-01',
          active: true,
          closedAt: null,
          paid: false,
        },
      ],
      revenues: [],
      totals: { despesasFixas: 60, despesasVariaveis: 0, receitas: 0, installments: 60 },
    };

    it('sums fixed expenses and installments by card', () => {
      expect(buildTrackedCardBills(monthView)).toEqual({ nubank: 120 });
    });

    it('tracks variable expenses paid by card', () => {
      expect(
        buildTrackedCardBills({
          ...monthView,
          fixedExpenses: [],
          installments: [],
          variableExpenses: [
            {
              id: 'var-1',
              name: 'Mercado',
              amount: 90,
              date: '2026-04-10',
              monthKey: '2026-04',
              category: 'casa',
              paymentMethod: 'cartao',
              card: 'nubank',
              paid: false,
              notes: '',
            },
          ],
        })
      ).toEqual({ nubank: 90 });
    });

    it('raises the bill when tracked card expenses are greater', () => {
      expect(mergeCardBillsWithTrackedExpenses({ nubank: 100 }, { nubank: 120 })).toEqual({
        nubank: 120,
      });
    });

    it('uses tracked expenses as the bill when there is no manual bill', () => {
      expect(mergeCardBillsWithTrackedExpenses({}, { nubank: 120 })).toEqual({
        nubank: 120,
      });
    });

    it('keeps the bill when it is already greater than tracked expenses', () => {
      expect(mergeCardBillsWithTrackedExpenses({ nubank: 150 }, { nubank: 120 })).toEqual({
        nubank: 150,
      });
    });

    it('does not keep a derived bill when tracked expenses are removed', () => {
      expect(mergeCardBillsWithTrackedExpenses({}, {})).toEqual({});
    });
  });

  describe('buildSummaryData', () => {
    const baseMonthView: MonthView = {
      fixedExpenses: [
        {
          id: '1',
          name: 'Aluguel',
          amount: 1500,
          dueDay: 5,
          category: 'aluguel',
          paymentMethod: 'boleto',
          active: true,
          startMonth: '2026-01',
          endMonth: null,
          notes: '',
          paid: true,
        },
        {
          id: '2',
          name: 'Internet',
          amount: 120,
          dueDay: 10,
          category: 'telefone',
          paymentMethod: 'nubank',
          active: true,
          startMonth: '2026-01',
          endMonth: null,
          notes: '',
          paid: false,
        },
      ],
      variableExpenses: [],
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
      totals: { despesasFixas: 1620, despesasVariaveis: 0, receitas: 5000, installments: 0 },
    };

    it('calculates fixedExpensesNonCard', () => {
      const result = buildSummaryData(baseMonthView, {}, [], '2026-04');
      expect(result.fixedExpensesNonCard).toBe(1500);
    });

    it('calculates saldo', () => {
      const result = buildSummaryData(baseMonthView, {}, [], '2026-04');
      expect(result.saldo).toBe(3500);
    });

    it('calculates saldoPrevisto', () => {
      const result = buildSummaryData(baseMonthView, {}, [], '2026-04');
      expect(result.saldoPrevisto).toBe(3380);
    });

    it('detects negative balance', () => {
      const monthViewNegative = {
        ...baseMonthView,
        revenues: [
          {
            id: 'r1',
            name: 'Salario',
            baseAmount: 1000,
            active: true,
            startMonth: '2026-01',
            endMonth: null,
            category: 'outro',
            notes: '',
          },
        ],
        totals: { ...baseMonthView.totals, receitas: 1000 },
      };
      const result = buildSummaryData(monthViewNegative, {}, [], '2026-04');
      expect(result.hasNegativeBalance).toBe(true);
    });

    it('includes billCardsSummary with cards from data and bills', () => {
      const result = buildSummaryData(baseMonthView, { nubank: 200 }, [], '2026-04');
      expect(result.billCardsSummary.length).toBeGreaterThan(0);
      const nubankCard = result.billCardsSummary.find((c) => c.key === 'nubank');
      expect(nubankCard?.bill).toBe(200);
    });

    it('includes cards from cardBills even without data', () => {
      const monthViewNoCards = {
        ...baseMonthView,
        fixedExpenses: [baseMonthView.fixedExpenses[0]], // only boleto expense
      };
      const result = buildSummaryData(monthViewNoCards, { santander: 300 }, [], '2026-04');
      const santanderCard = result.billCardsSummary.find((c) => c.key === 'santander');
      expect(santanderCard).toBeDefined();
      expect(santanderCard?.bill).toBe(300);
    });

    it('includes cards from cardList', () => {
      const cardList = [{ key: 'itau', label: 'Itaú' }];
      const result = buildSummaryData(baseMonthView, {}, [], '2026-04', cardList);
      const itauCard = result.billCardsSummary.find((c) => c.key === 'itau');
      expect(itauCard).toBeDefined();
    });

    it('includes variable expenses in forecast and bill abatements', () => {
      const result = buildSummaryData(
        {
          ...baseMonthView,
          fixedExpenses: [],
          variableExpenses: [
            {
              id: 'var-card',
              name: 'Mercado',
              amount: 100,
              date: '2026-04-10',
              monthKey: '2026-04',
              category: 'casa',
              paymentMethod: 'cartao',
              card: 'nubank',
              paid: false,
              notes: '',
            },
            {
              id: 'var-pix',
              name: 'Padaria',
              amount: 30,
              date: '2026-04-11',
              monthKey: '2026-04',
              category: 'outro',
              paymentMethod: 'pix',
              card: null,
              paid: true,
              notes: '',
            },
          ],
          totals: {
            ...baseMonthView.totals,
            despesasFixas: 0,
            despesasVariaveis: 130,
          },
        },
        { nubank: 150 },
        [],
        '2026-04',
        [{ key: 'nubank', label: 'Nubank' }]
      );

      expect(result.despesasBrutas).toBe(180);
      expect(result.despesasPagasBrutas).toBe(30);
      expect(result.saldoPrevisto).toBe(4820);
      expect(result.billCardsSummary[0]).toMatchObject({
        key: 'nubank',
        bill: 150,
        abatimento: 100,
        restanteFatura: 50,
      });
    });
  });
});

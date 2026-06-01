import { describe, it, expect } from 'vitest';
import {
  buildCardSeries,
  buildCardStatusSeries,
  buildCategorySeries,
  CHART_COLORS,
} from '../lib/chartSeries';

describe('chartSeries.js', () => {
  describe('CHART_COLORS', () => {
    it('has colors defined', () => {
      expect(CHART_COLORS.length).toBeGreaterThan(0);
    });
  });

  describe('buildCategorySeries', () => {
    it('returns empty series with no expenses', () => {
      const result = buildCategorySeries({
        fixedExpenses: [],
        variableExpenses: [],
        installments: [],
        revenues: [],
        totals: { despesasFixas: 0, despesasVariaveis: 0, receitas: 0, installments: 0 },
      });
      expect(result.labels).toHaveLength(0);
    });

    it('groups expenses by category', () => {
      const result = buildCategorySeries({
        fixedExpenses: [
          {
            id: '1',
            name: 'Aluguel',
            amount: 1500,
            category: 'casa',
            paymentMethod: 'boleto',
            active: true,
            startMonth: '2026-01',
            endMonth: null,
            dueDay: 5,
            notes: '',
            paid: false,
          },
          {
            id: '2',
            name: 'Internet',
            amount: 120,
            category: 'telefone',
            paymentMethod: 'pix',
            active: true,
            startMonth: '2026-01',
            endMonth: null,
            dueDay: 5,
            notes: '',
            paid: false,
          },
        ],
        variableExpenses: [],
        installments: [],
        revenues: [],
        totals: { despesasFixas: 1620, despesasVariaveis: 0, receitas: 0, installments: 0 },
      });
      expect(result.labels).toContain('CASA');
      expect(result.labels).toContain('TELEFONE');
    });

    it('includes variable expenses in category distribution', () => {
      const result = buildCategorySeries({
        fixedExpenses: [],
        variableExpenses: [
          {
            id: 'var-1',
            name: 'Farmacia',
            amount: 80,
            date: '2026-05-10',
            monthKey: '2026-05',
            category: 'telefone',
            paymentMethod: 'pix',
            card: null,
            paid: true,
            notes: '',
          },
        ],
        installments: [],
        revenues: [],
        totals: { despesasFixas: 0, despesasVariaveis: 80, receitas: 0, installments: 0 },
      });

      expect(result.labels).toEqual(['TELEFONE']);
      expect(result.values).toEqual([80]);
    });
  });

  describe('card series', () => {
    it('includes variable expenses paid by card in card and status distributions', () => {
      const monthView = {
        fixedExpenses: [],
        variableExpenses: [
          {
            id: 'var-1',
            name: 'Mercado',
            amount: 120,
            date: '2026-05-10',
            monthKey: '2026-05',
            category: 'casa',
            paymentMethod: 'cartao',
            card: 'itau',
            paid: false,
            notes: '',
          },
        ],
        installments: [],
        revenues: [],
        totals: { despesasFixas: 0, despesasVariaveis: 120, receitas: 0, installments: 0 },
      };

      expect(buildCardSeries(monthView).labels).toEqual(['ITAU']);

      const status = buildCardStatusSeries(monthView);
      expect(status.labels).toEqual(['ITAU']);
      expect(status.paidValues).toEqual([0]);
      expect(status.toPayValues).toEqual([120]);
    });
  });
});

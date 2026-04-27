import { describe, it, expect } from 'vitest';
import { buildCategorySeries, CHART_COLORS } from '../lib/chartSeries';

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
        installments: [],
        revenues: [],
        totals: { despesasFixas: 0, receitas: 0, installments: 0 },
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
        installments: [],
        revenues: [],
        totals: { despesasFixas: 1620, receitas: 0, installments: 0 },
      });
      expect(result.labels).toContain('CASA');
      expect(result.labels).toContain('TELEFONE');
    });
  });
});

import { describe, expect, it } from 'vitest';
import type { MonthView } from '../domain/types';
import { buildInstallmentChartDataKey, buildPieChartDataKey } from '../hooks/useCharts';

function buildMonthView(overrides: Partial<MonthView> = {}): MonthView {
  return {
    fixedExpenses: [
      {
        id: 'fixed-1',
        name: 'Internet',
        amount: 120,
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
    installments: [
      {
        id: 'inst-1',
        name: 'Notebook',
        totalInstallments: 10,
        currentInstallment: 3,
        installmentValue: 250,
        card: 'nubank',
        category: 'eletronicos',
        startMonth: '2026-01',
        active: true,
        closedAt: null,
        paid: false,
      },
    ],
    revenues: [
      {
        id: 'rev-1',
        name: 'Salario',
        baseAmount: 5000,
        active: true,
        startMonth: '2026-01',
        endMonth: null,
        category: 'trabalho',
        notes: '',
      },
    ],
    totals: {
      receitas: 5000,
      despesasFixas: 120,
      installments: 250,
    },
    ...overrides,
  };
}

describe('useCharts data keys', () => {
  it('ignores data that is not rendered by the charts', () => {
    const base = buildMonthView();
    const changedRevenueOnly = buildMonthView({
      revenues: [{ ...base.revenues[0], baseAmount: 7000 }],
      totals: { ...base.totals, receitas: 7000 },
    });

    expect(buildPieChartDataKey(changedRevenueOnly, 'cards')).toBe(
      buildPieChartDataKey(base, 'cards')
    );
    expect(buildInstallmentChartDataKey(changedRevenueOnly)).toBe(
      buildInstallmentChartDataKey(base)
    );
  });

  it('changes the pie key when tracked expenses change', () => {
    const base = buildMonthView();
    const changedFixedExpense = buildMonthView({
      fixedExpenses: [{ ...base.fixedExpenses[0], amount: 180 }],
    });

    expect(buildPieChartDataKey(changedFixedExpense, 'categories')).not.toBe(
      buildPieChartDataKey(base, 'categories')
    );
  });

  it('changes the installment key when installment chart fields change', () => {
    const base = buildMonthView();
    const changedInstallment = buildMonthView({
      installments: [{ ...base.installments[0], currentInstallment: 4 }],
    });

    expect(buildInstallmentChartDataKey(changedInstallment)).not.toBe(
      buildInstallmentChartDataKey(base)
    );
  });
});

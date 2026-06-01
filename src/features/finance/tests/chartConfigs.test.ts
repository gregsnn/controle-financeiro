import { describe, expect, it } from 'vitest';
import type { MonthView } from '../domain/types';
import {
  buildInstallmentBarConfig,
  hasInstallmentBarData,
} from '../lib/charts/installmentBarConfig';
import { buildPieChartConfig, hasPieChartData } from '../lib/charts/pieConfig';

const monthView: MonthView = {
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
      paid: true,
    },
    {
      id: 'fixed-2',
      name: 'Aluguel',
      amount: 2000,
      dueDay: 5,
      category: 'casa',
      paymentMethod: 'boleto',
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
      currentInstallment: 4,
      installmentValue: 300,
      card: 'nubank',
      category: 'eletronicos',
      startMonth: '2026-01',
      active: true,
      closedAt: null,
      paid: false,
    },
  ],
  revenues: [],
  totals: { despesasFixas: 2120, receitas: 0, installments: 300 },
};

describe('chart configs', () => {
  it('builds every summary chart mode with readable axis/legend settings', () => {
    expect(hasPieChartData(monthView, 'categories')).toBe(true);
    expect(hasPieChartData(monthView, 'cards')).toBe(true);
    expect(hasPieChartData(monthView, 'cardsStatus')).toBe(true);

    const categoryConfig = buildPieChartConfig(monthView, 'categories');
    const cardConfig = buildPieChartConfig(monthView, 'cards');
    const statusConfig = buildPieChartConfig(monthView, 'cardsStatus');

    expect(categoryConfig?.type).toBe('doughnut');
    expect(cardConfig?.type).toBe('doughnut');
    expect(statusConfig?.type).toBe('bar');
    expect(statusConfig?.options.plugins.legend.display).toBe(true);
    expect(statusConfig?.options.scales.x.ticks.color).toBeDefined();
    expect(statusConfig?.options.scales.y.ticks.color).toBeDefined();
  });

  it('builds installment chart config and preserves empty state detection', () => {
    expect(hasInstallmentBarData(monthView)).toBe(true);

    const installmentConfig = buildInstallmentBarConfig(monthView);
    expect(installmentConfig?.type).toBe('bar');
    expect(installmentConfig?.options.scales.x.ticks.color).toBeDefined();
    expect(installmentConfig?.options.scales.y.ticks.color).toBeDefined();

    expect(hasInstallmentBarData({ ...monthView, installments: [] })).toBe(false);
    expect(buildInstallmentBarConfig({ ...monthView, installments: [] })).toBeNull();
  });
});

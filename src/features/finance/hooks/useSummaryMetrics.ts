import { useMemo } from 'react';
import type { MonthView } from '../domain/types';

type PieMode = 'categories' | 'cards' | 'cardsStatus';

export function useSummaryMetrics(monthView: MonthView, pieMode: PieMode) {
  return useMemo(() => {
    const pieTitle =
      pieMode === 'cards'
        ? 'GASTOS POR CARTAO'
        : pieMode === 'cardsStatus'
          ? 'PAGO E PENDENTE'
          : 'PARA ONDE O DINHEIRO VAI';

    const pieAriaLabel =
      pieMode === 'cards'
        ? 'Pizza com distribuicao de despesas por cartao'
        : pieMode === 'cardsStatus'
          ? 'Barras com comparativo de pago e a pagar por cartao'
          : 'Pizza de categorias de despesa';

    const totalRestante = monthView.installments.reduce((sum, item) => {
      const remaining = item.totalInstallments - item.currentInstallment;
      return sum + remaining * Number(item.installmentValue);
    }, 0);

    const almostDone = monthView.installments.filter(
      (item) => item.currentInstallment / item.totalInstallments >= 0.75
    ).length;

    return { pieTitle, pieAriaLabel, totalRestante, almostDone };
  }, [monthView, pieMode]);
}

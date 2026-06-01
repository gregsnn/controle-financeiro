import { fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { SummaryDashboard } from '../components/summary/SummaryDashboard';
import type { MonthView } from '../domain/types';

const monthView: MonthView = {
  fixedExpenses: [
    {
      id: 'fixed-1',
      name: 'Internet',
      amount: 10,
      dueDay: 10,
      category: 'telefone',
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
      id: 'installment-1',
      name: 'Mac',
      totalInstallments: 10,
      currentInstallment: 8,
      installmentValue: 10,
      card: 'nubank',
      category: 'eletronicos',
      startMonth: '2026-01',
      active: true,
      closedAt: null,
      paid: false,
    },
  ],
  revenues: [],
  totals: { despesasFixas: 10, receitas: 0, installments: 10 },
};

describe('SummaryDashboard.tsx', () => {
  it('uses calmer labels for charts and support KPIs', () => {
    const { rerender } = render(
      <SummaryDashboard
        monthView={monthView}
        monthCardBills={{}}
        monthOverrides={[]}
        currentMonthKey="2026-05"
        pieMode="categories"
        setPieMode={vi.fn()}
        pieChartRef={createRef<HTMLCanvasElement>()}
        barChartRef={createRef<HTMLCanvasElement>()}
        onToggleMonthPaid={vi.fn()}
        cardList={[]}
      />
    );

    expect(screen.getByText('PARA ONDE O DINHEIRO VAI')).toBeInTheDocument();
    expect(screen.getByText('PARCELAS EM ABERTO')).toBeInTheDocument();
    expect(screen.getByText('PARCELAS DESTE MES')).toBeInTheDocument();
    expect(screen.getByText('PARCELAS FUTURAS')).toBeInTheDocument();
    expect(screen.getByText('PERTO DE QUITAR')).toBeInTheDocument();
    expect(screen.queryByText('TOTAL/MES')).not.toBeInTheDocument();
    expect(screen.queryByText('TOTAL RESTANTE')).not.toBeInTheDocument();
    expect(screen.queryByText('QUASE NO FIM')).not.toBeInTheDocument();
    expect(screen.getByText('100%', { selector: '.chart-insight-percent' })).toBeInTheDocument();
    expect(screen.getByText('Principal foco')).toBeInTheDocument();
    expect(
      screen.getByText('TELEFONE', { selector: '.chart-insight-list-row span' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Mac concentra a maior parte das parcelas deste mes.')
    ).toBeInTheDocument();
    expect(screen.getByText('1 em aberto')).toBeInTheDocument();

    rerender(
      <SummaryDashboard
        monthView={monthView}
        monthCardBills={{}}
        monthOverrides={[]}
        currentMonthKey="2026-05"
        pieMode="cards"
        setPieMode={vi.fn()}
        pieChartRef={createRef<HTMLCanvasElement>()}
        barChartRef={createRef<HTMLCanvasElement>()}
        onToggleMonthPaid={vi.fn()}
        cardList={[]}
      />
    );

    expect(screen.getByText('GASTOS POR CARTAO')).toBeInTheDocument();

    rerender(
      <SummaryDashboard
        monthView={monthView}
        monthCardBills={{}}
        monthOverrides={[]}
        currentMonthKey="2026-05"
        pieMode="cardsStatus"
        setPieMode={vi.fn()}
        pieChartRef={createRef<HTMLCanvasElement>()}
        barChartRef={createRef<HTMLCanvasElement>()}
        onToggleMonthPaid={vi.fn()}
        cardList={[]}
      />
    );

    expect(screen.getByText('PAGO E PENDENTE')).toBeInTheDocument();
  });

  it('offers a discreet shortcut to the cards tab', () => {
    const onOpenCards = vi.fn();

    render(
      <SummaryDashboard
        monthView={monthView}
        monthCardBills={{}}
        monthOverrides={[]}
        currentMonthKey="2026-05"
        pieMode="categories"
        setPieMode={vi.fn()}
        pieChartRef={createRef<HTMLCanvasElement>()}
        barChartRef={createRef<HTMLCanvasElement>()}
        onToggleMonthPaid={vi.fn()}
        cardList={[]}
        onOpenCards={onOpenCards}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Ver cartoes' }));

    expect(onOpenCards).toHaveBeenCalledTimes(1);
  });

  it('keeps chart mode controls scoped to the chart card', () => {
    render(
      <SummaryDashboard
        monthView={monthView}
        monthCardBills={{}}
        monthOverrides={[]}
        currentMonthKey="2026-05"
        pieMode="categories"
        setPieMode={vi.fn()}
        pieChartRef={createRef<HTMLCanvasElement>()}
        barChartRef={createRef<HTMLCanvasElement>()}
        onToggleMonthPaid={vi.fn()}
        cardList={[]}
      />
    );

    expect(screen.getByRole('tab', { name: 'Categorias' }).closest('.chart-switch')).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Cartoes' }).closest('.chart-switch')).toBeTruthy();
    expect(
      screen.getByRole('tab', { name: 'Pago x pendente' }).closest('.chart-switch')
    ).toBeTruthy();
  });
});

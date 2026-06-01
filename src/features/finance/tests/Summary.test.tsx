import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Summary from '../components/Summary';
import { OVERRIDE_TYPES } from '../domain/constants';
import type { MonthOverride, MonthView } from '../domain/types';

const monthView: MonthView = {
  fixedExpenses: [],
  installments: [],
  revenues: [
    {
      id: 'revenue-1',
      name: 'Salario',
      baseAmount: 10000,
      active: true,
      startMonth: '2026-01',
      endMonth: null,
      category: 'outro',
      notes: '',
    },
  ],
  totals: { despesasFixas: 0, receitas: 10000, installments: 0 },
};

describe('Summary.tsx', () => {
  it('shows a comfortable month message when the forecast has margin', () => {
    render(
      <Summary
        monthView={monthView}
        cardBills={{}}
        monthOverrides={[]}
        currentMonthKey="2026-05"
        onToggleBillPaid={vi.fn()}
        cardList={[]}
      />
    );

    expect(screen.getByText('Seu mes ainda tem margem.')).toBeInTheDocument();
    expect(screen.queryByText(/Revise despesas e faturas/)).not.toBeInTheDocument();
  });

  it('shows a tight month message when the forecast is positive with little margin', () => {
    render(
      <Summary
        monthView={monthView}
        cardBills={{ nubank: 9950 }}
        monthOverrides={[]}
        currentMonthKey="2026-05"
        onToggleBillPaid={vi.fn()}
        cardList={[{ key: 'nubank', label: 'Nubank' }]}
      />
    );

    expect(screen.getByText('Seu mes esta positivo, mas com pouca folga.')).toBeInTheDocument();
    expect(screen.queryByText(/Revise despesas e faturas/)).not.toBeInTheDocument();
  });

  it('shows an orientative message instead of repeating the negative balance', () => {
    render(
      <Summary
        monthView={monthView}
        cardBills={{ nubank: 12000 }}
        monthOverrides={[]}
        currentMonthKey="2026-05"
        onToggleBillPaid={vi.fn()}
        cardList={[{ key: 'nubank', label: 'Nubank' }]}
      />
    );

    expect(
      screen.getByText('Este mes precisa de atencao para fechar no positivo.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Revise despesas e faturas para entender onde ajustar este mes.')
    ).toBeInTheDocument();
    expect(
      screen
        .getByText('Revise despesas e faturas para entender onde ajustar este mes.')
        .closest('.alert-bar')
    ).toHaveClass('alert-bar--guidance');
    expect(screen.queryByText(/Despesas superam receitas em/)).not.toBeInTheDocument();
  });

  it('uses human expense ratio copy for healthy, high and missing revenue scenarios', () => {
    const { rerender } = render(
      <Summary
        monthView={monthView}
        cardBills={{ nubank: 5000 }}
        monthOverrides={[]}
        currentMonthKey="2026-05"
        onToggleBillPaid={vi.fn()}
        cardList={[{ key: 'nubank', label: 'Nubank' }]}
      />
    );

    expect(screen.getByText('50% da receita')).toBeInTheDocument();

    rerender(
      <Summary
        monthView={monthView}
        cardBills={{ nubank: 9500 }}
        monthOverrides={[]}
        currentMonthKey="2026-05"
        onToggleBillPaid={vi.fn()}
        cardList={[{ key: 'nubank', label: 'Nubank' }]}
      />
    );

    expect(screen.getByText('quase toda a receita')).toBeInTheDocument();

    rerender(
      <Summary
        monthView={monthView}
        cardBills={{ nubank: 12000 }}
        monthOverrides={[]}
        currentMonthKey="2026-05"
        onToggleBillPaid={vi.fn()}
        cardList={[{ key: 'nubank', label: 'Nubank' }]}
      />
    );

    expect(screen.getByText('acima da receita do mes')).toBeInTheDocument();
    expect(screen.getByText('Priorize faturas')).toBeInTheDocument();
    expect(screen.getByTitle('Priorize faturas e gastos recorrentes.')).toBeInTheDocument();

    rerender(
      <Summary
        monthView={{ ...monthView, revenues: [], totals: { ...monthView.totals, receitas: 0 } }}
        cardBills={{ nubank: 12000 }}
        monthOverrides={[]}
        currentMonthKey="2026-05"
        onToggleBillPaid={vi.fn()}
        cardList={[{ key: 'nubank', label: 'Nubank' }]}
      />
    );

    expect(screen.getByText('sem receita cadastrada')).toBeInTheDocument();
  });

  it('renders bill summary states for paid, pending, zero and high value cards', () => {
    const onToggleBillPaid = vi.fn();
    const monthOverrides: MonthOverride[] = [
      {
        id: 'paid-bill',
        monthKey: '2026-05',
        type: OVERRIDE_TYPES.CARD_BILL_PAYMENT,
        itemId: 'nubank',
        paid: true,
      },
      {
        id: 'pending-bill',
        monthKey: '2026-05',
        type: OVERRIDE_TYPES.CARD_BILL_PAYMENT,
        itemId: 'santander',
        paid: false,
      },
    ];

    render(
      <Summary
        monthView={monthView}
        cardBills={{ nubank: 1234.56, santander: 98765.43, semValor: 0 }}
        monthOverrides={monthOverrides}
        currentMonthKey="2026-05"
        onToggleBillPaid={onToggleBillPaid}
        cardList={[
          { key: 'nubank', label: 'Nubank' },
          { key: 'santander', label: 'Santander' },
          { key: 'semValor', label: 'Sem valor' },
        ]}
      />
    );

    expect(screen.getByText('FATURA NUBANK')).toBeInTheDocument();
    expect(screen.getByText('FATURA SANTANDER')).toBeInTheDocument();
    expect(screen.getByText('FATURA SEM VALOR')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /Paga/ })).toBeInTheDocument();
    const pendingButton = screen.getByRole('button', { name: /Pendente/ });
    expect(pendingButton).toBeInTheDocument();

    const paidBillCard = screen.getByText('FATURA NUBANK').closest('.bill-summary-card');
    const pendingBillCard = screen.getByText('FATURA SANTANDER').closest('.bill-summary-card');
    const emptyBillCard = screen.getByText('FATURA SEM VALOR').closest('.bill-summary-card');
    expect(paidBillCard).not.toBeNull();
    expect(pendingBillCard).not.toBeNull();
    expect(emptyBillCard).not.toBeNull();
    expect(paidBillCard).toHaveTextContent('R$ 1.234,56');
    expect(pendingBillCard).toHaveTextContent('R$ 98.765,43');
    expect(paidBillCard).toHaveTextContent('Restante: R$ 1.234,56');
    expect(paidBillCard).not.toHaveTextContent('Abatimento: R$ 0,00');
    expect(emptyBillCard).toHaveTextContent('Sem fatura lancada');
    expect(emptyBillCard).not.toHaveTextContent('R$ 0,00');
    expect(emptyBillCard?.querySelector('.bill-pay-btn')).toBeNull();

    fireEvent.click(pendingButton);
    expect(onToggleBillPaid).toHaveBeenCalledWith('santander', true);
  });
});

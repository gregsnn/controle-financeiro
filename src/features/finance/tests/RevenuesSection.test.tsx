import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RevenuesSection } from '../components/sections/RevenuesSection';

describe('RevenuesSection.tsx', () => {
  const defaultProps = {
    items: [],
    currentMonthKey: '2026-04',
    monthRevenueAmounts: {},
    onAdd: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onMonthRevenueAmount: vi.fn(),
  };

  it('uses FinFlow-style revenue summary cards', () => {
    render(
      <RevenuesSection
        {...defaultProps}
        items={[
          {
            id: 'r1',
            name: 'Salario',
            baseAmount: 999.99,
            paymentDay: 5,
            recurring: true,
            active: true,
            startMonth: '2026-01',
            endMonth: null,
            notes: '',
          },
        ]}
      />
    );

    expect(screen.getByText('TOTAL DO MES')).toBeInTheDocument();
    expect(screen.getByText('JA RECEBIDO')).toBeInTheDocument();
    expect(screen.getByText('A RECEBER')).toBeInTheDocument();
    expect(screen.queryByText('LANCAMENTOS')).not.toBeInTheDocument();
    expect(screen.queryByText('MEDIA')).not.toBeInTheDocument();
  });

  it('creates revenue with payment day and recurrence', () => {
    const onAdd = vi.fn();
    render(<RevenuesSection {...defaultProps} onAdd={onAdd} />);

    fireEvent.click(screen.getByRole('button', { name: 'Nova receita' }));
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Freelance' } });
    fireEvent.change(screen.getByLabelText('Valor'), { target: { value: '1.200,00' } });
    fireEvent.change(screen.getByLabelText('Dia de recebimento'), { target: { value: '12' } });
    fireEvent.change(screen.getByLabelText('Recorrente'), { target: { value: 'nao' } });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar receita' }));

    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Freelance',
        baseAmount: 1200,
        paymentDay: 12,
        recurring: false,
        startMonth: '2026-04',
      })
    );
  });
});

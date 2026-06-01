import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FixedExpensesSection } from '../components/sections/FixedExpensesSection';

describe('FixedExpensesSection.tsx', () => {
  const defaultProps = {
    items: [],
    currentMonthKey: '2026-04',
    monthOverrides: [],
    onAdd: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onTogglePaid: vi.fn(),
  };

  it('includes new cards in the payment method options', () => {
    render(<FixedExpensesSection {...defaultProps} cardList={[{ id: 'amex', name: 'Amex' }]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Nova despesa fixa' }));

    const paymentSelect = screen.getByLabelText('Forma de pagamento') as HTMLSelectElement;
    expect(Array.from(paymentSelect.options).map((option) => option.textContent)).toContain('Amex');
  });

  it('shows the month override amount in the section total', () => {
    render(
      <FixedExpensesSection
        {...defaultProps}
        items={[
          {
            id: 'luz',
            name: 'Luz',
            amount: 100,
            dueDay: 10,
            category: 'contas',
            paymentMethod: 'pix',
            active: true,
            startMonth: '2026-01',
            endMonth: null,
            notes: '',
          },
        ]}
        monthOverrides={[
          {
            id: 'ovr-1',
            type: 'fixedExpense',
            itemId: 'luz',
            monthKey: '2026-04',
            amount: 50,
          },
        ]}
      />
    );

    expect(screen.getByText(/1 lancamento/i)).toHaveTextContent('R$ 50,00');
  });
});

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
    render(
      <FixedExpensesSection
        {...defaultProps}
        cardList={[{ id: 'amex', name: 'Amex', icon: '💠' }]}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '+ Novo gasto fixo' }));

    const paymentSelect = screen.getByLabelText('Forma de pagamento') as HTMLSelectElement;
    expect(Array.from(paymentSelect.options).map((option) => option.textContent)).toContain('Amex');
  });
});

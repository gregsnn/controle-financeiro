import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { InstallmentsSection } from '../components/sections/InstallmentsSection';

describe('InstallmentsSection.tsx', () => {
  const defaultProps = {
    items: [],
    currentMonthKey: '2026-04',
    monthOverrides: [],
    onAdd: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onTogglePaid: vi.fn(),
  };

  it('includes new cards in the installment card options', () => {
    render(
      <InstallmentsSection
        {...defaultProps}
        cardList={[{ id: 'amex', name: 'Amex', icon: '💠' }]}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '+ Novo parcelamento' }));

    const cardSelect = screen.getByLabelText('Cartão') as HTMLSelectElement;
    expect(Array.from(cardSelect.options).map((option) => option.textContent)).toContain('Amex');
  });
});

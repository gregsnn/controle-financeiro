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
    render(<InstallmentsSection {...defaultProps} cardList={[{ id: 'amex', name: 'Amex' }]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Novo parcelamento' }));

    const cardSelect = screen.getByLabelText('Cartão') as HTMLSelectElement;
    expect(Array.from(cardSelect.options).map((option) => option.textContent)).toContain('Amex');
  });

  it('shows paid amount with total purchase amount in installment cards', () => {
    render(
      <InstallmentsSection
        {...defaultProps}
        items={[
          {
            id: 'inst-1',
            name: 'FH6',
            installmentValue: 86.94,
            totalInstallments: 6,
            currentInstallment: 1,
            startMonth: '2026-05',
            card: 'santander',
          },
        ]}
        cardList={[{ id: 'santander', name: 'Santander' }]}
      />
    );

    expect(screen.getByText('R$ 86,94 de R$ 521,64 pagos')).toBeInTheDocument();
  });

  it('shows recently added installments first by default', () => {
    render(
      <InstallmentsSection
        {...defaultProps}
        items={[
          {
            id: 'inst-1',
            name: 'Primeiro cadastro',
            installmentValue: 900,
            totalInstallments: 2,
            currentInstallment: 1,
            startMonth: '2026-01',
            card: 'nubank',
          },
          {
            id: 'inst-2',
            name: 'Ultimo cadastro',
            installmentValue: 100,
            totalInstallments: 12,
            currentInstallment: 1,
            startMonth: '2026-01',
            card: 'itau',
          },
        ]}
      />
    );

    const names = screen
      .getAllByRole('heading', { level: 3 })
      .map((heading) => heading.textContent);
    expect(names).toEqual(['Ultimo cadastro', 'Primeiro cadastro']);
  });

  it('filters installments close to payoff', () => {
    render(
      <InstallmentsSection
        {...defaultProps}
        items={[
          {
            id: 'inst-1',
            name: 'Quase fim',
            installmentValue: 100,
            totalInstallments: 10,
            currentInstallment: 8,
            startMonth: '2026-01',
            card: 'nubank',
          },
          {
            id: 'inst-2',
            name: 'Comecando',
            installmentValue: 300,
            totalInstallments: 10,
            currentInstallment: 2,
            startMonth: '2026-01',
            card: 'itau',
          },
        ]}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Perto de quitar' }));

    expect(screen.getByText('Quase fim')).toBeInTheDocument();
    expect(screen.queryByText('Comecando')).not.toBeInTheDocument();
  });

  it('orders installments by total purchase amount', () => {
    render(
      <InstallmentsSection
        {...defaultProps}
        items={[
          {
            id: 'inst-1',
            name: 'Parcela alta',
            installmentValue: 300,
            totalInstallments: 2,
            currentInstallment: 1,
            startMonth: '2026-01',
            card: 'nubank',
          },
          {
            id: 'inst-2',
            name: 'Total alto',
            installmentValue: 100,
            totalInstallments: 12,
            currentInstallment: 1,
            startMonth: '2026-01',
            card: 'itau',
          },
        ]}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Maior total' }));

    const names = screen
      .getAllByRole('heading', { level: 3 })
      .map((heading) => heading.textContent);
    expect(names).toEqual(['Total alto', 'Parcela alta']);
  });
});

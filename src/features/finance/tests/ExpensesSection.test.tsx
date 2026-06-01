import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ExpensesSection } from '../components/sections/ExpensesSection';

function mockLocalStorage() {
  const store = new Map<string, string>();
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
    },
  });
}

describe('ExpensesSection.tsx', () => {
  beforeEach(() => {
    mockLocalStorage();
    vi.clearAllMocks();
  });

  const defaultProps = {
    items: [],
    variableItems: [],
    currentMonthKey: '2026-04',
    monthOverrides: [],
    onAdd: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onAddVariable: vi.fn(),
    onEditVariable: vi.fn(),
    onDeleteVariable: vi.fn(),
    onToggleVariablePaid: vi.fn(),
    onTogglePaid: vi.fn(),
  };

  it('presents fixed and variable expense modes', () => {
    render(<ExpensesSection {...defaultProps} />);

    expect(screen.getByRole('tab', { name: 'Fixas' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Variaveis' })).toBeEnabled();
    expect(screen.getByText('DESPESAS FIXAS')).toBeInTheDocument();
  });

  it('creates a variable expense from the quick form', () => {
    const onAddVariable = vi.fn();
    render(<ExpensesSection {...defaultProps} onAddVariable={onAddVariable} />);

    fireEvent.click(screen.getByRole('tab', { name: 'Variaveis' }));
    fireEvent.click(screen.getByRole('button', { name: 'Nova despesa variavel' }));
    fireEvent.change(screen.getByLabelText('Descricao'), { target: { value: 'Mercado' } });
    fireEvent.change(screen.getByLabelText('Valor'), { target: { value: '123,45' } });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar despesa' }));

    expect(screen.getByRole('tab', { name: 'Variaveis' })).toHaveAttribute('aria-selected', 'true');
    expect(onAddVariable).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Mercado',
        amount: 123.45,
        monthKey: '2026-04',
        category: 'outro',
        paymentMethod: 'pix',
        paid: true,
      })
    );
  });

  it('creates a variable expense from the inline quick add row', () => {
    const onAddVariable = vi.fn();
    render(<ExpensesSection {...defaultProps} onAddVariable={onAddVariable} />);

    fireEvent.click(screen.getByRole('tab', { name: 'Variaveis' }));
    fireEvent.change(screen.getByLabelText('Descricao rapida'), {
      target: { value: 'Padaria' },
    });
    fireEvent.change(screen.getByLabelText('Valor rapido'), { target: { value: '32,10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }));

    expect(onAddVariable).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Padaria',
        amount: 32.1,
        monthKey: '2026-04',
        category: 'outro',
        paymentMethod: 'pix',
        paid: true,
      })
    );
  });

  it('persists simple preferences from the last variable expense form', async () => {
    const onAddVariable = vi.fn();
    render(
      <ExpensesSection
        {...defaultProps}
        cardList={[{ id: 'itau', name: 'Itau' }]}
        onAddVariable={onAddVariable}
      />
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Variaveis' }));
    fireEvent.click(screen.getByRole('button', { name: 'Nova despesa variavel' }));
    fireEvent.change(screen.getByLabelText('Descricao'), { target: { value: 'Mercado' } });
    fireEvent.change(screen.getByLabelText('Valor'), { target: { value: '100,00' } });
    fireEvent.change(screen.getByLabelText('Categoria'), { target: { value: 'telefone' } });
    fireEvent.change(screen.getByLabelText('Pagamento'), { target: { value: 'cartao' } });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar despesa' }));

    await waitFor(() =>
      expect(onAddVariable).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'telefone',
          paymentMethod: 'cartao',
          card: 'itau',
          paid: false,
        })
      )
    );

    fireEvent.click(screen.getByRole('button', { name: 'Nova despesa variavel' }));

    await waitFor(() => expect(screen.getByLabelText('Categoria')).toHaveValue('telefone'));
    expect(screen.getByLabelText('Pagamento')).toHaveValue('cartao');
    expect(screen.getByLabelText('Cartao')).toHaveValue('itau');
  });

  it('uses saved preferences in the inline quick add row', async () => {
    const onAddVariable = vi.fn();
    render(
      <ExpensesSection
        {...defaultProps}
        cardList={[{ id: 'itau', name: 'Itau' }]}
        onAddVariable={onAddVariable}
      />
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Variaveis' }));
    fireEvent.click(screen.getByRole('button', { name: 'Nova despesa variavel' }));
    fireEvent.change(screen.getByLabelText('Descricao'), { target: { value: 'Mercado' } });
    fireEvent.change(screen.getByLabelText('Valor'), { target: { value: '100,00' } });
    fireEvent.change(screen.getByLabelText('Categoria'), { target: { value: 'telefone' } });
    fireEvent.change(screen.getByLabelText('Pagamento'), { target: { value: 'cartao' } });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar despesa' }));

    await waitFor(() => expect(onAddVariable).toHaveBeenCalledTimes(1));

    fireEvent.change(screen.getByLabelText('Descricao rapida'), {
      target: { value: 'Farmacia' },
    });
    fireEvent.change(screen.getByLabelText('Valor rapido'), { target: { value: '45,00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }));

    await waitFor(() =>
      expect(onAddVariable).toHaveBeenLastCalledWith(
        expect.objectContaining({
          name: 'Farmacia',
          category: 'telefone',
          paymentMethod: 'cartao',
          card: 'itau',
          paid: false,
        })
      )
    );
  });

  it('toggles variable expense paid status from the table row', () => {
    const onToggleVariablePaid = vi.fn();
    render(
      <ExpensesSection
        {...defaultProps}
        onToggleVariablePaid={onToggleVariablePaid}
        variableItems={[
          {
            id: 'var-1',
            name: 'Mercado',
            amount: 123.45,
            date: '2026-04-10',
            monthKey: '2026-04',
            category: 'outro',
            paymentMethod: 'pix',
            card: null,
            paid: false,
            notes: '',
          },
        ]}
      />
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Variaveis' }));
    fireEvent.click(screen.getByLabelText('Marcar Mercado como pago'));

    expect(onToggleVariablePaid).toHaveBeenCalledWith('var-1', true);
  });
});

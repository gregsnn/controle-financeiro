import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import MonthNav from '../components/MonthNav';
import { DEFAULT_CARD_BILLS } from '../lib/schema';

describe('MonthNav.tsx', () => {
  const defaultProps = {
    label: 'Abril 2026',
    onPrev: vi.fn(),
    onNext: vi.fn(),
    theme: 'default' as const,
    onToggleTheme: vi.fn(),
    cardBills: {},
    onSetCardBill: vi.fn(),
    cardList: DEFAULT_CARD_BILLS,
  };

  it('renders month label', () => {
    render(<MonthNav {...defaultProps} />);
    expect(screen.getByText('Abril 2026')).toBeInTheDocument();
  });

  it('renders navigation buttons', () => {
    render(<MonthNav {...defaultProps} />);
    expect(screen.getByLabelText('Mes anterior')).toBeInTheDocument();
    expect(screen.getByLabelText('Proximo mes')).toBeInTheDocument();
  });

  it('calls onPrev when previous button clicked', () => {
    const onPrev = vi.fn();
    render(<MonthNav {...defaultProps} onPrev={onPrev} />);
    fireEvent.click(screen.getByLabelText('Mes anterior'));
    expect(onPrev).toHaveBeenCalledTimes(1);
  });

  it('calls onNext when next button clicked', () => {
    const onNext = vi.fn();
    render(<MonthNav {...defaultProps} onNext={onNext} />);
    fireEvent.click(screen.getByLabelText('Proximo mes'));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('renders theme button', () => {
    render(<MonthNav {...defaultProps} />);
    expect(screen.getByLabelText(/Mudar para tema/)).toBeInTheDocument();
    expect(screen.getByText('Escuro')).toBeInTheDocument();
  });

  it('shows "Claro" when theme is premium', () => {
    render(<MonthNav {...defaultProps} theme="premium" />);
    expect(screen.getByText('Claro')).toBeInTheDocument();
  });

  it('calls onToggleTheme when theme button clicked', () => {
    const onToggleTheme = vi.fn();
    render(<MonthNav {...defaultProps} onToggleTheme={onToggleTheme} />);
    fireEvent.click(screen.getByLabelText(/Mudar para tema/));
    expect(onToggleTheme).toHaveBeenCalledTimes(1);
  });

  it('renders card bill inputs', () => {
    render(
      <MonthNav
        {...defaultProps}
        cardList={[
          { id: 'nubank', name: 'Nubank', icon: '💙' },
          { id: 'santander', name: 'Santander', icon: '🔴' },
        ]}
      />
    );
    expect(screen.getByText('Nubank')).toBeInTheDocument();
    expect(screen.getByText('Santander')).toBeInTheDocument();
  });

  it('renders card bill inputs with values', () => {
    render(
      <MonthNav
        {...defaultProps}
        cardList={[{ id: 'nubank', name: 'Nubank', icon: '💙' }]}
        cardBills={{ nubank: 500 }}
      />
    );
    expect(screen.getByText('Nubank')).toBeInTheDocument();
    expect(screen.getByText(/500,00/)).toBeInTheDocument();
  });

  it('renders card bill panel title', () => {
    render(<MonthNav {...defaultProps} />);
    expect(screen.getByText('Faturas do mês')).toBeInTheDocument();
  });

  it('hides "+ Novo cartão" when there are no cards', () => {
    render(<MonthNav {...defaultProps} cardList={[]} onSetCardList={vi.fn()} />);
    expect(screen.queryByText('+ Novo cartão')).not.toBeInTheDocument();
    expect(screen.getByText('Nenhum cartão adicionado')).toBeInTheDocument();
  });

  it('renders the card icon before the card name', () => {
    render(
      <MonthNav {...defaultProps} cardList={[{ id: 'nubank', name: 'Nubank', icon: '💜' }]} />
    );

    const card = screen.getByText('Nubank').closest('.bill-card');
    expect(card).not.toBeNull();

    const head = card?.querySelector('.bill-card-ident');
    expect(head).not.toBeNull();
    expect(head?.firstElementChild).toHaveTextContent('💜');
    expect(head?.lastElementChild).toHaveTextContent('Apagar');
  });

  it('adds a new card to the list', () => {
    const onSetCardList = vi.fn();
    render(
      <MonthNav
        {...defaultProps}
        cardList={[{ id: 'nubank', name: 'Nubank', icon: '💜' }]}
        onSetCardList={onSetCardList}
      />
    );

    fireEvent.click(screen.getByText('+ Novo cartão'));
    fireEvent.change(screen.getByPlaceholderText('Nome do cartão'), {
      target: { value: 'Cartao novo' },
    });
    fireEvent.click(screen.getByText('Adicionar'));

    expect(onSetCardList).toHaveBeenCalledWith([
      { id: 'nubank', name: 'Nubank', icon: '💜' },
      { id: 'cartao-novo', name: 'Cartao novo', icon: '💳' },
    ]);
  });

  it('asks for confirmation before deleting a card', () => {
    const onSetCardList = vi.fn();
    const onSetCardBill = vi.fn();

    render(
      <MonthNav
        {...defaultProps}
        cardList={[{ id: 'nubank', name: 'Nubank', icon: '💜' }]}
        onSetCardList={onSetCardList}
        onSetCardBill={onSetCardBill}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Apagar cartão Nubank' }));
    expect(screen.getByText('Apagar cartão')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Apagar' }));

    expect(onSetCardList).toHaveBeenCalledWith([]);
    expect(onSetCardBill).toHaveBeenCalledWith('nubank', null);
  });

  it('disables delete when a card is in use', () => {
    render(
      <MonthNav
        {...defaultProps}
        cardList={[{ id: 'nubank', name: 'Nubank', icon: '💜' }]}
        cardDeleteReasons={{ nubank: 'Usado em uma despesa fixa' }}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /Cartão Nubank em uso/ });
    expect(deleteButton).toBeDisabled();
    expect(within(deleteButton).getByText('Em uso')).toBeInTheDocument();
  });
});

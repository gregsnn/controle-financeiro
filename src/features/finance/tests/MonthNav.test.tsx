import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import MonthNav from '../components/MonthNav';

describe('MonthNav.tsx', () => {
  const defaultProps = {
    label: 'Abril 2026',
    onPrev: vi.fn(),
    onNext: vi.fn(),
    theme: 'default' as const,
    onToggleTheme: vi.fn(),
    cardBills: {},
    onSetCardBill: vi.fn(),
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
    render(<MonthNav {...defaultProps} />);
    expect(screen.getByText('Nubank')).toBeInTheDocument();
    expect(screen.getByText('Santander')).toBeInTheDocument();
  });

  it('renders card bill inputs with values', () => {
    render(<MonthNav {...defaultProps} cardBills={{ nubank: 500 }} />);
    expect(screen.getByText('Nubank')).toBeInTheDocument();
  });

  it('renders card bill panel title', () => {
    render(<MonthNav {...defaultProps} />);
    expect(screen.getByText('Faturas do mês')).toBeInTheDocument();
  });
});
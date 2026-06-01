import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { QuickCaptureBar } from '../components/capture/QuickCaptureBar';
import type { CaptureExecutorActions } from '../capture/executor';
import { captureTestContext } from './captureFixtures';

function actions(): CaptureExecutorActions {
  return {
    addVariableExpense: vi.fn(),
    addFixedExpense: vi.fn(),
    addInstallment: vi.fn(),
    addRevenue: vi.fn(),
    setMonthCardBill: vi.fn(),
    setCardBillPaid: vi.fn(),
    setFixedExpensePaid: vi.fn(),
    setInstallmentPaid: vi.fn(),
  };
}

describe('QuickCaptureBar', () => {
  it('executes high-confidence capture on submit', async () => {
    const executorActions = actions();
    render(
      <QuickCaptureBar
        captureContext={captureTestContext}
        executorActions={executorActions}
        onReview={vi.fn()}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('Adicionar: "mercado 123,45"'), {
      target: { value: 'mercado 123,45' },
    });
    expect(screen.getByText('Despesa variavel')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Capturar' }));

    await waitFor(() => expect(executorActions.addVariableExpense).toHaveBeenCalledTimes(1));
    expect(screen.getByText('Salvo')).toBeInTheDocument();
  });

  it('routes low-confidence capture to review instead of executing', async () => {
    const executorActions = actions();
    const onReview = vi.fn();
    render(
      <QuickCaptureBar
        captureContext={captureTestContext}
        executorActions={executorActions}
        onReview={onReview}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('Adicionar: "mercado 123,45"'), {
      target: { value: 'cartao 200' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Capturar' }));

    await waitFor(() => expect(onReview).toHaveBeenCalledTimes(1));
    expect(executorActions.addVariableExpense).not.toHaveBeenCalled();
    expect(screen.getByText('Revisao necessaria')).toBeInTheDocument();
  });

  it('opens review with a suggested draft when a suggestion is selected', async () => {
    const onReview = vi.fn();
    render(
      <QuickCaptureBar
        captureContext={captureTestContext}
        executorActions={actions()}
        onReview={onReview}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('Adicionar: "mercado 123,45"'), {
      target: { value: 'notebook 2400 itau' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Parcelar' }));

    await waitFor(() => expect(onReview).toHaveBeenCalledTimes(1));
    expect(onReview).toHaveBeenCalledWith(expect.objectContaining({ intent: 'installment' }));
  });

  it('focuses the input with Ctrl+K', () => {
    render(
      <QuickCaptureBar
        captureContext={captureTestContext}
        executorActions={actions()}
        onReview={vi.fn()}
      />
    );

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });

    expect(screen.getByPlaceholderText('Adicionar: "mercado 123,45"')).toHaveFocus();
  });

  it('clears the current preview with Escape while focused', () => {
    render(
      <QuickCaptureBar
        captureContext={captureTestContext}
        executorActions={actions()}
        onReview={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText('Adicionar: "mercado 123,45"');
    fireEvent.change(input, { target: { value: 'mercado 123' } });
    expect(screen.getByText('Despesa variavel')).toBeInTheDocument();

    input.focus();
    fireEvent.keyDown(window, { key: 'Escape' });

    expect(screen.queryByText('Despesa variavel')).not.toBeInTheDocument();
  });

  it('clears the current value when the reset signal changes', () => {
    const { rerender } = render(
      <QuickCaptureBar
        captureContext={captureTestContext}
        executorActions={actions()}
        onReview={vi.fn()}
        resetSignal={0}
      />
    );

    const input = screen.getByPlaceholderText('Adicionar: "mercado 123,45"');
    fireEvent.change(input, { target: { value: 'cartao 200' } });
    expect(screen.getByText('Revisar lancamento')).toBeInTheDocument();

    rerender(
      <QuickCaptureBar
        captureContext={captureTestContext}
        executorActions={actions()}
        onReview={vi.fn()}
        resetSignal={1}
      />
    );

    expect(screen.queryByText('Revisar lancamento')).not.toBeInTheDocument();
  });
});
